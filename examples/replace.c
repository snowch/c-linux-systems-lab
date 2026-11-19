#define _GNU_SOURCE
#include "systems-support.h"

static const char sample[] = "hello";

static void replace_file(void)
{
    char directory[] = "/tmp/replacement.XXXXXX";
    require(mkdtemp(directory) != NULL, "mkdtemp");
    int dir = open(directory, O_RDONLY | O_DIRECTORY | O_CLOEXEC);
    require(dir >= 0, "open directory");
    int old = openat(dir, "state", O_CREAT | O_EXCL | O_RDWR | O_CLOEXEC, 0600);
    int staged = openat(dir, "staged", O_CREAT | O_EXCL | O_WRONLY | O_CLOEXEC, 0600);
    require(old >= 0 && staged >= 0, "openat");
    send_bytes(old, "old", 3);
    send_bytes(staged, sample, sizeof sample - 1);
    require(fsync(staged) == 0, "fsync staged");
    require(close(staged) == 0, "close staged");
    require(renameat(dir, "staged", dir, "state") == 0, "renameat");
    require(fsync(dir) == 0, "fsync directory");
    int next = openat(dir, "state", O_RDONLY | O_CLOEXEC);
    require(next >= 0 && lseek(old, 0, SEEK_SET) == 0, "reopen");
    char a[4] = {0}, b[sizeof sample] = {0};
    require(read(old, a, sizeof a - 1) > 0 && read(next, b, sizeof b - 1) > 0, "read");
    printf("open descriptor=%s, reopened path=%s\n", a, b);
    close(next);
    close(old);
    unlinkat(dir, "state", 0);
    close(dir);
    rmdir(directory);
}

int main(void)
{
    alarm(15);
    replace_file();
    return 0;
}
