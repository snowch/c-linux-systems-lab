#define _GNU_SOURCE
#include "process-support.h"

static void descriptor_limit(void)
{
    const rlim_t maximum = 32;
    struct rlimit limit;
    require(getrlimit(RLIMIT_NOFILE, &limit) == 0 && limit.rlim_max >= maximum, "read descriptor limits");
    limit.rlim_cur = maximum;
    require(setrlimit(RLIMIT_NOFILE, &limit) == 0, "set soft descriptor limit");
    unsigned int count = 0;
    int fd;
    while ((fd = open("/dev/null", O_RDONLY | O_CLOEXEC)) >= 0)
        ++count;
    require(errno == EMFILE, "expect descriptor exhaustion");
    printf("soft limit=%llu, successfully opened=%u, final error=EMFILE\n",
           (unsigned long long)maximum, count);
}

int main(void)
{
    alarm(20);
    descriptor_limit();
    return 0;
}
