#define _GNU_SOURCE
#include "systems-support.h"

int main(void)
{
    char path[] = "/tmp/capstone-file-XXXXXX";
    int fd = mkstemp(path);
    require(fd >= 0 && unlink(path) == 0, "create temporary file");
    const char text[] = "hello";
    send_bytes(fd, text, sizeof text - 1);

    struct stat info;
    require(fstat(fd, &info) == 0, "fstat");
    printf("metadata reports %lld bytes\n", (long long)info.st_size);

    const off_t start = 0;
    require(start >= 0 && start < info.st_size, "choose a starting byte");
    require(lseek(fd, start, SEEK_SET) == start, "set the shared offset");
    int duplicate = dup(fd);
    require(duplicate >= 0, "dup");
    char byte;
    require(read(duplicate, &byte, 1) == 1 && byte == text[start], "read through duplicate");
    off_t next = lseek(fd, 0, SEEK_CUR);
    require(next == start + 1, "shared offset");
    printf("duplicate read %c, original offset is %lld\n", byte, (long long)next);

    close(duplicate);
    close(fd);
    return 0;
}
