#define _GNU_SOURCE
#include "process-support.h"

static void trace_target(void)
{
    const int fd = -1;
    ssize_t result = write(fd, "sample\n", 7);
    if (result == -1)
        printf("write on fd %d failed with %s\n", fd, strerror(errno));
    else
        printf("write on fd %d returned %zd\n", fd, result);
}

int main(void)
{
    alarm(20);
    trace_target();
    return 0;
}
