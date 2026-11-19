#define _GNU_SOURCE
#include "systems-support.h"

enum { JOBS = 4 };

struct queue {
    pthread_mutex_t mutex;
    pthread_cond_t changed;
    int value;
    int full;
    int sum;
};

static void *consume(void *argument)
{
    struct queue *queue = argument;
    for (int i = 0; i < JOBS; ++i) {
        thread_ok(pthread_mutex_lock(&queue->mutex), "lock");
        while (!queue->full)
            thread_ok(pthread_cond_wait(&queue->changed, &queue->mutex), "wait for value");
        queue->sum += queue->value;
        queue->full = 0;
        thread_ok(pthread_cond_signal(&queue->changed), "signal empty");
        thread_ok(pthread_mutex_unlock(&queue->mutex), "unlock");
    }
    return NULL;
}

static void threads(void)
{
    struct queue queue = { .mutex = PTHREAD_MUTEX_INITIALIZER,
                           .changed = PTHREAD_COND_INITIALIZER };
    pthread_t worker;
    thread_ok(pthread_create(&worker, NULL, consume, &queue), "pthread_create");
    for (int value = 1; value <= JOBS; ++value) {
        thread_ok(pthread_mutex_lock(&queue.mutex), "lock");
        while (queue.full)
            thread_ok(pthread_cond_wait(&queue.changed, &queue.mutex), "wait for space");
        queue.value = value;
        queue.full = 1;
        thread_ok(pthread_cond_signal(&queue.changed), "signal full");
        thread_ok(pthread_mutex_unlock(&queue.mutex), "unlock");
    }
    thread_ok(pthread_join(worker, NULL), "pthread_join");
    printf("consumed %d jobs, sum=%d\n", JOBS, queue.sum);
    pthread_cond_destroy(&queue.changed);
    pthread_mutex_destroy(&queue.mutex);
}

int main(void)
{
    alarm(15);
    threads();
    return 0;
}
