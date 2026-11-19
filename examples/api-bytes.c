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

static void copy_bytes(void)
{
    static const char text[] = "hello Linux";
    char path[] = "/tmp/linux-lab-bytes.XXXXXX";
    int fd = mkstemp(path);
    require(fd >= 0, "mkstemp");
    require(unlink(path) == 0, "unlink the temporary name");
    size_t written = 0;
    while (written < sizeof text - 1) {
        ssize_t n = write(fd, text + written, sizeof text - 1 - written);
        if (n < 0 && errno == EINTR)
            continue;
        require(n > 0, "write");
        written += (size_t)n;
    }
    printf("wrote %zu bytes\n", written);
    require(lseek(fd, 0, SEEK_SET) == 0, "rewind the file offset");
    char buffer[4];
    size_t total = 0;
    for (;;) {
        ssize_t n = read(fd, buffer, sizeof buffer);
        if (n == -1 && errno == EINTR)
            continue;
        require(n >= 0, "read");
        if (n == 0)
            break;
        printf("read %zd bytes: %.*s\n", n, (int)n, buffer);
        total += (size_t)n;
    }
    printf("EOF after %zu bytes\n", total);
    require(close(fd) == 0, "close");
}

int main(void)
{
    copy_bytes();
    return 0;
}
