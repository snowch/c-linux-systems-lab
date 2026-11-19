export const course = {
  "slug": "c-linux-systems-lab",
  "title": "C Linux Systems Lab",
  "summary": "Linux file descriptors, processes, signals, memory, threads and supervision.",
  "instructions": "Run in Linux compiles the editor contents with GCC and runs this exercise in the guest. Use the console output to check your prediction.",
  "files": {
    "systems.c": "./examples/systems.c"
  },
  "prepare": "set -e\ngcc -std=c11 -Wall -Wextra -Werror -O2 -pthread /tmp/lesson-input/systems.c -o /tmp/sys",
  "lessons": [
    {
      "id": "descriptors",
      "section": "Descriptors and processes",
      "title": "Trace a shared file offset",
      "intro": "A file descriptor is a process-local number. It refers to an open file description in the kernel, which stores the file position.",
      "question": "After the first read, which descriptor starts at the next byte?",
      "focus": "static void descriptors",
      "task": "Replace dup(fd) with open(path, O_RDONLY | O_CLOEXEC) in descriptors(). Run and compare all three characters.",
      "hint": "Opening the same path twice normally makes independent file positions.",
      "explanation": "dup() makes a second handle to the same description. A second open creates a new description starting at offset zero. Unlinking the path leaves the open descriptions usable.",
      "transfer": "What offset would the parent see if a child used an inherited descriptor to read one byte before exiting?",
      "reference": [
        "Read open(2)",
        "https://man7.org/linux/man-pages/man2/open.2.html"
      ],
      "command": "/tmp/sys descriptors",
      "file": "systems.c"
    },
    {
      "id": "pipeline",
      "section": "Descriptors and processes",
      "title": "Connect two processes with a pipe",
      "intro": "fork() creates a child that inherits open descriptors. dup2() redirects standard input or output before exec replaces the child’s program.",
      "question": "Which descriptors must be closed for tr to see EOF?",
      "focus": "static void pipeline",
      "task": "Temporarily comment out the parent’s close(pipefd[1]) immediately before wait_ok(producer). Run and observe the timeout or use Interrupt. Restore the close and rerun.",
      "hint": "Count every process that holds a write end. The pipe signals EOF when all write ends have closed.",
      "explanation": "printf exits and closes its write end. With the parent’s write end open, tr still expects more bytes and the parent waits for tr. The deadline bounds the demonstration.",
      "transfer": "Where should you set close-on-exec when running commands that inherit other, unrelated descriptors?",
      "reference": [
        "Read pipe(7)",
        "https://man7.org/linux/man-pages/man7/pipe.7.html"
      ],
      "command": "/tmp/sys pipeline",
      "file": "systems.c"
    },
    {
      "id": "signals",
      "section": "Descriptors and processes",
      "title": "Synchronise a parent with a signal",
      "intro": "A blocked signal can stay pending until a process explicitly waits for it. The parent blocks SIGUSR1 before creating the child.",
      "question": "Can the parent receive the signal if the child sends it before sigwaitinfo() starts?",
      "focus": "static void signals",
      "task": "Add usleep(100000) in the parent before the sigwaitinfo() call. Run and check whether it still receives SIGUSR1.",
      "hint": "The blocked signal stays pending. sigwaitinfo() can consume an already-pending signal.",
      "explanation": "Blocking before fork removes the race between child delivery and the parent starting its wait. The parent restores its previous signal mask after collecting the child.",
      "transfer": "What would you use if multiple events must be counted individually?",
      "reference": [
        "Read sigwaitinfo(2)",
        "https://man7.org/linux/man-pages/man2/sigwaitinfo.2.html"
      ],
      "command": "/tmp/sys signals",
      "file": "systems.c"
    },
    {
      "id": "mapping",
      "section": "Memory and concurrency",
      "title": "Compare shared and private memory",
      "intro": "mmap() creates a memory mapping. MAP_SHARED exposes subsequent writes through the shared mapping, while MAP_PRIVATE gives each process its own modified pages.",
      "question": "Which of the child’s writes will the parent see after waitpid()?",
      "focus": "static void mapping",
      "task": "Change the child assignment from JOBS to 9. Run and compare the parent’s shared and private values.",
      "hint": "Both mappings are created before fork. The parent only prints after the child exits.",
      "explanation": "The shared mapping changes for both processes. A private write is isolated in the child, leaving the parent’s original value intact.",
      "transfer": "If both processes needed to update the shared value at the same time, what would the program need beyond MAP_SHARED?",
      "reference": [
        "Read mmap(2)",
        "https://man7.org/linux/man-pages/man2/mmap.2.html"
      ],
      "command": "/tmp/sys mapping",
      "file": "systems.c"
    },
    {
      "id": "threads",
      "section": "Memory and concurrency",
      "title": "Coordinate a producer and a consumer",
      "intro": "Threads share memory. A mutex protects the queue state, and a condition variable allows a thread to sleep until the predicate it cares about might have changed.",
      "question": "What prevents a producer from overwriting a value before the consumer reads it?",
      "focus": "static void threads",
      "task": "Change JOBS at the top from 4 to 6. Predict the sum, then run and compare it with the result.",
      "hint": "The producer waits while full is true. The consumer waits while full is false. Both test the predicate under the same mutex.",
      "explanation": "A condition wait releases the mutex while sleeping and reacquires it before returning. The while loop verifies the predicate again before either thread acts.",
      "transfer": "How would you add a shutdown message without leaving a waiting thread asleep?",
      "reference": [
        "Read pthread_cond_wait(3p)",
        "https://man7.org/linux/man-pages/man3p/pthread_cond_wait.3p.html"
      ],
      "command": "/tmp/sys threads",
      "file": "systems.c"
    },
    {
      "id": "replace",
      "section": "Files and events",
      "title": "Replace a file while readers hold it open",
      "intro": "renameat() replaces the destination directory entry. Readers that already opened the old file retain a handle to the old inode, the filesystem’s object for that file.",
      "question": "Will a reader that already has a descriptor see the same bytes as a reader that opens the path after replacement?",
      "focus": "static void replace_file",
      "task": "Change sample near the top from hello to ready. Run and compare the old descriptor and the newly opened path.",
      "hint": "Observe which descriptor was opened before renameat(). The two fsync() calls are for the staged data and directory entry.",
      "explanation": "The old descriptor still refers to its original inode. After replacement, the name resolves to the staged file. The RAM-backed guest demonstrates namespace behaviour without testing crash durability.",
      "transfer": "Why should the staged file be created in the same filesystem as the destination?",
      "reference": [
        "Read rename(2)",
        "https://man7.org/linux/man-pages/man2/rename.2.html"
      ],
      "command": "/tmp/sys replace",
      "file": "systems.c"
    },
    {
      "id": "events",
      "section": "Files and events",
      "title": "Observe eventfd readiness",
      "intro": "eventfd represents a kernel counter as a descriptor. A producer can add to it, and an event loop can wait for it to become readable.",
      "question": "How many writes can one read account for?",
      "focus": "static void events",
      "task": "Change increment from 1 to 2. Run and compare the collected count with the number of writes.",
      "hint": "With the default mode, a successful read returns the accumulated count and resets it to zero.",
      "explanation": "Each 64-bit write adds its value. The descriptor is readable while the counter is positive, then stops being readable after a default read drains it.",
      "transfer": "How would the interpretation change if the descriptor were created with EFD_SEMAPHORE?",
      "reference": [
        "Read eventfd(2)",
        "https://man7.org/linux/man-pages/man2/eventfd.2.html"
      ],
      "command": "/tmp/sys events",
      "file": "systems.c"
    },
    {
      "id": "supervise",
      "section": "Capstone",
      "title": "Supervise a worker with a deadline",
      "intro": "A supervisor uses a pipe to collect a result, poll() to enforce a response deadline, and waitpid() to collect the worker’s exit status.",
      "question": "How can the parent distinguish a normal response from a worker that is still running but has stopped making progress?",
      "focus": "static void supervise",
      "task": "Change the stalled child from an endless pause to a 20 ms sleep followed by its usual reply. Run and compare the paths taken.",
      "hint": "The read end and the process have separate lifecycles. The parent checks the pipe first, then always collects the child.",
      "explanation": "The original runs verify both paths. On a timeout, the supervisor signals the child and reaps it. A child that replies before the deadline takes the ordinary success path.",
      "transfer": "Extend the supervisor so a child that closes the pipe without sending done is reported separately from a timeout.",
      "reference": [
        "Read waitpid(2)",
        "https://man7.org/linux/man-pages/man2/waitpid.2.html"
      ],
      "command": "/tmp/sys supervise",
      "file": "systems.c"
    }
  ]
};
