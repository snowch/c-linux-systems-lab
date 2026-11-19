#define _GNU_SOURCE
#include "process-support.h"

static void terminal_session(void)
{
    int master = posix_openpt(O_RDWR | O_NOCTTY | O_CLOEXEC);
    require(master >= 0 && grantpt(master) == 0 && unlockpt(master) == 0, "open pseudoterminal");
    const char *name = ptsname(master);
    require(name != NULL, "find slave terminal");
    int tty = open(name, O_RDWR | O_NOCTTY | O_CLOEXEC);
    require(tty >= 0, "open slave terminal");
    require(setsid() >= 0 && ioctl(tty, TIOCSCTTY, 0) == 0, "create terminal session");
    struct termios settings;
    require(tcgetattr(tty, &settings) == 0, "read terminal settings");
    settings.c_lflag |= ISIG;
    const unsigned char suspend_key = 26;
    settings.c_cc[VSUSP] = suspend_key;
    require(tcsetattr(tty, TCSANOW, &settings) == 0, "configure terminal signal");
    require(signal(SIGHUP, SIG_IGN) != SIG_ERR && signal(SIGTTOU, SIG_IGN) != SIG_ERR &&
            signal(SIGTSTP, SIG_DFL) != SIG_ERR, "set supervisor signal dispositions");
    int channel[2];
    require(pipe2(channel, O_CLOEXEC) == 0, "pipe2");
    pid_t job = fork();
    require(job >= 0, "fork");
    if (job == 0) {
        close(channel[1]);
        if (setpgid(0, 0) < 0 || signal(SIGTSTP, SIG_DFL) == SIG_ERR)
            _exit(1);
        char release;
        _exit(read(channel[0], &release, 1) == 1 ? 0 : 1);
    }
    close(channel[0]);
    require(setpgid(job, job) == 0 && tcsetpgrp(tty, job) == 0, "give the job the terminal");
    unsigned char key = suspend_key;
    require(write(master, &key, 1) == 1, "send terminal suspend key");
    int status = collect(job, WUNTRACED);
    require(WIFSTOPPED(status) && WSTOPSIG(status) == SIGTSTP, "job stopped by terminal");
    puts("terminal sent SIGTSTP to the foreground job");
    require(tcsetpgrp(tty, getpgrp()) == 0, "reclaim terminal");
    require(kill(-job, SIGCONT) == 0 && write(channel[1], "x", 1) == 1, "resume job");
    close(channel[1]);
    status = collect(job, 0);
    require(WIFEXITED(status) && WEXITSTATUS(status) == 0, "job exited");
    puts("supervisor resumed and reaped the job");
    close(tty);
    close(master);
}

static void job_control(void)
{
    pid_t session = fork();
    require(session >= 0, "fork terminal session");
    if (session == 0) {
        alarm(15);
        terminal_session();
        fflush(stdout);
        _exit(0);
    }
    int status = collect(session, 0);
    require(WIFEXITED(status) && WEXITSTATUS(status) == 0, "terminal session completed");
}

int main(void)
{
    alarm(20);
    job_control();
    return 0;
}
