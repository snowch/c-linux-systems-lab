#ifndef SYSTEMS_SUPPORT_H
#define SYSTEMS_SUPPORT_H

#include <errno.h>
#include <fcntl.h>
#include <poll.h>
#include <pthread.h>
#include <signal.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/eventfd.h>
#include <sys/mman.h>
#include <sys/stat.h>
#include <sys/wait.h>
#include <unistd.h>

static inline void require(int ok, const char *message)
{
    if (!ok) {
        fprintf(stderr, "%s: %s\n", message, strerror(errno));
        exit(EXIT_FAILURE);
    }
}

static inline void send_bytes(int fd, const void *data, size_t size)
{
    const char *p = data;
    while (size) {
        ssize_t n = write(fd, p, size);
        if (n < 0 && errno == EINTR)
            continue;
        require(n > 0, "write");
        p += n;
        size -= (size_t)n;
    }
}

static inline pid_t spawn(void)
{
    pid_t pid = fork();
    require(pid >= 0, "fork");
    return pid;
}

static inline int collect(pid_t child)
{
    int status;
    pid_t result;
    do {
        result = waitpid(child, &status, 0);
    } while (result < 0 && errno == EINTR);
    require(result == child, "waitpid");
    return status;
}

static inline void wait_ok(pid_t child)
{
    int status = collect(child);
    require(WIFEXITED(status) && WEXITSTATUS(status) == 0, "child failed");
}

static inline void thread_ok(int code, const char *message)
{
    if (code) {
        errno = code;
        require(0, message);
    }
}

#endif
