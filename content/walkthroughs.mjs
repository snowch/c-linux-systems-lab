const step = (heading, text, anchor, lines) => ({ heading, text, anchor, lines });
const guide = (goal, look, edit, ...steps) => ({ goal, look, edit, steps });

export const walkthroughs = {
  "thread-start": {
    "goal": "Pass a message to one thread and wait for the thread to finish. The next lesson adds a shared queue and safe coordination.",
    "look": "Find the worker’s message, then worker joined.",
    "edit": "const char message[]",
    "steps": [
      {
        "heading": "Accept one argument",
        "text": "The thread entry receives the pointer passed to pthread_create().",
        "anchor": "const char *message = argument;",
        "lines": 2
      },
      {
        "heading": "Start the worker and wait",
        "text": "pthread_join() waits for the worker before main prints its last line.",
        "anchor": "thread_ok(pthread_create(",
        "lines": 3
      }
    ]
  },
  "pipe-read": {
    "goal": "Use a pipe within one process. Write two bytes, close the writer, then read the bytes followed by EOF.",
    "look": "Look for the first byte count and then the zero-byte EOF. The next lesson connects separate processes to the same kind of pipe.",
    "edit": "const char text[]",
    "steps": [
      {
        "heading": "Create a read end and a write end",
        "text": "The two descriptors refer to opposite ends of the same pipe.",
        "anchor": "int ends[2];",
        "lines": 2
      },
      {
        "heading": "Write, close and read",
        "text": "Closing the final writer leaves any queued bytes available to the reader. After those bytes are consumed, the next read reports EOF.",
        "anchor": "require(write(ends[1]",
        "lines": 5
      }
    ]
  },
  'open-file': guide(
    'Open /dev/null, a device that discards writes and has no bytes to read. Use the handle Linux gives you, then release it.',
    'Find the path and the nonnegative descriptor. Linux chooses the descriptor number.',
    'const char *path =',
    step('Ask Linux to open the path', 'O_RDONLY requests read access. On success, open() returns a file descriptor, the number this process can use in later calls.', 'const char *path =', 2),
    step('Check the handle before closing it', 'Linux reports a failed open with -1. Check it before trying to release the handle with close().', 'if (fd < 0)', 4)),
  'api-errors': guide(
    'Open an existing file with write access, then try a read on that same descriptor. Use the return value to decide when errno is meaningful.',
    'The open succeeds. The read reports -1 and Bad file descriptor, the text for EBADF.',
    'const int flags =',
    step('Choose an access mode', 'O_WRONLY asks only for write access. open() can succeed even though the resulting descriptor cannot read.', 'const int flags = O_WRONLY;', 2),
    step('Read the error after the failed call', 'read() returns a byte count or -1. Save errno immediately after failure to report its cause.', 'ssize_t result = read(fd, &byte, 1);', 4)),
  'api-bytes': guide(
    'Write a short message to a temporary file, rewind, and read it a few bytes at a time.',
    'Find reads of 4, 4 and 3 bytes and EOF after 11 bytes. Changing the buffer size should change the pieces.',
    'char buffer[4];',
    step('Advance by the bytes actually written', 'write() may accept fewer bytes than requested. The loop adds the returned count and retries from the remaining part.', 'ssize_t n = write(fd, text + written', 5),
    step('Rewind before the first read', 'Both operations move the same file offset. SEEK_SET sets that offset back to zero so the next read begins at the first byte.', 'require(lseek(fd, 0, SEEK_SET)', 5)),
  'api-metadata': guide(
    'Create a four-byte file, change its mode, then remove its name while keeping the descriptor open.',
    'Check mode 640 and size 4. After unlink, the descriptor still reports size 4 and zero links.',
    'require(fchmod(fd, 0640)',
    step('Open relative to a directory descriptor', 'openat() uses dir as the starting directory. fchmod() applies to the resulting open file, even if its name changes later.', 'int fd = openat(dir, "data"', 4),
    step('Ask about the open file again', 'unlinkat() removes a name, reducing the file’s link count. The descriptor still refers to the file object until it closes.', 'require(unlinkat(dir, "data",', 4)),
  descriptors: guide(
    'Compare a duplicated descriptor with a second open of the same file. Observe which reads share a position.',
    'The starter prints original=h, duplicate=e and independent=h.',
    'int copy = dup(fd)',
    step('Create two more handles', 'dup() shares the original open file description, which holds the current offset. open() creates a separate description with its own offset.', 'int copy = dup(fd), independent', 2),
    step('Read one byte on each handle', 'The first read moves the shared offset forward. The duplicate reads from that new position while the independent descriptor starts at zero.', 'require(read(fd, &a, 1)', 3)),
  cloexec: guide(
    'Pass one descriptor number through exec and check whether the new program can still use it.',
    'Look for “after exec” and “closed”. Clearing close-on-exec should make the descriptor stay open.',
    'const int close_on_exec =',
    step('Give the new descriptor a flag', 'FD_CLOEXEC belongs to this descriptor. A successful exec closes it if the flag is set.', 'require(fcntl(inherited, F_SETFD', 1),
    step('Replace the program and keep the number', 'exec removes the current program but keeps the process. The new program receives the descriptor number as an argument and checks it.', 'snprintf(descriptor, sizeof descriptor', 2)),
  pipeline: guide(
    'Connect a producer’s output to a consumer’s input. Trace when the reader can tell it has received all the bytes.',
    'Find HELLO and “both processes exited”. The second line confirms the consumer received EOF and the parent reaped both children.',
    'close(pipefd[1]); /* A surviving write end',
    step('Redirect the producer’s standard output', 'dup2() points descriptor 1 at the pipe writer. The new program inherits standard output after exec and writes there.', 'if (dup2(pipefd[1], STDOUT_FILENO)', 5),
    step('Close the copy held by the parent', 'EOF arrives only after the last write descriptor closes. The parent does not write, so it closes its copy before waiting.', 'close(pipefd[1]); /* A surviving write end', 3)),
  signals: guide(
    'Let a child notify its parent even if the parent has not reached the wait call yet.',
    'Find “parent received SIGUSR1”. The signal can be pending before sigwaitinfo() starts.',
    'int delivered = sigwaitinfo',
    step('Block the signal before forking', 'A blocked signal can become pending. This avoids depending on whether the child or parent runs first.', 'sigemptyset(&pending);', 3),
    step('Consume the pending signal', 'sigwaitinfo() waits for the chosen signal or returns it immediately if one is pending. The parent can then reap the child.', 'int delivered = sigwaitinfo', 4)),
  jobs: guide(
    'Use a private terminal to see which job stops when the terminal receives its suspend key.',
    'Find the foreground job’s stop and the supervisor’s resume and reap messages.',
    'const unsigned char suspend_key =',
    step('Choose a byte for suspension', 'ISIG enables terminal-generated signals. VSUSP defines which input byte should suspend the foreground job.', 'settings.c_lflag |= ISIG;', 4),
    step('Give the terminal to the job', 'tcsetpgrp() selects the foreground process group. Writing the suspend byte to the other end of the pseudoterminal simulates terminal input.', 'require(setpgid(job, job) == 0 && tcsetpgrp(tty, job)', 3)),
  mapping: guide(
    'Write the same value from a child into a shared mapping and a private one. Compare what the parent sees afterward.',
    'The parent should see shared=4 and private=1.',
    '*shared = *private = JOBS;',
    step('Choose how each memory region shares writes', 'The mappings both start as anonymous memory without a backing file. MAP_SHARED and MAP_PRIVATE determine whether another process sees later writes.', 'int *shared = mmap(', 4),
    step('Wait before reading the values', 'The child writes both values and exits. The parent waits before comparing its view of the two mappings.', '*shared = *private = JOBS;', 5)),
  filemap: guide(
    'Write through a memory mapping, then ask what a regular read sees through the file descriptor.',
    'The starter reports 77 for both bytes, the numeric value of M. A private mapping should change only its own view.',
    'const int mapping_type =',
    step('Map the file as writable memory', 'mmap() connects a region of memory to the file. MAP_SHARED lets writes through the mapping update what the file descriptor can read.', 'const int mapping_type = MAP_SHARED;', 4),
    step('Compare the two ways of reading the byte', 'pread() reads at a specific offset without moving the descriptor’s current position. Compare that result with bytes[0].', 'require(pread(fd, &disk_byte,', 2)),
  threads: guide(
    'Send one value at a time between two threads and use a condition variable to wait for space.',
    'Check that the worker consumed four jobs and added them to 10. Predict the sum after changing the job count.',
    'JOBS = 4',
    step('Check the condition while holding the mutex', 'The mutex protects full and value. The condition wait releases the mutex while sleeping, and the loop checks full again after reacquiring it.', 'thread_ok(pthread_mutex_lock(&queue.mutex), "lock");', 4),
    step('Publish the value before signalling', 'Set the queue contents and mark it full before notifying the consumer. It will see the update after acquiring the mutex.', 'queue.full = 1;', 3)),
  atomics: guide(
    'Let two threads increment one counter while using a separate flag to publish a checksum.',
    'Find checksum 42 and a combined count of 20000. Changing INCREMENTS changes the count.',
    'INCREMENTS = 10000',
    step('Publish data with a release store', 'Relaxed operations keep each counter update atomic. The release store on ready publishes the earlier write to checksum.', 'atomic_fetch_add_explicit(&result->count,', 3),
    step('Wait for publication with an acquire load', 'Once acquire sees the ready value from the release store, reading checksum also sees the producer’s earlier write.', 'while (!atomic_load_explicit(&result.ready,', 3)),
  mqueue: guide(
    'Send two separate messages with different priorities. See whether send order decides receive order.',
    'Expect “second” before “first”, then EAGAIN when the nonblocking queue is empty.',
    'const unsigned first_priority =',
    step('Send a message with each priority', 'The queue preserves message boundaries. Each mq_send() supplies a priority along with its bytes.', 'const unsigned first_priority =', 3),
    step('Read one complete message at a time', 'mq_receive() also reports the selected message’s priority. The queue chooses the highest priority first.', 'require(mq_receive(queue, data, sizeof data, &priority)', 2)),
  replace: guide(
    'Publish a new version of a file while a reader still holds the old version open.',
    'The old descriptor prints “old”. The path opened after the rename prints “hello”.',
    'static const char sample[]',
    step('Publish the staged file at the destination name', 'renameat() changes the directory entry. An already open descriptor still refers to the old file object.', 'require(renameat(dir, "staged",', 2),
    step('Open the same name again', 'The new open follows the replacement directory entry. The two descriptors can now read different contents.', 'int next = openat(dir, "state",', 5)),
  inotify: guide(
    'Watch a directory while an application stages a file and renames it into place.',
    'Find “created: staged” followed by “moved into directory: ready”.',
    'const uint32_t watch =',
    step('Select the events to watch', 'IN_CREATE detects new entries and IN_MOVED_TO detects names moved into the directory. Both records arrive through the inotify descriptor.', 'const uint32_t watch =', 3),
    step('Advance to the next record', 'Each record includes a fixed header and a variable-length name. Use the length field to find the next record.', 'const struct inotify_event *event =', 3)),
  events: guide(
    'Write several notifications to an eventfd and read their combined count once it becomes ready.',
    'Find poll before=0, ready=1, count=4 and after=0. A read drains the default counter.',
    'const uint64_t increment =',
    step('Increment a kernel counter', 'An eventfd write adds a 64-bit value to its counter. Readiness means the counter now has something to report.', 'const uint64_t increment =', 2),
    step('Read the sum in one operation', 'A normal eventfd read returns the accumulated count and resets it. The last poll should find no readable data.', 'uint64_t count;', 4)),
  'fd-events': guide(
    'Read a signal and a timer expiry in one event loop by treating both as file descriptors.',
    'Find the SIGUSR1 record and the one timer expiration. Their order can vary.',
    'const long delay_ns =',
    step('Create two distinct event sources', 'signalfd() reads a blocked signal from its descriptor. timerfd_create() makes another descriptor for the timer.', 'int signals = signalfd(', 4),
    step('Read the record for the ready descriptor', 'epoll reports which descriptor is ready. The signal path reads a signal record, while the timer path reads an expiration count.', 'if (event.data.fd == signals)', 5)),
  limits: guide(
    'Make one process run out of descriptor slots so you can recognise that failure in a larger program.',
    'Find the soft limit and the final EMFILE. The number of new opens can be lower than the limit because other descriptors are already open.',
    'const rlim_t maximum =',
    step('Lower the limit for this process', 'The soft limit controls the descriptor slots this process may allocate. The hard limit bounds what the process can set without more privileges.', 'const rlim_t maximum =', 5),
    step('Check the error after exhausting the slots', 'The loop stops when open() fails. EMFILE identifies this process’s descriptor limit as the cause.', 'while ((fd = open("/dev/null",', 3)),
  trace: guide(
    'Compare a C program’s error message with the kernel call that caused it.',
    'In the trace, find the write on descriptor -1 and the EBADF result. The program prints the same underlying error in words.',
    'const int fd = -1;',
    step('Make one write with a known descriptor', 'The descriptor -1 is invalid. The program still passes a real buffer and a byte count, so the descriptor is the failure you can isolate.', 'const int fd = -1;', 2),
    step('Compare the program’s explanation with strace', 'The starter run traces write only. Read the first failing write before the later write that prints the explanation.', 'if (result == -1)', 2)),
  supervise: guide(
    'Compare a worker that replies with one that stalls. Give the parent a deadline before it cleans up the worker.',
    'The starter prints a normal reply and a separate deadline expiry with the worker reaped.',
    'if (stalled)',
    step('Choose how the worker behaves', 'The normal worker sends done. The stalled path pauses indefinitely so the parent can exercise its deadline.', 'if (stalled)', 5),
    step('Clean up after the deadline', 'When no message arrives, the supervisor sends SIGTERM and collects the exit status. Both operations are needed to finish the worker’s lifecycle.', 'if (ready <= 0)', 5)),
  pidfd: guide(
    'Watch a process descriptor for exit while a separate timer controls when to escalate termination.',
    'Find SIGTERM, then SIGKILL and the reaped status. When the worker accepts SIGTERM it can exit before the second deadline.',
    'const int ignore_term =',
    step('Watch the worker and timer together', 'A pidfd refers to one particular process. Poll can wait for that process to exit alongside the timer descriptor.', 'int pidfd = (int)syscall(SYS_pidfd_open', 6),
    step('Escalate only after the second deadline', 'The first event signals SIGTERM. If the timer fires again before exit, the next event sends SIGKILL via the same process descriptor.', 'int next = sent ? SIGKILL : SIGTERM;', 6)),
};
