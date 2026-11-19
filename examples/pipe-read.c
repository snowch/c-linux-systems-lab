#define _GNU_SOURCE
#include "systems-support.h"

int main(void)
{
    int ends[2];
    require(pipe(ends) == 0, "pipe");

    const char text[] = "go";
    require(write(ends[1], text, sizeof text - 1) == sizeof text - 1, "write");
    close(ends[1]);

    char buffer[8];
    ssize_t count = read(ends[0], buffer, sizeof buffer);
    require(count >= 0, "read");
    printf("read %zd bytes: %.*s\n", count, (int)count, buffer);

    count = read(ends[0], buffer, sizeof buffer);
    require(count == 0, "expected EOF");
    puts("second read returned 0 (EOF)");
    close(ends[0]);
    return 0;
}
