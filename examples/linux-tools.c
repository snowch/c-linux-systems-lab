#define _GNU_SOURCE
#include <errno.h>
#include <fcntl.h>
#include <mqueue.h>
#include <poll.h>
#include <pthread.h>
#include <sched.h>
#include <signal.h>
#include <stdatomic.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/epoll.h>
#include <sys/inotify.h>
#include <sys/ioctl.h>
#include <sys/mman.h>
#include <sys/resource.h>
#include <sys/signalfd.h>
#include <sys/stat.h>
#include <sys/syscall.h>
#include <sys/timerfd.h>
#include <sys/wait.h>
#include <termios.h>
#include <unistd.h>

static void require(int ok, const char *message)
{
    if (!ok) {
        fprintf(stderr, "%s: %s\n", message, strerror(errno));
        exit(EXIT_FAILURE);
    }
}
static int collect(pid_t pid, int flags)
{
    int status;
    pid_t result;
    do {
        result = waitpid(pid, &status, flags);
    } while (result < 0 && errno == EINTR);
    require(result == pid, "waitpid");
    return status;
}

static void close_on_exec(void)
{
    const int close_on_exec = 1;
    int fd = open("/dev/null", O_RDONLY | O_CLOEXEC);
    require(fd >= 0, "open");
    int inherited = fcntl(fd, F_DUPFD, 20);
    require(inherited >= 20, "duplicate into a high descriptor slot");
    require(fcntl(inherited, F_SETFD, close_on_exec ? FD_CLOEXEC : 0) == 0, "set descriptor flags");
    close(fd);
    char descriptor[32];
    snprintf(descriptor, sizeof descriptor, "%d", inherited);
    execl("/proc/self/exe", "linux-tools", "inspect-fd", descriptor, (char *)NULL);
    require(0, "exec");
}

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

struct counters {
    _Atomic unsigned count;
    _Atomic int ready;
    unsigned checksum;
};
enum { INCREMENTS = 10000 };

static void *publish(void *opaque)
{
    struct counters *result = opaque;
    for (unsigned i = 0; i < INCREMENTS; ++i)
        atomic_fetch_add_explicit(&result->count, 1, memory_order_relaxed);
    result->checksum = 42;
    atomic_store_explicit(&result->ready, 1, memory_order_release);
    return NULL;
}

static void atomics(void)
{
    struct counters result = {0};
    pthread_t worker;
    require(pthread_create(&worker, NULL, publish, &result) == 0, "pthread_create");
    for (unsigned i = 0; i < INCREMENTS; ++i)
        atomic_fetch_add_explicit(&result.count, 1, memory_order_relaxed);
    while (!atomic_load_explicit(&result.ready, memory_order_acquire))
        sched_yield();
    printf("published checksum=%u\n", result.checksum);
    require(pthread_join(worker, NULL) == 0, "pthread_join");
    printf("combined atomic count=%u\n", atomic_load_explicit(&result.count, memory_order_relaxed));
}

static void priority_messages(void)
{
    char name[64];
    snprintf(name, sizeof name, "/linux-lab-%ld", (long)getpid());
    struct mq_attr settings = { .mq_maxmsg = 4, .mq_msgsize = 16 };
    mqd_t queue = mq_open(name, O_RDWR | O_CREAT | O_EXCL | O_NONBLOCK | O_CLOEXEC, 0600, &settings);
    require(queue != (mqd_t)-1, "mq_open");
    require(mq_unlink(name) == 0, "unlink queue name");
    const unsigned first_priority = 1;
    require(mq_send(queue, "first", 6, first_priority) == 0 &&
            mq_send(queue, "second", 7, 5) == 0, "mq_send");
    for (int i = 0; i < 2; ++i) {
        char data[16];
        unsigned priority;
        require(mq_receive(queue, data, sizeof data, &priority) > 0, "mq_receive");
        printf("received %s at priority %u\n", data, priority);
    }
    char data[16];
    require(mq_receive(queue, data, sizeof data, NULL) == -1 && errno == EAGAIN, "empty queue");
    puts("empty nonblocking queue: EAGAIN");
    mq_close(queue);
}

static void mapped_file(void)
{
    char path[] = "/tmp/linux-lab-map.XXXXXX";
    int fd = mkstemp(path);
    require(fd >= 0, "mkstemp");
    unlink(path);
    size_t size = 4096;
    require(ftruncate(fd, (off_t)size) == 0, "set file size");
    const int mapping_type = MAP_SHARED;
    char *bytes = mmap(NULL, size, PROT_READ | PROT_WRITE, mapping_type, fd, 0);
    require(bytes != MAP_FAILED, "map file");
    bytes[0] = 'M';
    require(msync(bytes, size, MS_SYNC) == 0, "msync");
    unsigned char disk_byte;
    require(pread(fd, &disk_byte, 1, 0) == 1, "pread");
    printf("mapped byte=%u, file byte=%u\n", (unsigned char)bytes[0], disk_byte);
    munmap(bytes, size);
    close(fd);
}

