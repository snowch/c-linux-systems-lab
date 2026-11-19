#define _GNU_SOURCE
#include "process-support.h"

enum { INCREMENTS = 10000 };

struct counters {
    _Atomic unsigned count;
    _Atomic int ready;
    unsigned checksum;
};

static void *publish(void *opaque)
{
    struct counters *result = opaque;
    for (unsigned i = 0; i < INCREMENTS; ++i)
        atomic_fetch_add_explicit(&result->count, 1, memory_order_relaxed);
    result->checksum = 42;
    atomic_store_explicit(&result->ready, 1, memory_order_release);
    return NULL;
}

static void atomics(void)
{
    struct counters result = {0};
    pthread_t worker;
    require(pthread_create(&worker, NULL, publish, &result) == 0, "pthread_create");
    for (unsigned i = 0; i < INCREMENTS; ++i)
        atomic_fetch_add_explicit(&result.count, 1, memory_order_relaxed);
    while (!atomic_load_explicit(&result.ready, memory_order_acquire))
        sched_yield();
    printf("published checksum=%u\n", result.checksum);
    require(pthread_join(worker, NULL) == 0, "pthread_join");
    printf("combined atomic count=%u\n", atomic_load_explicit(&result.count, memory_order_relaxed));
}

int main(void)
{
    alarm(20);
    atomics();
    return 0;
}
