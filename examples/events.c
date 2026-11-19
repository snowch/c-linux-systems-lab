#define _GNU_SOURCE
#include "systems-support.h"

enum { JOBS = 4, DEADLINE_MS = 100 };

static void events(void)
{
    int fd = eventfd(0, EFD_CLOEXEC | EFD_NONBLOCK);
    require(fd >= 0, "eventfd");
    struct pollfd watch = { .fd = fd, .events = POLLIN };
    int before = poll(&watch, 1, 0);
    require(before == 0, "empty counter was unexpectedly readable");
    for (int i = 0; i < JOBS; ++i) {
        const uint64_t increment = 1;
        require(write(fd, &increment, sizeof increment) == sizeof increment, "eventfd write");
    }
    int ready = poll(&watch, 1, DEADLINE_MS);
    require(ready == 1 && (watch.revents & POLLIN), "poll");
    uint64_t count;
    require(read(fd, &count, sizeof count) == sizeof count, "eventfd read");
    int after = poll(&watch, 1, 0);
    require(after == 0, "counter should be empty after read");
    printf("poll before=%d, ready=%d, count=%llu, after=%d\n",
           before, ready, (unsigned long long)count, after);
    close(fd);
}

int main(void)
{
    alarm(15);
    events();
    return 0;
}
