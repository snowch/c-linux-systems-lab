#ifndef PROCESS_SUPPORT_H
#define PROCESS_SUPPORT_H

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

static inline void require(int ok, const char *message)
{
    if (!ok) {
        fprintf(stderr, "%s: %s\n", message, strerror(errno));
        exit(EXIT_FAILURE);
    }
}

static inline int collect(pid_t pid, int flags)
{
    int status;
    pid_t result;
    do {
        result = waitpid(pid, &status, flags);
    } while (result < 0 && errno == EINTR);
    require(result == pid, "waitpid");
    return status;
}

#endif
