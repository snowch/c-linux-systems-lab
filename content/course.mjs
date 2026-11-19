export const course = {
  "slug": "c-linux-systems-lab",
  "title": "C Linux Systems Lab",
  "overview": {
    "description": "Learn how C programs use Linux. Start with return values, errno and file descriptors, then work through process control, memory, threads, event loops and worker supervision.",
    "prerequisites": "Know basic C. You can run every exercise and inspect its output in the browser."
  },
  "summary": "Start with the Linux C API, then investigate processes, files, memory, concurrency and event-driven supervision.",
  "instructions": "Run in Linux sends the editor contents to the guest. GCC compiles new or edited source before running the exercise. Use the console output to check your prediction.",
  "files": {
    "systems.c": "./examples/systems.c",
    "io-basics.c": "./examples/io-basics.c",
    "linux-tools.c": "./examples/linux-tools.c"
  },
  "prepare": "if [ ! -x /tmp/sys ] || [ /tmp/lesson-input/systems.c -nt /tmp/sys ]; then\n    echo 'Compiling systems.c in Linux'\n    gcc -std=c11 -Wall -Wextra -Werror -pthread /tmp/lesson-input/systems.c -o /tmp/sys.next\n    mv /tmp/sys.next /tmp/sys\nfi",
  "lessons": [
    {
      "id": "api-errors",
      "section": "Linux API essentials",
      "title": "Check a Linux API call and read errno",
      "file": "io-basics.c",
      "focus": "static void inspect_error",
      "intro": "C programs call the Linux API through library functions such as open() and read(). These calls return a result. When they return -1, errno identifies the failure. Know basic C to begin.",
      "question": "Can open() succeed while a later read() of that same descriptor fails?",
      "task": "Change flags from O_WRONLY to O_RDONLY. Run and compare the return value from read().",
      "hint": "/dev/null can be opened for either mode. Look at the access mode stored on the open descriptor.",
      "explanation": "With O_WRONLY, read() returns -1 and sets errno to EBADF. With O_RDONLY, reading /dev/null succeeds and returns zero bytes. Inspect errno only after the call reports an error.",
      "transfer": "Change path to /tmp/this-file-does-not-exist. Which call fails, and how does its errno differ?",
      "reference": [
        "Read errno(3)",
        "https://man7.org/linux/man-pages/man3/errno.3.html"
      ],
      "prepare": "if [ ! -x /tmp/linux-api ] || [ /tmp/lesson-input/io-basics.c -nt /tmp/linux-api ]; then\n    echo 'Compiling io-basics.c in Linux'\n    gcc -std=c11 -Wall -Wextra -Werror  /tmp/lesson-input/io-basics.c -o /tmp/linux-api.next \n    mv /tmp/linux-api.next /tmp/linux-api\nfi",
      "command": "/tmp/linux-api errors"
    },
    {
      "id": "api-bytes",
      "section": "Linux API essentials",
      "title": "Write, rewind and read a file",
      "file": "io-basics.c",
      "focus": "static void copy_bytes",
      "intro": "read() and write() transfer bytes through a descriptor and return how many they moved. A file offset tracks the position. lseek() can change that position.",
      "question": "What does the last read return when fewer bytes remain than fit in the buffer? What does the call after that return?",
      "task": "Change buffer from four bytes to six. Run and compare each read size and the final byte count.",
      "hint": "The loop prints the count from read() itself. A result of zero marks EOF in this example.",
      "explanation": "The buffer size is a maximum. A short read is still a successful transfer. Rewinding makes the first read start at the beginning of the file.",
      "transfer": "What happens if you remove lseek() and try reading immediately after writing?",
      "reference": [
        "Read read(2)",
        "https://man7.org/linux/man-pages/man2/read.2.html"
      ],
      "prepare": "if [ ! -x /tmp/linux-api ] || [ /tmp/lesson-input/io-basics.c -nt /tmp/linux-api ]; then\n    echo 'Compiling io-basics.c in Linux'\n    gcc -std=c11 -Wall -Wextra -Werror  /tmp/lesson-input/io-basics.c -o /tmp/linux-api.next \n    mv /tmp/linux-api.next /tmp/linux-api\nfi",
      "command": "/tmp/linux-api bytes"
    },
    {
      "id": "api-metadata",
      "section": "Linux API essentials",
      "title": "Inspect a file through its descriptor",
      "file": "io-basics.c",
      "focus": "static void describe_file",
      "intro": "openat() resolves a relative path using a directory descriptor. fstat() reports metadata about an already-open file, including its size, permissions and number of names.",
      "question": "Which metadata changes after unlinkat() removes the last name while the file is still open?",
      "task": "Change the fchmod() mode to 0600. Run again and compare the mode, link count and size.",
      "hint": "The data and metadata belong to the open file object. A directory entry gives that object a name.",
      "explanation": "The mode reflects fchmod(). Removing the name drops the link count to zero. The open descriptor still reaches the same file and fstat() still reports its size.",
      "transfer": "What changes if another process already holds an open descriptor when the name is removed?",
      "reference": [
        "Read stat(2)",
        "https://man7.org/linux/man-pages/man2/stat.2.html"
      ],
      "prepare": "if [ ! -x /tmp/linux-api ] || [ /tmp/lesson-input/io-basics.c -nt /tmp/linux-api ]; then\n    echo 'Compiling io-basics.c in Linux'\n    gcc -std=c11 -Wall -Wextra -Werror  /tmp/lesson-input/io-basics.c -o /tmp/linux-api.next \n    mv /tmp/linux-api.next /tmp/linux-api\nfi",
      "command": "/tmp/linux-api metadata"
    },
    {
      "id": "descriptors",
      "section": "Linux API essentials",
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
      "id": "cloexec",
      "section": "Linux API essentials",
      "title": "Control which descriptors survive exec",
      "file": "linux-tools.c",
      "focus": "static void close_on_exec",
      "intro": "exec replaces the program in a process. A descriptor survives if its close-on-exec flag is clear. This exercise uses a high descriptor number and starts the same executable again to check it.",
      "question": "Will the newly executed program still see the descriptor?",
      "task": "Change close_on_exec to 0. Run and compare the descriptor status.",
      "hint": "The experiment changes the descriptor flag with F_SETFD. The second program checks the same slot with F_GETFD.",
      "explanation": "FD_CLOEXEC closes the descriptor on a successful exec. Clearing it leaves the descriptor available to the new program.",
      "transfer": "Why is O_CLOEXEC usually safer than setting the flag with a separate call in a multithreaded program?",
      "reference": [
        "Read execve(2)",
        "https://man7.org/linux/man-pages/man2/execve.2.html"
      ],
      "prepare": "if [ ! -x /tmp/linux-tools ] || [ /tmp/lesson-input/linux-tools.c -nt /tmp/linux-tools ]; then\n    echo 'Compiling linux-tools.c in Linux'\n    gcc -std=c11 -Wall -Wextra -Werror -pthread /tmp/lesson-input/linux-tools.c -o /tmp/linux-tools.next \n    mv /tmp/linux-tools.next /tmp/linux-tools\nfi",
      "command": "/tmp/linux-tools cloexec"
    },
    {
      "id": "pipeline",
      "section": "Processes and terminal control",
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
      "section": "Processes and terminal control",
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
      "id": "jobs",
      "section": "Processes and terminal control",
      "title": "Stop and resume a foreground job",
      "file": "linux-tools.c",
      "focus": "static void terminal_session",
      "intro": "A session can own a controlling terminal. The terminal sends job-control signals to its foreground process group. A private pseudoterminal lets this exercise inspect that behaviour.",
      "question": "Which process group receives the terminal suspend signal?",
      "task": "Change suspend_key from 26 to 29. Run and check whether the private terminal still stops and resumes the job.",
      "hint": "tcsetpgrp() puts the job’s group in the foreground. The code configures the same byte as VSUSP and then writes it to the terminal.",
      "explanation": "The terminal delivers SIGTSTP to the foreground group. The supervisor observes the stop, reclaims the terminal, resumes the job and reaps it.",
      "transfer": "How could a shell put a suspended job back in the foreground before sending SIGCONT?",
      "reference": [
        "Read tcsetpgrp(3)",
        "https://man7.org/linux/man-pages/man3/tcsetpgrp.3.html"
      ],
      "prepare": "if [ ! -x /tmp/linux-tools ] || [ /tmp/lesson-input/linux-tools.c -nt /tmp/linux-tools ]; then\n    echo 'Compiling linux-tools.c in Linux'\n    gcc -std=c11 -Wall -Wextra -Werror -pthread /tmp/lesson-input/linux-tools.c -o /tmp/linux-tools.next \n    mv /tmp/linux-tools.next /tmp/linux-tools\nfi",
      "command": "mkdir -p /dev/pts\nif ! mountpoint -q /dev/pts; then mount -t devpts devpts /dev/pts; fi\n/tmp/linux-tools jobs"
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
      "id": "filemap",
      "section": "Memory and concurrency",
      "title": "Map bytes backed by an open file",
      "file": "linux-tools.c",
      "focus": "static void mapped_file",
      "intro": "A file-backed mapping provides memory access to bytes associated with a file. MAP_SHARED lets stores affect the underlying file. MAP_PRIVATE gives the mapping its own modified copy.",
      "question": "After writing through the mapping, does pread() see the same byte?",
      "task": "Change mapping_type from MAP_SHARED to MAP_PRIVATE. Run and compare the two byte values.",
      "hint": "The mapped byte is printed separately from the byte read through the original descriptor.",
      "explanation": "With MAP_SHARED, the two reads agree. With MAP_PRIVATE, the mapping contains the new byte while the underlying file still holds zero. This guest uses RAM-backed storage.",
      "transfer": "Why would a durability test need a persistent storage device as well as the right sync calls?",
      "reference": [
        "Read mmap(2)",
        "https://man7.org/linux/man-pages/man2/mmap.2.html"
      ],
      "prepare": "if [ ! -x /tmp/linux-tools ] || [ /tmp/lesson-input/linux-tools.c -nt /tmp/linux-tools ]; then\n    echo 'Compiling linux-tools.c in Linux'\n    gcc -std=c11 -Wall -Wextra -Werror -pthread /tmp/lesson-input/linux-tools.c -o /tmp/linux-tools.next \n    mv /tmp/linux-tools.next /tmp/linux-tools\nfi",
      "command": "/tmp/linux-tools filemap"
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
      "id": "atomics",
      "section": "Memory and concurrency",
      "title": "Share a counter and publish a result",
      "file": "linux-tools.c",
      "focus": "struct counters {",
      "intro": "An atomic operation avoids a lost update when two threads change the same counter. Release and acquire operations also let one thread publish related data to another.",
      "question": "Why does the counter use relaxed operations while the ready flag uses release and acquire?",
      "task": "Change INCREMENTS from 10000 to 5000. Predict the total, then run and check the count and checksum.",
      "hint": "The counter needs atomic updates. The ready flag orders earlier writes to the separate checksum.",
      "explanation": "Both threads contribute their increments. The consumer reads the checksum after an acquire load observes the release store, which makes the earlier checksum write visible.",
      "transfer": "When would a mutex be easier than atomics for a data structure with several fields?",
      "reference": [
        "Read the C memory-order reference",
        "https://en.cppreference.com/w/c/atomic/memory_order"
      ],
      "prepare": "if [ ! -x /tmp/linux-tools ] || [ /tmp/lesson-input/linux-tools.c -nt /tmp/linux-tools ]; then\n    echo 'Compiling linux-tools.c in Linux'\n    gcc -std=c11 -Wall -Wextra -Werror -pthread /tmp/lesson-input/linux-tools.c -o /tmp/linux-tools.next \n    mv /tmp/linux-tools.next /tmp/linux-tools\nfi",
      "command": "/tmp/linux-tools atomics"
    },
    {
      "id": "mqueue",
      "section": "Files and event loops",
      "title": "Receive messages in priority order",
      "file": "linux-tools.c",
      "focus": "static void priority_messages",
      "intro": "A POSIX message queue preserves message boundaries and assigns each message a priority. A nonblocking queue reports EAGAIN when it has no messages.",
      "question": "Will the first message sent necessarily be the first one received?",
      "task": "Change first_priority from 1 to 7. Run and compare the order of the two messages.",
      "hint": "The second message has priority 5. Compare the two numbers before looking at the send order.",
      "explanation": "The receive operation selects the highest priority first. For equal priority, the older message is received first.",
      "transfer": "How could a stream-based IPC design preserve message boundaries and priority without a message queue?",
      "reference": [
        "Read mq_overview(7)",
        "https://man7.org/linux/man-pages/man7/mq_overview.7.html"
      ],
      "prepare": "if [ ! -x /tmp/linux-tools ] || [ /tmp/lesson-input/linux-tools.c -nt /tmp/linux-tools ]; then\n    echo 'Compiling linux-tools.c in Linux'\n    gcc -std=c11 -Wall -Wextra -Werror -pthread /tmp/lesson-input/linux-tools.c -o /tmp/linux-tools.next \n    mv /tmp/linux-tools.next /tmp/linux-tools\nfi",
      "command": "/tmp/linux-tools mqueue"
    },
    {
      "id": "replace",
      "section": "Files and event loops",
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
      "id": "inotify",
      "section": "Files and event loops",
      "title": "Observe a directory while publishing a file",
      "file": "linux-tools.c",
      "focus": "static void watch_directory",
      "intro": "inotify watches filesystem objects and reports structured events. This example watches a directory while a staged file is created and moved to its final name.",
      "question": "Does the observer see a create event, a move event, or both?",
      "task": "Change watch to IN_MOVED_TO only. Run and compare the event list.",
      "hint": "The mask controls which of the operations generate records for this watch.",
      "explanation": "Creating the staged file generates IN_CREATE. Renaming it into the ready name generates IN_MOVED_TO. Filtering to the latter keeps the publication event.",
      "transfer": "What should a watcher do if inotify reports that its event queue overflowed?",
      "reference": [
        "Read inotify(7)",
        "https://man7.org/linux/man-pages/man7/inotify.7.html"
      ],
      "prepare": "if [ ! -x /tmp/linux-tools ] || [ /tmp/lesson-input/linux-tools.c -nt /tmp/linux-tools ]; then\n    echo 'Compiling linux-tools.c in Linux'\n    gcc -std=c11 -Wall -Wextra -Werror -pthread /tmp/lesson-input/linux-tools.c -o /tmp/linux-tools.next \n    mv /tmp/linux-tools.next /tmp/linux-tools\nfi",
      "command": "/tmp/linux-tools inotify"
    },
    {
      "id": "events",
      "section": "Files and event loops",
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
      "id": "fd-events",
      "section": "Files and event loops",
      "title": "Handle timers and signals in one event loop",
      "file": "linux-tools.c",
      "focus": "static void signals_and_timers",
      "intro": "signalfd() turns delivery of a blocked signal into a readable record. timerfd_create() provides a descriptor that becomes readable when an armed timer expires.",
      "question": "Can the same epoll loop handle both events without a signal handler?",
      "task": "Change delay_ns from 50000000 to 1000000. Run again and check the result for both descriptors.",
      "hint": "epoll reports a ready descriptor. The loop uses it to choose the correct record type.",
      "explanation": "The signal descriptor returns SIGUSR1 and the timer descriptor returns an expiration count. Both are read through epoll, and either can become ready first.",
      "transfer": "How would you handle a periodic timer if a read reports more than one expiration?",
      "reference": [
        "Read timerfd_create(2)",
        "https://man7.org/linux/man-pages/man2/timerfd_create.2.html"
      ],
      "prepare": "if [ ! -x /tmp/linux-tools ] || [ /tmp/lesson-input/linux-tools.c -nt /tmp/linux-tools ]; then\n    echo 'Compiling linux-tools.c in Linux'\n    gcc -std=c11 -Wall -Wextra -Werror -pthread /tmp/lesson-input/linux-tools.c -o /tmp/linux-tools.next \n    mv /tmp/linux-tools.next /tmp/linux-tools\nfi",
      "command": "/tmp/linux-tools fd-events"
    },
    {
      "id": "limits",
      "section": "Diagnostics and resource limits",
      "title": "Diagnose descriptor exhaustion",
      "file": "linux-tools.c",
      "focus": "static void descriptor_limit",
      "intro": "A resource limit constrains uses of a process resource. RLIMIT_NOFILE puts an upper bound on descriptor numbers the process can open.",
      "question": "Why can the program open fewer new descriptors than its configured limit?",
      "task": "Change maximum from 32 to 16. Run and compare the successful-open count and the final error.",
      "hint": "Standard input, output and error already occupy descriptor slots. Other inherited handles can also occupy slots.",
      "explanation": "The open loop eventually receives EMFILE when it cannot allocate another descriptor in the process. Lowering the soft limit makes that happen sooner.",
      "transfer": "What would you inspect in /proc to distinguish leaked descriptors from an expected workload peak?",
      "reference": [
        "Read getrlimit(2)",
        "https://man7.org/linux/man-pages/man2/getrlimit.2.html"
      ],
      "prepare": "if [ ! -x /tmp/linux-tools ] || [ /tmp/lesson-input/linux-tools.c -nt /tmp/linux-tools ]; then\n    echo 'Compiling linux-tools.c in Linux'\n    gcc -std=c11 -Wall -Wextra -Werror -pthread /tmp/lesson-input/linux-tools.c -o /tmp/linux-tools.next \n    mv /tmp/linux-tools.next /tmp/linux-tools\nfi",
      "command": "/tmp/linux-tools limits"
    },
    {
      "id": "trace",
      "section": "Diagnostics and resource limits",
      "title": "Trace an API call at the kernel boundary",
      "file": "linux-tools.c",
      "focus": "static void trace_target",
      "intro": "strace observes calls that cross from a process into the Linux kernel. A trace shows the operation, arguments, return value and an error when the call fails.",
      "question": "What evidence in the trace explains the program’s error message?",
      "task": "Change fd from -1 to STDOUT_FILENO in trace_target(). Run and compare the two write results.",
      "hint": "The -e trace=write option limits the trace to write calls. Find the call that used the descriptor you edited.",
      "explanation": "The failing call shows EBADF on descriptor -1. After the edit the same buffer is written to descriptor 1 and the trace reports the successful byte count.",
      "transfer": "How would you change the tracing command to diagnose a process that cannot open a file?",
      "reference": [
        "Read strace(1)",
        "https://man7.org/linux/man-pages/man1/strace.1.html"
      ],
      "assets": [
        "strace-x86"
      ],
      "prepare": "if [ ! -x /tmp/linux-tools ] || [ /tmp/lesson-input/linux-tools.c -nt /tmp/linux-tools ]; then\n    echo 'Compiling linux-tools.c in Linux'\n    gcc -std=c11 -Wall -Wextra -Werror -pthread /tmp/lesson-input/linux-tools.c -o /tmp/linux-tools.next \n    mv /tmp/linux-tools.next /tmp/linux-tools\nfi",
      "command": "cp /tmp/lesson-input/strace-x86 /tmp/lab-strace\nchmod 700 /tmp/lab-strace\n/tmp/lab-strace -e trace=write /tmp/linux-tools trace"
    },
    {
      "id": "supervise",
      "section": "Capstones",
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
    },
    {
      "id": "pidfd",
      "section": "Capstones",
      "title": "Escalate a worker shutdown with a process descriptor",
      "file": "linux-tools.c",
      "focus": "static void supervise_pidfd",
      "intro": "A pidfd is a kernel reference to one process. A supervisor can poll it for process exit and send signals through it while a separate timer descriptor tracks the deadline.",
      "question": "What happens if the worker ignores SIGTERM?",
      "task": "Change ignore_term from 1 to 0. Run and compare the signals sent and the signal reported by waitpid().",
      "hint": "The first deadline sends SIGTERM and arms a grace period. The second sends SIGKILL only if the worker has not exited.",
      "explanation": "With SIGTERM ignored, the worker needs escalation. With the default disposition, it exits after SIGTERM, and the pidfd wakes the supervisor before the next deadline.",
      "transfer": "How would you extend the supervisor to stop accepting jobs and let an active job finish before sending SIGTERM?",
      "reference": [
        "Read pidfd_open(2)",
        "https://man7.org/linux/man-pages/man2/pidfd_open.2.html"
      ],
      "prepare": "if [ ! -x /tmp/linux-tools ] || [ /tmp/lesson-input/linux-tools.c -nt /tmp/linux-tools ]; then\n    echo 'Compiling linux-tools.c in Linux'\n    gcc -std=c11 -Wall -Wextra -Werror -pthread /tmp/lesson-input/linux-tools.c -o /tmp/linux-tools.next \n    mv /tmp/linux-tools.next /tmp/linux-tools\nfi",
      "command": "/tmp/linux-tools pidfd"
    }
  ]
};
