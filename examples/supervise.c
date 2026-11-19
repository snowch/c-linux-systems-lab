#define _GNU_SOURCE
#include "systems-support.h"

enum { DEADLINE_MS = 100 };

static void supervise(int stalled)
{
    int channel[2];
    require(pipe2(channel, O_CLOEXEC | O_NONBLOCK) == 0, "pipe2");
    pid_t child = spawn();
    if (child == 0) {
        close(channel[0]);
        if (stalled)
            for (;;)
                pause();
        send_bytes(channel[1], "done", 4);
        _exit(0);
    }
    close(channel[1]);
    struct pollfd watch = { .fd = channel[0], .events = POLLIN };
    int ready = poll(&watch, 1, DEADLINE_MS);
    if (ready <= 0) {
        require(kill(child, SIGTERM) == 0, "kill");
        int status = collect(child);
        require(WIFSIGNALED(status) && WTERMSIG(status) == SIGTERM, "expected SIGTERM");
        puts("deadline expired, worker terminated and reaped");
    } else {
        char data[4];
        require(read(channel[0], data, sizeof data) == sizeof data &&
                !memcmp(data, "done", sizeof data), "worker protocol");
        wait_ok(child);
        puts("worker replied and exited successfully");
    }
    close(channel[0]);
}

int main(void)
{
    alarm(15);
    supervise(0);
    supervise(1);
    return 0;
}
