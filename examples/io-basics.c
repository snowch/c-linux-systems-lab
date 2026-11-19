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

static void describe_file(void)
{
    char directory[] = "/tmp/linux-lab-stat.XXXXXX";
    require(mkdtemp(directory) != NULL, "mkdtemp");
    int dir = open(directory, O_RDONLY | O_DIRECTORY | O_CLOEXEC);
    require(dir >= 0, "open directory");
    int fd = openat(dir, "data", O_CREAT | O_EXCL | O_WRONLY | O_CLOEXEC, 0600);
    require(fd >= 0, "openat");
    require(fchmod(fd, 0640) == 0, "fchmod");
    require(write(fd, "data", 4) == 4, "write");
    struct stat metadata;
    require(fstat(fd, &metadata) == 0, "fstat");
    printf("regular=%d, mode=%03o, size=%lld bytes\n", S_ISREG(metadata.st_mode),
           (unsigned)(metadata.st_mode & 0777), (long long)metadata.st_size);
    require(unlinkat(dir, "data", 0) == 0, "unlinkat");
    require(fstat(fd, &metadata) == 0, "fstat after unlink");
    printf("open descriptor after unlink: links=%llu, size=%lld bytes\n",
           (unsigned long long)metadata.st_nlink, (long long)metadata.st_size);
    close(fd);
    close(dir);
    require(rmdir(directory) == 0, "rmdir");
}

int main(int argc, char **argv)
{
    if (argc == 2 && !strcmp(argv[1], "errors"))
        inspect_error();
    else if (argc == 2 && !strcmp(argv[1], "bytes"))
        copy_bytes();
    else if (argc == 2 && !strcmp(argv[1], "metadata"))
        describe_file();
    else {
        fputs("choose errors, bytes or metadata\n", stderr);
        return 1;
    }
    return 0;
}
