#define _POSIX_C_SOURCE 200809L
#include <errno.h>
#include <fcntl.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/stat.h>
#include <unistd.h>

static void require(int ok, const char *operation)
{
    if (!ok) {
        perror(operation);
        exit(EXIT_FAILURE);
    }
}

static void inspect_error(void)
{
    const char *path = "/dev/null";
    const int flags = O_WRONLY;
    int fd = open(path, flags | O_CLOEXEC);
    if (fd == -1) {
        int reason = errno;
        printf("open returned -1 with %s\n", strerror(reason));
        return;
    }
    printf("open returned descriptor %d\n", fd);
    char byte;
    ssize_t result = read(fd, &byte, 1);
    if (result == -1) {
        int reason = errno;
        printf("read returned -1 with %s\n", strerror(reason));
    } else {
        printf("read returned %zd bytes\n", result);
    }
    require(close(fd) == 0, "close");
}

int main(void)
{
    inspect_error();
    return 0;
}
