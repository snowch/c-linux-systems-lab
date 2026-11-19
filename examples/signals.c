#define _GNU_SOURCE
#include "systems-support.h"

static void signals(void)
{
    sigset_t pending, previous;
    sigemptyset(&pending);
    sigaddset(&pending, SIGUSR1);
    require(sigprocmask(SIG_BLOCK, &pending, &previous) == 0, "sigprocmask");
    pid_t parent = getpid();
    pid_t child = spawn();
    if (child == 0)
        _exit(kill(parent, SIGUSR1) == 0 ? 0 : 1);
    int delivered = sigwaitinfo(&pending, NULL);
    require(delivered == SIGUSR1, "sigwaitinfo");
    puts("parent received SIGUSR1");
    wait_ok(child);
    require(sigprocmask(SIG_SETMASK, &previous, NULL) == 0, "restore mask");
}

int main(void)
{
    alarm(15);
    signals();
    return 0;
}
