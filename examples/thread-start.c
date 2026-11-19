#define _GNU_SOURCE
#include "systems-support.h"

static void *print_message(void *argument)
{
    const char *message = argument;
    printf("worker: %s\n", message);
    return NULL;
}

int main(void)
{
    const char message[] = "ready";
    pthread_t worker;
    thread_ok(pthread_create(&worker, NULL, print_message, (void *)message), "create");
    thread_ok(pthread_join(worker, NULL), "join");
    puts("worker joined");
    return 0;
}
