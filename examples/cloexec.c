#define _GNU_SOURCE
#include "process-support.h"

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

int main(int argc, char **argv)
{
    alarm(20);
    if (argc == 3 && !strcmp(argv[1], "inspect-fd")) {
        int result = fcntl(atoi(argv[2]), F_GETFD);
        require(result >= 0 || errno == EBADF, "inspect descriptor");
        printf("after exec: descriptor %s is %s\n", argv[2], result >= 0 ? "open" : "closed");
        return 0;
    }
    close_on_exec();
    return 0;
}
