#define _GNU_SOURCE
#include "process-support.h"

static void priority_messages(void)
{
    char name[64];
    snprintf(name, sizeof name, "/linux-lab-%ld", (long)getpid());
    struct mq_attr settings = { .mq_maxmsg = 4, .mq_msgsize = 16 };
    mqd_t queue = mq_open(name, O_RDWR | O_CREAT | O_EXCL | O_NONBLOCK | O_CLOEXEC, 0600, &settings);
    require(queue != (mqd_t)-1, "mq_open");
    require(mq_unlink(name) == 0, "unlink queue name");
    const unsigned first_priority = 1;
    require(mq_send(queue, "first", 6, first_priority) == 0 &&
            mq_send(queue, "second", 7, 5) == 0, "mq_send");
    for (int i = 0; i < 2; ++i) {
        char data[16];
        unsigned priority;
        require(mq_receive(queue, data, sizeof data, &priority) > 0, "mq_receive");
        printf("received %s at priority %u\n", data, priority);
    }
    char data[16];
    require(mq_receive(queue, data, sizeof data, NULL) == -1 && errno == EAGAIN, "empty queue");
    puts("empty nonblocking queue: EAGAIN");
    mq_close(queue);
}

int main(void)
{
    alarm(20);
    priority_messages();
    return 0;
}
