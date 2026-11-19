#define _GNU_SOURCE
#include "process-support.h"

static void *store(void *argument)
{
    char *mapping = argument;
    mapping[0] = 'W';
    return NULL;
}

int main(void)
{
    char path[] = "/tmp/capstone-map-XXXXXX";
    int fd = mkstemp(path);
    require(fd >= 0 && unlink(path) == 0 && write(fd, "B", 1) == 1, "prepare backing file");

    const int mode = MAP_SHARED;
    char *mapping = mmap(NULL, 1, PROT_READ | PROT_WRITE, mode, fd, 0);
    require(mapping != MAP_FAILED, "mmap");

    pthread_t worker;
    require(pthread_create(&worker, NULL, store, mapping) == 0, "pthread_create");
    require(pthread_join(worker, NULL) == 0, "pthread_join");
    require(mapping[0] == 'W', "worker wrote W");

    char backing;
    require(pread(fd, &backing, 1, 0) == 1, "read backing file");
    require(backing == (mode == MAP_SHARED ? 'W' : 'B'), "verify backing byte");
    printf("after join: mapping=%c backing file=%c\n", mapping[0], backing);

    munmap(mapping, 1);
    close(fd);
    return 0;
}