static void signals_and_timers(void)
{
    sigset_t watched;
    sigemptyset(&watched);
    sigaddset(&watched, SIGUSR1);
    require(sigprocmask(SIG_BLOCK, &watched, NULL) == 0, "block SIGUSR1");
    int signals = signalfd(-1, &watched, SFD_NONBLOCK | SFD_CLOEXEC);
    int timer = timerfd_create(CLOCK_MONOTONIC, TFD_NONBLOCK | TFD_CLOEXEC);
    int loop = epoll_create1(EPOLL_CLOEXEC);
    require(signals >= 0 && timer >= 0 && loop >= 0, "create event sources");
    struct epoll_event s = { .events = EPOLLIN, .data.fd = signals };
    struct epoll_event t = { .events = EPOLLIN, .data.fd = timer };
    require(epoll_ctl(loop, EPOLL_CTL_ADD, signals, &s) == 0 &&
            epoll_ctl(loop, EPOLL_CTL_ADD, timer, &t) == 0, "watch event sources");
    const long delay_ns = 50000000;
    struct itimerspec deadline = { .it_value = { .tv_nsec = delay_ns } };
    require(timerfd_settime(timer, 0, &deadline, NULL) == 0 &&
            kill(getpid(), SIGUSR1) == 0, "arm timer and send signal");
    int completed = 0;
    while (completed != 3) {
        struct epoll_event event;
        require(epoll_wait(loop, &event, 1, 2000) == 1, "wait for event");
        if (event.data.fd == signals) {
            struct signalfd_siginfo info;
            require(read(signals, &info, sizeof info) == sizeof info &&
                    info.ssi_signo == SIGUSR1, "read signal record");
            completed |= 1;
            puts("signal descriptor returned SIGUSR1");
        } else {
            uint64_t elapsed;
            require(read(timer, &elapsed, sizeof elapsed) == sizeof elapsed && elapsed == 1,
                    "read expiration count");
            completed |= 2;
            puts("timer descriptor returned one expiration");
        }
    }
    close(loop);
    close(timer);
    close(signals);
}

static void watch_directory(void)
{
    char path[] = "/tmp/linux-lab-watch.XXXXXX";
    require(mkdtemp(path) != NULL, "mkdtemp");
    int dir = open(path, O_RDONLY | O_DIRECTORY | O_CLOEXEC);
    int monitor = inotify_init1(IN_CLOEXEC | IN_NONBLOCK);
    const uint32_t watch = IN_CREATE | IN_MOVED_TO;
    require(dir >= 0 && monitor >= 0 && inotify_add_watch(monitor, path, watch) >= 0,
            "watch temporary directory");
    int file = openat(dir, "staged", O_WRONLY | O_CREAT | O_EXCL | O_CLOEXEC, 0600);
    require(file >= 0, "create staged file");
    close(file);
    require(renameat(dir, "staged", dir, "ready") == 0, "publish file");
    union { struct inotify_event align; char bytes[1024]; } buffer;
    ssize_t received = read(monitor, buffer.bytes, sizeof buffer.bytes);
    require(received > 0, "read directory notifications");
    for (size_t offset = 0; offset < (size_t)received;) {
        const struct inotify_event *event = (const void *)(buffer.bytes + offset);
        printf("%s: %s\n", event->mask & IN_CREATE ? "created" : "moved into directory", event->name);
        offset += sizeof *event + event->len;
    }
    close(monitor);
    unlinkat(dir, "ready", 0);
    close(dir);
    rmdir(path);
}

static void descriptor_limit(void)
{
    const rlim_t maximum = 32;
    struct rlimit limit;
    require(getrlimit(RLIMIT_NOFILE, &limit) == 0 && limit.rlim_max >= maximum, "read descriptor limits");
    limit.rlim_cur = maximum;
    require(setrlimit(RLIMIT_NOFILE, &limit) == 0, "set soft descriptor limit");
    unsigned int count = 0;
    int fd;
    while ((fd = open("/dev/null", O_RDONLY | O_CLOEXEC)) >= 0)
        ++count;
    require(errno == EMFILE, "expect descriptor exhaustion");
    printf("soft limit=%llu, successfully opened=%u, final error=EMFILE\n",
           (unsigned long long)maximum, count);
}

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

static void trace_target(void)
{
    const int fd = -1;
    ssize_t result = write(fd, "sample\n", 7);
    if (result == -1)
        printf("write on fd %d failed with %s\n", fd, strerror(errno));
    else
        printf("write on fd %d returned %zd\n", fd, result);
}

int main(int argc, char **argv)
{
    alarm(20);
    if (argc == 3 && !strcmp(argv[1], "inspect-fd")) {
        int result = fcntl(atoi(argv[2]), F_GETFD);
        require(result >= 0 || errno == EBADF, "inspect descriptor");
        printf("after exec: descriptor %s is %s\n", argv[2], result >= 0 ? "open" : "closed");
        return 0;
    }
    const struct { const char *name; void (*run)(void); } labs[] = {
        { "cloexec", close_on_exec }, { "jobs", job_control }, { "atomics", atomics },
        { "mqueue", priority_messages }, { "filemap", mapped_file }, { "fd-events", signals_and_timers },
        { "inotify", watch_directory }, { "limits", descriptor_limit }, { "trace", trace_target },
        { "pidfd", supervise_pidfd }
    };
    for (size_t i = 0; argc == 2 && i < sizeof labs / sizeof *labs; ++i) {
        if (!strcmp(argv[1], labs[i].name)) {
            labs[i].run();
            return 0;
        }
    }
    fputs("choose cloexec, jobs, atomics, mqueue, filemap, fd-events, inotify, limits, trace or pidfd\n", stderr);
    return 1;
}
