#define _GNU_SOURCE
#include "process-support.h"

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

int main(void)
{
    alarm(20);
    signals_and_timers();
    return 0;
}
