#define _GNU_SOURCE
#include "process-support.h"

static void mapped_file(void)
{
    char path[] = "/tmp/linux-lab-map.XXXXXX";
    int fd = mkstemp(path);
    require(fd >= 0, "mkstemp");
    unlink(path);
    size_t size = 4096;
    require(ftruncate(fd, (off_t)size) == 0, "set file size");
    const int mapping_type = MAP_SHARED;
    char *bytes = mmap(NULL, size, PROT_READ | PROT_WRITE, mapping_type, fd, 0);
    require(bytes != MAP_FAILED, "map file");
    bytes[0] = 'M';
    require(msync(bytes, size, MS_SYNC) == 0, "msync");
    unsigned char disk_byte;
    require(pread(fd, &disk_byte, 1, 0) == 1, "pread");
    printf("mapped byte=%u, file byte=%u\n", (unsigned char)bytes[0], disk_byte);
    munmap(bytes, size);
    close(fd);
}

int main(void)
{
    alarm(20);
    mapped_file();
    return 0;
}
