#define _GNU_SOURCE
#include "systems-support.h"

static const char sample[] = "hello";

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

int main(void)
{
    alarm(15);
    pipeline();
    return 0;
}
