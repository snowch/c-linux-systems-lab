#define _GNU_SOURCE
#include <errno.h>
#include <fcntl.h>
#include <poll.h>
#include <pthread.h>
#include <signal.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/eventfd.h>
#include <sys/mman.h>
#include <sys/stat.h>
#include <sys/wait.h>
#include <unistd.h>

enum { JOBS = 4, DEADLINE_MS = 100 };
static const char sample[] = "hello";

static void require(int ok, const char *message)
{
    if (!ok) {
        fprintf(stderr, "%s: %s\n", message, strerror(errno));
        exit(EXIT_FAILURE);
    }
}

static void send_bytes(int fd, const void *data, size_t size)
{
    const char *p = data;
    while (size) {
        ssize_t n = write(fd, p, size);
        if (n < 0 && errno == EINTR)
            continue;
        require(n > 0, "write");
        p += n;
        size -= (size_t)n;
    }
}

static pid_t spawn(void)
{
    pid_t pid = fork();
    require(pid >= 0, "fork");
    return pid;
}

static int collect(pid_t child)
{
    int status;
    pid_t result;
    do {
        result = waitpid(child, &status, 0);
    } while (result < 0 && errno == EINTR);
    require(result == child, "waitpid");
    return status;
}

static void wait_ok(pid_t child)
{
    int status = collect(child);
    require(WIFEXITED(status) && WEXITSTATUS(status) == 0, "child failed");
}

static void descriptors(void)
{
    char path[] = "/tmp/descriptors.XXXXXX";
    int fd = mkstemp(path);
    require(fd >= 0, "mkstemp");
    send_bytes(fd, sample, sizeof sample - 1);
    require(lseek(fd, 0, SEEK_SET) == 0, "lseek");
    int copy = dup(fd), independent = open(path, O_RDONLY | O_CLOEXEC);
    require(copy >= 0 && independent >= 0, "dup/open");
    unlink(path);
    char a, b, c;
    require(read(fd, &a, 1) == 1 && read(copy, &b, 1) == 1 &&
            read(independent, &c, 1) == 1, "read");
    printf("original=%c duplicate=%c independent=%c\n", a, b, c);
    close(independent);
    close(copy);
    close(fd);
}

static void pipeline(void)
{
    int pipefd[2];
    require(pipe2(pipefd, O_CLOEXEC) == 0, "pipe2");
    pid_t producer = spawn();
    if (producer == 0) {
        if (dup2(pipefd[1], STDOUT_FILENO) < 0)
            _exit(126);
        close(pipefd[0]);
        close(pipefd[1]);
        execlp("printf", "printf", "%s\n", sample, (char *)NULL);
        _exit(127);
    }
    pid_t consumer = spawn();
    if (consumer == 0) {
        if (dup2(pipefd[0], STDIN_FILENO) < 0)
            _exit(126);
        close(pipefd[0]);
        close(pipefd[1]);
        execlp("tr", "tr", "a-z", "A-Z", (char *)NULL);
        _exit(127);
    }
    close(pipefd[0]);
    close(pipefd[1]); /* A surviving write end would keep the reader waiting. */
    wait_ok(producer);
    wait_ok(consumer);
    puts("both processes exited");
}

static void signals(void)
{
    sigset_t pending, previous;
    sigemptyset(&pending);
    sigaddset(&pending, SIGUSR1);
    require(sigprocmask(SIG_BLOCK, &pending, &previous) == 0, "sigprocmask");
    pid_t parent = getpid();
    pid_t child = spawn();
    if (child == 0)
        _exit(kill(parent, SIGUSR1) == 0 ? 0 : 1);
    int delivered = sigwaitinfo(&pending, NULL);
    require(delivered == SIGUSR1, "sigwaitinfo");
    puts("parent received SIGUSR1");
    wait_ok(child);
    require(sigprocmask(SIG_SETMASK, &previous, NULL) == 0, "restore mask");
}

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

struct queue {
    pthread_mutex_t mutex;
    pthread_cond_t changed;
    int value;
    int full;
    int sum;
};

static void thread_ok(int code, const char *message)
{
    if (code) {
        errno = code;
        require(0, message);
    }
}

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

