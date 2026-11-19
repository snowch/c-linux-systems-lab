#define _GNU_SOURCE
#include "process-support.h"

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

int main(void)
{
    alarm(20);
    watch_directory();
    return 0;
}
