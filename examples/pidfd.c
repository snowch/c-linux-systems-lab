#define _GNU_SOURCE
#include "process-support.h"

static void arm_deadline(int timer)
{
    const long grace_ns = 100000000;
    struct itimerspec deadline = { .it_value = { .tv_nsec = grace_ns } };
    require(timerfd_settime(timer, 0, &deadline, NULL) == 0, "arm deadline");
}

static void supervise_pidfd(void)
{
    int ready_pipe[2];
    require(pipe2(ready_pipe, O_CLOEXEC) == 0, "ready pipe");
    const int ignore_term = 1;
    pid_t worker = fork();
    require(worker >= 0, "fork worker");
    if (worker == 0) {
        alarm(5);
        close(ready_pipe[0]);
        if (signal(SIGTERM, ignore_term ? SIG_IGN : SIG_DFL) == SIG_ERR ||
            write(ready_pipe[1], "r", 1) != 1)
            _exit(1);
        close(ready_pipe[1]);
        for (;;)
            pause();
    }
    close(ready_pipe[1]);
    char ready;
    require(read(ready_pipe[0], &ready, 1) == 1, "wait for worker setup");
    close(ready_pipe[0]);
    int pidfd = (int)syscall(SYS_pidfd_open, worker, 0);
    int timer = timerfd_create(CLOCK_MONOTONIC, TFD_CLOEXEC);
    require(pidfd >= 0 && timer >= 0, "open pidfd and timer");
    struct pollfd event[2] = {
        { .fd = pidfd, .events = POLLIN }, { .fd = timer, .events = POLLIN }
    };
    int sent = 0;
    arm_deadline(timer);
    for (;;) {
        require(poll(event, 2, 3000) > 0, "wait for exit or deadline");
        if (event[0].revents & POLLIN)
            break;
        uint64_t count;
        require((event[1].revents & POLLIN) && read(timer, &count, sizeof count) == sizeof count,
                "read deadline");
        int next = sent ? SIGKILL : SIGTERM;
        long result = syscall(SYS_pidfd_send_signal, pidfd, next, NULL, 0);
        require(result == 0 || errno == ESRCH, "signal worker by descriptor");
        printf("deadline: sent %s\n", next == SIGTERM ? "SIGTERM" : "SIGKILL");
        sent = next;
        if (sent == SIGTERM)
            arm_deadline(timer);
    }
    int status = collect(worker, 0);
    require(WIFSIGNALED(status) && WTERMSIG(status) == (ignore_term ? SIGKILL : SIGTERM),
            "verify termination signal");
    printf("pidfd became readable; reaped worker after %s\n", ignore_term ? "SIGKILL" : "SIGTERM");
    close(pidfd);
    close(timer);
}

int main(void)
{
    alarm(20);
    supervise_pidfd();
    return 0;
}
