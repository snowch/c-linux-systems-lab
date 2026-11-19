const step = (heading, text, anchor, lines) => ({ heading, text, anchor, lines });
const guide = (goal, look, edit, ...steps) => ({ goal, look, edit, steps });

export const walkthroughs = {
  "file-apis-capstone": {
    "edit": "const off_t start = 0;",
    "steps": [
      {
        "heading": "Observe file size",
        "text": "Read metadata through the open descriptor.",
        "anchor": "struct stat info;",
        "lines": 3
      },
      {
        "heading": "Seek and duplicate the descriptor",
        "text": "The duplicate shares the offset you set on the original.",
        "anchor": "const off_t start =",
        "lines": 8
      }
    ],
    "goal": "Write a temporary file, inspect its size and read one byte through a duplicate. Check the original descriptor’s offset afterwards.",
    "look": "Find metadata size 5, byte h and original offset 1. The edited run reads e and reports offset 2."
  },
  "memory-capstone": {
    "edit": "const int mode = MAP_SHARED;",
    "steps": [
      {
        "heading": "Choose the mapping mode",
        "text": "Pass the file descriptor to mmap() and check the returned address.",
        "anchor": "const int mode =",
        "lines": 3
      },
      {
        "heading": "Wait before reading the result",
        "text": "The worker receives the mapping as its argument. Main compares both views after the join.",
        "anchor": "pthread_t worker;",
        "lines": 4
      }
    ],
    "goal": "Give one worker access to a file-backed mapping. Join it before comparing the mapped byte and the backing file.",
    "look": "Look for “mapping=W backing file=W”, then change the mapping mode and compare."
  },
  "events-capstone": {
    "edit": "const uint32_t watched_events",
    "steps": [
      {
        "heading": "Register the filesystem event source",
        "text": "inotify selects the event types. epoll watches the inotify descriptor for readable data.",
        "anchor": "const uint32_t watched_events",
        "lines": 6
      },
      {
        "heading": "Publish and wait",
        "text": "Move the file to its final name and wait until the descriptor is readable.",
        "anchor": "require(renameat(dir,",
        "lines": 5
      }
    ],
    "goal": "Publish a file with renameat(). Use epoll to wait for the inotify descriptor, then read the event that names the published file.",
    "look": "Find “created: staged” and “epoll reported publication of current”. The edit removes only the creation line."
  },
  "diagnostics-capstone": {
    "edit": "const rlim_t maximum =",
    "steps": [
      {
        "heading": "Choose a per-process limit",
        "text": "The example changes its own soft descriptor limit.",
        "anchor": "const rlim_t maximum =",
        "lines": 5
      },
      {
        "heading": "Compare the final error",
        "text": "The program checks errno after the first failed open. The trace independently shows the result.",
        "anchor": "while ((fd = open(\"/dev/null\",",
        "lines": 3
      }
    ],
    "goal": "Run the descriptor-limit experiment under strace. Connect the program’s successful-open count to the kernel call that eventually fails.",
    "look": "Match the program’s final error to the open call returning EMFILE under “Last open calls”."
  },
  'thread-start': guide(
    'Start a worker thread and pass it a message. A thread runs its own instructions while sharing the process’s memory with main().',
    'Find “worker: ready” and “worker joined”. Which line comes first?',
    'const char message[]',
    step('Receive the message address', 'pthread_create() gives print_message() the address passed as its last argument. The worker treats that address as a pointer to characters.', 'const char *message = argument;', 2),
    step('Start the worker and wait', 'The call to pthread_create() starts the worker. thread_ok() checks for errors from the thread calls.', 'thread_ok(pthread_create(', 3)),
  'pipe-read': guide(
    'Use one process to write to a pipe and read back the queued bytes. Then see how the reader detects the end of the input.',
    'Find “read 2 bytes: go” and “second read returned 0 (EOF)”. Here EOF means the end of the pipe’s input.',
    'const char text[]',
    step('Create the two ends', 'A pipe holds bytes temporarily. pipe() stores the read descriptor in ends[0] and the write descriptor in ends[1].', 'int ends[2];', 2),
    step('Write, close and read', 'close() releases the write descriptor. The bytes already written stay available for read().', 'require(write(ends[1]', 5)),
  'open-file': guide(
    "Open /dev/null, a device that discards writes and has no bytes to read. Use the handle Linux gives you, then release it.",
    "Find the line beginning “opened /dev/null as descriptor”. Read the path and the number that Linux assigned.",
    'const char *path =',
    step('Ask Linux to open the path', 'O_RDONLY requests read access. On success, open() returns a file descriptor, the number this process can use in later calls.', 'const char *path =', 2),
    step('Check the handle before closing it', 'Linux reports a failed open with -1. Check it before trying to release the handle with close().', 'if (fd < 0)', 4)),
  'api-errors': guide(
    "Open /dev/null with write access, then try to read through the same descriptor. When a call reports failure, errno holds its error code.",
    "Find the lines beginning “open returned” and “read returned”. Which call reports “Bad file descriptor”, the message for EBADF?",
    'const int flags =',
    step('Choose an access mode', 'O_WRONLY asks only for write access. open() can succeed even though the resulting descriptor cannot read.', 'const int flags = O_WRONLY;', 2),
    step('Read the error after the failed call', 'read() returns a byte count or -1. Save errno immediately after failure to report its cause.', 'ssize_t result = read(fd, &byte, 1);', 4)),
  'api-bytes': guide(
    "Write a short message to a temporary file, rewind, and read it a few bytes at a time.",
    "Read “wrote”, each “read” line, and “EOF after”. The program prints “EOF after” when read() returns zero at the end of the file.",
    'char buffer[4];',
    step('Advance by the bytes actually written', 'write() may accept fewer bytes than requested. The loop adds the returned count and retries from the remaining part.', 'ssize_t n = write(fd, text + written', 5),
    step('Rewind before the first read', 'Both operations move the same file offset. SEEK_SET sets that offset back to zero so the next read begins at the first byte.', 'require(lseek(fd, 0, SEEK_SET)', 5)),
  'api-metadata': guide(
    "Create a four-byte file, change its mode, then remove its name while keeping the descriptor open.",
    "Find “regular”, “mode” and “size” in the first line. Then read “links” and “size” in “open descriptor after unlink”.",
    'require(fchmod(fd, 0640)',
    step('Open relative to a directory descriptor', 'openat() uses dir as the starting directory. fchmod() applies to the resulting open file, even if its name changes later.', 'int fd = openat(dir, "data"', 4),
    step('Ask about the open file again', 'unlinkat() removes a name, reducing the file’s link count. The descriptor still refers to the file object until it closes.', 'require(unlinkat(dir, "data",', 4)),
  descriptors: guide(
    "Compare a duplicated descriptor with a second open of the same file. Observe which reads share a position.",
    "Compare the characters on the line labelled “original”, “duplicate” and “independent”. The program reads one byte through each descriptor in that order.",
    'int copy = dup(fd)',
    step('Create two more handles', 'dup() shares the original open file description, which holds the current offset. open() creates a separate description with its own offset.', 'int copy = dup(fd), independent', 2),
    step('Read one byte on each handle', 'The first read moves the shared offset forward. The duplicate reads from that new position while the independent descriptor starts at zero.', 'require(read(fd, &a, 1)', 3)),
  cloexec: guide(
    "Pass one descriptor number through exec and check whether the new program can still use it.",
    "Find “after exec: descriptor” and check whether the slot is reported as “open” or “closed”.",
    'const int close_on_exec =',
    step('Give the new descriptor a flag', 'FD_CLOEXEC belongs to this descriptor. A successful exec closes it if the flag is set.', 'require(fcntl(inherited, F_SETFD', 1),
    step('Replace the program and keep the number', 'exec removes the current program but keeps the process. The new program receives the descriptor number as an argument and checks it.', 'snprintf(descriptor, sizeof descriptor', 2)),
  pipeline: guide(
    "Connect a producer’s output to a consumer’s input. Trace when the reader can tell it has received all the bytes.",
    "Look for “HELLO” from tr and “both processes exited” from the parent. The second line means the parent collected both exit statuses.",
    'close(pipefd[1]); /* A surviving write end',
    step('Redirect the producer’s standard output', 'dup2() points descriptor 1 at the pipe writer. The new program inherits standard output after exec and writes there.', 'if (dup2(pipefd[1], STDOUT_FILENO)', 5),
    step('Close the copy held by the parent', 'The reader reaches the end when it has read the buffered bytes and the last write descriptor has closed. The parent closes its copy before waiting.', 'close(pipefd[1]); /* A surviving write end', 3)),
  signals: guide(
    "A signal is a notification to a process. The child sends SIGUSR1 while the parent keeps that signal blocked so it can be collected later.",
    "Find “parent received SIGUSR1”. In the starter, the parent calls sigwaitinfo() before collecting the child’s exit status.",
    'int delivered = sigwaitinfo',
    step('Block the signal before forking', 'A blocked signal can become pending. This avoids depending on whether the child or parent runs first.', 'sigemptyset(&pending);', 3),
    step('Consume the pending signal', 'sigwaitinfo() waits for the chosen signal or returns it immediately if one is pending. The parent can then reap the child.', 'int delivered = sigwaitinfo', 4)),
  jobs: guide(
    "Use a private pseudoterminal, a terminal simulated in software, to see what happens when its suspend byte reaches the foreground group.",
    "Look for “terminal sent SIGTSTP to the foreground job” and “supervisor resumed and reaped the job”. Reaping means collecting the finished job’s exit status.",
    'const unsigned char suspend_key =',
    step('Choose a byte for suspension', 'ISIG enables terminal-generated signals. VSUSP defines which input byte should suspend the foreground job.', 'settings.c_lflag |= ISIG;', 4),
    step('Give the terminal to the job', 'tcsetpgrp() selects the foreground process group. Writing the suspend byte to the other end of the pseudoterminal simulates terminal input.', 'require(setpgid(job, job) == 0 && tcsetpgrp(tty, job)', 3)),
  mapping: guide(
    "The parent creates two memory regions before starting a child. The child writes the same value to both. Compare what the parent sees afterward.",
    "Compare the “shared” and “private” values on the line beginning “parent after wait”. Both regions start with 1.",
    '*shared = *private = JOBS;',
    step('Choose how each memory region shares writes', 'The mappings both start as anonymous memory without a backing file. MAP_SHARED and MAP_PRIVATE determine whether another process sees later writes.', 'int *shared = mmap(', 4),
    step('Wait before reading the values', 'The child writes both values and exits. The parent waits before comparing its view of the two mappings.', '*shared = *private = JOBS;', 5)),
  filemap: guide(
    "Write through a memory mapping, then ask what a regular read sees through the file descriptor.",
    "Compare “mapped byte” with “file byte”. The new character M has the numeric byte value 77. The file starts filled with zero bytes.",
    'const int mapping_type =',
    step('Map the file as writable memory', 'mmap() connects a region of memory to the file. MAP_SHARED lets writes through the mapping update what the file descriptor can read.', 'const int mapping_type = MAP_SHARED;', 4),
    step('Compare the two ways of reading the byte', 'pread() reads at a specific offset without moving the descriptor’s current position. Compare that result with bytes[0].', 'require(pread(fd, &disk_byte,', 2)),
  threads: guide(
    "Send one value at a time between two threads. A mutex lets one thread at a time work with the queue, and a condition variable lets a thread wait for a change.",
    "Find “consumed” and “sum”. The producer starts at 1 and sends consecutive numbers through the queue.",
    'JOBS = 4',
    step('Check the condition while holding the mutex', 'The mutex protects full and value. The condition wait releases the mutex while sleeping, and the loop checks full again after reacquiring it.', 'thread_ok(pthread_mutex_lock(&queue.mutex), "lock");', 4),
    step('Publish the value before signalling', 'Set the queue contents and mark it full before notifying the consumer. It will see the update after acquiring the mutex.', 'queue.full = 1;', 3)),
  atomics: guide(
    "Let two threads increment one counter while using a separate flag to publish a checksum.",
    "Read “published checksum” and “combined atomic count”. The starting count is zero and each of the two threads runs INCREMENTS times.",
    'INCREMENTS = 10000',
    step('Publish data with a release store', 'Relaxed operations keep each counter update atomic. The release store on ready publishes the earlier write to checksum.', 'atomic_fetch_add_explicit(&result->count,', 3),
    step('Wait for publication with an acquire load', 'Once acquire sees the ready value from the release store, reading checksum also sees the producer’s earlier write.', 'while (!atomic_load_explicit(&result.ready,', 3)),
  mqueue: guide(
    "Send two separate messages with different priorities. See whether send order decides receive order.",
    "Compare the two “received” lines, including their priorities. “empty nonblocking queue: EAGAIN” shows what the last receive finds.",
    'const unsigned first_priority =',
    step('Send a message with each priority', 'The queue preserves message boundaries. Each mq_send() supplies a priority along with its bytes.', 'const unsigned first_priority =', 3),
    step('Read one complete message at a time', 'mq_receive() also reports the selected message’s priority. The queue chooses the highest priority first.', 'require(mq_receive(queue, data, sizeof data, &priority)', 2)),
  replace: guide(
    "Publish a new version of a file while a reader still holds the old version open.",
    "Compare “open descriptor” with “reopened path”. The first descriptor was opened before renameat(). The second was opened afterwards.",
    'static const char sample[]',
    step('Publish the staged file at the destination name', 'renameat() changes the directory entry. An already open descriptor still refers to the old file object.', 'require(renameat(dir, "staged",', 2),
    step('Open the same name again', 'The new open follows the replacement directory entry. The two descriptors can now read different contents.', 'int next = openat(dir, "state",', 5)),
  inotify: guide(
    "Watch a directory while an application stages a file and renames it into place.",
    "Look for “created: staged” and “moved into directory: ready”. The second line refers to the destination name of the rename.",
    'const uint32_t watch =',
    step('Select the events to watch', 'IN_CREATE detects new entries and IN_MOVED_TO detects names moved into the directory. Both records arrive through the inotify descriptor.', 'const uint32_t watch =', 3),
    step('Advance to the next record', 'Each record includes a fixed header and a variable-length name. Use the length field to find the next record.', 'const struct inotify_event *event =', 3)),
  events: guide(
    "An eventfd is a Linux descriptor for a counter. Add values through that descriptor, then read their combined total.",
    "On the output line, compare “poll before”, “ready”, “count” and “after”. The loop always writes four times.",
    'const uint64_t increment =',
    step('Increment a kernel counter', 'An eventfd write adds a 64-bit value to its counter. Readiness means the counter now has something to report.', 'const uint64_t increment =', 2),
    step('Read the sum in one operation', 'A normal eventfd read returns the accumulated count and resets it. The last poll should find no readable data.', 'uint64_t count;', 4)),
  'fd-events': guide(
    "Read a signal and a timer expiry in one event loop by treating both as file descriptors.",
    "Look for “signal descriptor returned SIGUSR1” and “timer descriptor returned one expiration”. The result you are checking is that both lines appear.",
    'const long delay_ns =',
    step('Create two distinct event sources', 'signalfd() reads a blocked signal from its descriptor. timerfd_create() makes another descriptor for the timer.', 'int signals = signalfd(', 4),
    step('Read the record for the ready descriptor', 'epoll reports which descriptor is ready. The signal path reads a signal record, while the timer path reads an expiration count.', 'if (event.data.fd == signals)', 5)),
  limits: guide(
    "Make one process run out of descriptor slots so you can recognise that failure in a larger program.",
    "Compare “soft limit” with “successfully opened” and read “final error”. The open loop deliberately reaches the limit.",
    'const rlim_t maximum =',
    step('Lower the limit for this process', 'The soft limit controls the descriptor slots this process may allocate. The hard limit bounds what the process can set without more privileges.', 'const rlim_t maximum =', 5),
    step('Check the error after exhausting the slots', 'The loop stops when open() fails. EMFILE identifies this process’s descriptor limit as the cause.', 'while ((fd = open("/dev/null",', 3)),
  trace: guide(
    "Compare a C program’s error message with the kernel call that caused it.",
    "Under “Program output”, find its “write on fd -1 failed” line. Then find the write(-1, ...) call under “Trace of write calls”. Compare the return value and error code EBADF with the program’s message.",
    'const int fd = -1;',
    step('Make one write with a known descriptor', 'The descriptor -1 is invalid. The program still passes a real buffer and a byte count, so the descriptor is the failure you can isolate.', 'const int fd = -1;', 2),
    step('Compare the program’s explanation with strace', 'The trace records both the call under test and the write that prints the explanation. Look for the descriptor and buffer to tell them apart.', 'if (result == -1)', 2)),
  supervise: guide(
    "Compare a worker that replies with one that stalls. Give the parent a deadline before it cleans up the worker.",
    "Find “worker replied and exited successfully” and “deadline expired, worker terminated and reaped”. The original program exercises both paths.",
    'if (stalled)',
    step('Choose how the worker behaves', 'The normal worker sends done. The stalled path pauses indefinitely so the parent can exercise its deadline.', 'if (stalled)', 5),
    step('Clean up after the deadline', 'When no message arrives, the supervisor sends SIGTERM and collects the exit status. Both operations are needed to finish the worker’s lifecycle.', 'if (ready <= 0)', 5)),
  pidfd: guide(
    "Watch a process descriptor for exit while a separate timer controls when to escalate termination.",
    "Read each “deadline: sent” line and the “pidfd became readable” line. The last line names the signal that waitpid() observed when collecting the worker.",
    'const int ignore_term =',
    step('Watch the worker and timer together', 'A pidfd refers to one particular process. Poll can wait for that process to exit alongside the timer descriptor.', 'int pidfd = (int)syscall(SYS_pidfd_open', 6),
    step('Escalate only after the second deadline', 'The first event signals SIGTERM. If the timer fires again before exit, the next event sends SIGKILL via the same process descriptor.', 'int next = sent ? SIGKILL : SIGTERM;', 6)),
};
