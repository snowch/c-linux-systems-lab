#include <fcntl.h>
#include <stdio.h>
#include <unistd.h>

int main(void)
{
    const char *path = "/dev/null";
    int fd = open(path, O_RDONLY);
    if (fd < 0) {
        perror(path);
        return 1;
    }

    printf("opened %s as descriptor %d\n", path, fd);
    return close(fd) == 0 ? 0 : 1;
}