static void replace_file(void)
{
    char directory[] = "/tmp/replacement.XXXXXX";
    require(mkdtemp(directory) != NULL, "mkdtemp");
    int dir = open(directory, O_RDONLY | O_DIRECTORY | O_CLOEXEC);
    require(dir >= 0, "open directory");
    int old = openat(dir, "state", O_CREAT | O_EXCL | O_RDWR | O_CLOEXEC, 0600);
    int staged = openat(dir, "staged", O_CREAT | O_EXCL | O_WRONLY | O_CLOEXEC, 0600);
    require(old >= 0 && staged >= 0, "openat");
    send_bytes(old, "old", 3);
    send_bytes(staged, sample, sizeof sample - 1);
    require(fsync(staged) == 0, "fsync staged");
    require(close(staged) == 0, "close staged");
    require(renameat(dir, "staged", dir, "state") == 0, "renameat");
    require(fsync(dir) == 0, "fsync directory");
    int next = openat(dir, "state", O_RDONLY | O_CLOEXEC);
    require(next >= 0 && lseek(old, 0, SEEK_SET) == 0, "reopen");
    char a[4] = {0}, b[sizeof sample] = {0};
    require(read(old, a, sizeof a - 1) > 0 && read(next, b, sizeof b - 1) > 0, "read");
    printf("open descriptor=%s, reopened path=%s\n", a, b);
    close(next);
    close(old);
    unlinkat(dir, "state", 0);
    close(dir);
    rmdir(directory);
}

static void events(void)
{
    int fd = eventfd(0, EFD_CLOEXEC | EFD_NONBLOCK);
    require(fd >= 0, "eventfd");
    struct pollfd watch = { .fd = fd, .events = POLLIN };
    int before = poll(&watch, 1, 0);
    require(before == 0, "empty counter was unexpectedly readable");
    for (int i = 0; i < JOBS; ++i) {
        const uint64_t increment = 1;
        require(write(fd, &increment, sizeof increment) == sizeof increment, "eventfd write");
    }
    int ready = poll(&watch, 1, DEADLINE_MS);
    require(ready == 1 && (watch.revents & POLLIN), "poll");
    uint64_t count;
    require(read(fd, &count, sizeof count) == sizeof count, "eventfd read");
    int after = poll(&watch, 1, 0);
    require(after == 0, "counter should be empty after read");
    printf("poll before=%d, ready=%d, count=%llu, after=%d\n",
           before, ready, (unsigned long long)count, after);
    close(fd);
}

static void supervise(int stalled)
{
    int channel[2];
    require(pipe2(channel, O_CLOEXEC | O_NONBLOCK) == 0, "pipe2");
    pid_t child = spawn();
    if (child == 0) {
        close(channel[0]);
        if (stalled)
            for (;;)
                pause();
        send_bytes(channel[1], "done", 4);
        _exit(0);
    }
    close(channel[1]);
    struct pollfd watch = { .fd = channel[0], .events = POLLIN };
    int ready = poll(&watch, 1, DEADLINE_MS);
    if (ready <= 0) {
        require(kill(child, SIGTERM) == 0, "kill");
        int status = collect(child);
        require(WIFSIGNALED(status) && WTERMSIG(status) == SIGTERM, "expected SIGTERM");
        puts("deadline expired, worker terminated and reaped");
    } else {
        char data[4];
        require(read(channel[0], data, sizeof data) == sizeof data &&
                !memcmp(data, "done", sizeof data), "worker protocol");
        wait_ok(child);
        puts("worker replied and exited successfully");
    }
    close(channel[0]);
}

int main(int argc, char **argv)
{
    alarm(15);
    const struct { const char *mode; void (*run)(void); } labs[] = {
        { "descriptors", descriptors }, { "pipeline", pipeline }, { "signals", signals },
        { "mapping", mapping }, { "threads", threads }, { "replace", replace_file },
        { "events", events }
    };
    for (size_t i = 0; argc == 2 && i < sizeof labs / sizeof *labs; ++i) {
        if (!strcmp(argv[1], labs[i].mode)) {
            labs[i].run();
            return EXIT_SUCCESS;
        }
    }
    if (argc == 2 && !strcmp(argv[1], "supervise")) {
        supervise(0);
        supervise(1);
        return EXIT_SUCCESS;
    }
    fprintf(stderr, "usage: %s descriptors|pipeline|signals|mapping|threads|replace|events|supervise\n", argv[0]);
    return EXIT_FAILURE;
}
