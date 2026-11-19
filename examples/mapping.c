#define _GNU_SOURCE
#include "systems-support.h"

enum { JOBS = 4 };

static void mapping(void)
{
    int *shared = mmap(NULL, sizeof *shared, PROT_READ | PROT_WRITE,
                       MAP_ANONYMOUS | MAP_SHARED, -1, 0);
    int *private = mmap(NULL, sizeof *private, PROT_READ | PROT_WRITE,
                        MAP_ANONYMOUS | MAP_PRIVATE, -1, 0);
    require(shared != MAP_FAILED && private != MAP_FAILED, "mmap");
    *shared = *private = 1;
    pid_t child = spawn();
    if (child == 0) {
        *shared = *private = JOBS;
        _exit(0);
    }
    wait_ok(child);
    printf("parent after wait: shared=%d private=%d\n", *shared, *private);
    munmap(shared, sizeof *shared);
    munmap(private, sizeof *private);
}

int main(void)
{
    alarm(15);
    mapping();
    return 0;
}
