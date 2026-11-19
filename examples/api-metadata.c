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

int main(void)
{
    describe_file();
    return 0;
}
