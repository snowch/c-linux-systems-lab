#define _GNU_SOURCE
#include "systems-support.h"

static const char sample[] = "hello";

static void descriptors(void)
{
    char path[] = "/tmp/descriptors.XXXXXX";
    int fd = mkstemp(path);
    require(fd >= 0, "mkstemp");
    send_bytes(fd, sample, sizeof sample - 1);
    require(lseek(fd, 0, SEEK_SET) == 0, "lseek");
    int copy = dup(fd), independent = open(path, O_RDONLY | O_CLOEXEC);
    require(copy >= 0 && independent >= 0, "dup/open");
    unlink(path);
    char a, b, c;
    require(read(fd, &a, 1) == 1 && read(copy, &b, 1) == 1 &&
            read(independent, &c, 1) == 1, "read");
    printf("original=%c duplicate=%c independent=%c\n", a, b, c);
    close(independent);
    close(copy);
    close(fd);
}

int main(void)
{
    alarm(15);
    descriptors();
    return 0;
}
