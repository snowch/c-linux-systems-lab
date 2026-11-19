#define _GNU_SOURCE
#include "process-support.h"

int main(void)
{
    char directory[] = "/tmp/capstone-watch-XXXXXX";
    require(mkdtemp(directory) != NULL, "create watch directory");
    int dir = open(directory, O_RDONLY | O_DIRECTORY);
    int events = inotify_init1(IN_NONBLOCK | IN_CLOEXEC);
    const uint32_t watched_events = IN_CREATE | IN_MOVED_TO;
    require(dir >= 0 && events >= 0 && inotify_add_watch(events, directory, watched_events) >= 0, "watch directory");

    int loop = epoll_create1(EPOLL_CLOEXEC);
    struct epoll_event watch = { .events = EPOLLIN, .data.fd = events };
    require(loop >= 0 && epoll_ctl(loop, EPOLL_CTL_ADD, events, &watch) == 0, "watch inotify descriptor");

    int staged = openat(dir, "staged", O_WRONLY | O_CREAT | O_EXCL, 0600);
    require(staged >= 0 && write(staged, "ready\n", 6) == 6 && close(staged) == 0, "write staged file");
    require(renameat(dir, "staged", dir, "current") == 0, "publish file");
    struct epoll_event ready;
    require(epoll_wait(loop, &ready, 1, 1000) == 1 && ready.data.fd == events, "wait for directory events");

    union { struct inotify_event align; char bytes[1024]; } buffer;
    ssize_t count = read(events, buffer.bytes, sizeof buffer.bytes);
    require(count > 0, "read directory events");
    int published = 0;
    for (size_t offset = 0; offset < (size_t)count;) {
        const struct inotify_event *event = (const void *)(buffer.bytes + offset);
        if (event->mask & IN_CREATE)
            printf("created: %s\n", event->name);
        if ((event->mask & IN_MOVED_TO) && !strcmp(event->name, "current"))
            published = 1;
        offset += sizeof *event + event->len;
    }
    require(published, "observe publication event");
    puts("epoll reported publication of current");

    unlinkat(dir, "current", 0);
    close(loop);
    close(events);
    close(dir);
    rmdir(directory);
    return 0;
}
