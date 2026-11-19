function man(page, note, title) {
  const [name, section] = page.split('.');
  return {
    title: title ?? `${name}(${section})`,
    url: `https://man7.org/linux/man-pages/man${section}/${page}.html`,
    note
  };
}

function posix(name, note, title = name + '()') {
  return { title, url: 'https://pubs.opengroup.org/onlinepubs/9799919799/functions/' + name + '.html', note };
}

const open = man('open.2', 'With <fcntl.h>, open(path, O_RDONLY) returns a descriptor on success or -1 and sets errno on failure. openat() also accepts a directory descriptor for resolving a relative path.', 'open(), openat()');
const close = man('close.2', 'close() in <unistd.h> releases the descriptor. It returns 0 on success and -1 on error.');
const errno = man('errno.3', 'Read errno only after a call reports failure. EBADF means the descriptor is invalid for the requested operation or is closed.');
const read = man('read.2', 'read() returns the number of bytes copied, 0 at EOF for a positive-size file read, or -1 on error. A positive short count is valid.');
const write = man('write.2', 'write() can accept fewer bytes than requested. Use its positive return value to advance the buffer and reduce the remaining length.');
const seek = man('lseek.2', 'lseek(fd, 0, SEEK_SET) puts the open file’s offset back at the start. It returns the new offset or -1 on error.');
const unlink = man('unlink.2', 'Remove a name with unlink() or unlinkat(). An open descriptor can still refer to the file after its last name is removed.', 'unlink(), unlinkat()');
const exec = man('execve.2', 'On success, exec replaces the program in the current process. Open descriptors survive unless they have FD_CLOEXEC set.', 'execve() and descriptor inheritance');
const fork = man('fork.2', 'fork() returns 0 in the child, the child’s PID in the parent, or -1 on error. Inherited descriptors refer to the same open file descriptions.');
const wait = man('waitpid.2', 'waitpid() waits for a child state change and reaps a terminated child. Check WIFEXITED or WIFSIGNALED before decoding the status.');
const pipe = man('pipe.7', 'A pipe reader sees EOF only after all descriptors referring to its write end are closed and the buffered data has been read.', 'Pipe lifetime and EOF');
const mask = man('sigprocmask.2', 'SIG_BLOCK adds signals to the thread’s mask. A signal sent to a single-threaded process while blocked can stay pending until explicitly collected.');
const kill = man('kill.2', 'Use a positive PID to signal one process. A PID less than -1 identifies a process group. A successful send does not report how the receiver handled it.');
const poll = man('poll.2', 'poll() reports ready descriptors through revents. It returns 0 when the timeout expires and -1 on error.');
const mmap = man('mmap.2', 'mmap() returns an address or MAP_FAILED. MAP_SHARED exposes updates through other mappings of the same region. MAP_PRIVATE uses copy-on-write. munmap() removes the mapping.', 'mmap(), munmap()');
const pthreadCreate = man('pthread_create.3', 'pthread_create() starts a thread at a function and passes it one argument. It returns an error number directly on failure.');
const pthreadJoin = man('pthread_join.3', 'pthread_join() waits for a joinable thread to finish and reclaims its remaining thread resources.');
const strace = man('strace.1', 'Use -e trace=write to show write system calls with arguments, return values and error names.');

export const references = {
  'open-file': [open, close],
  'api-errors': [open, read, errno, man('strerror.3', 'strerror() converts a saved errno value into a human-readable error description.')],
  'api-bytes': [write, seek, read],
  'api-metadata': [
    open, man('stat.2', 'fstat() reports metadata for an open descriptor through struct stat, including st_size, st_mode and st_nlink.', 'fstat()'),
    man('chmod.2', 'fchmod() updates permission bits on the file referred to by an open descriptor.', 'fchmod()'), unlink
  ],
  descriptors: [
    open, man('dup.2', 'dup() makes a second descriptor for the same open file description, so both share the offset. A separate open creates an independent offset.', 'dup(), dup2()'), read
  ],
  cloexec: [
    man('fcntl.2', 'F_DUPFD duplicates a descriptor into a slot at or above the given number. F_SETFD sets descriptor flags, including FD_CLOEXEC.', 'fcntl(F_DUPFD, F_SETFD)'),
    man('execl.3', 'execl() replaces the process image and takes an argument list terminated by a null pointer. A successful exec never returns.'),
    exec, open
  ],
  pipeline: [
    man('pipe.2', 'pipe2() fills a two-element array with the read descriptor first and the write descriptor second. O_CLOEXEC sets close-on-exec on both.', 'pipe2()'),
    man('dup.2', 'dup2(oldfd, newfd) makes newfd refer to the same open file description as oldfd. The exercise uses it to attach standard output or input to a pipe.', 'dup2()'),
    pipe, exec, wait
  ],
  signals: [
    mask, fork, kill, man('sigwaitinfo.2', 'sigwaitinfo() consumes one pending signal from its set and returns the signal number. Block the signals in the set before waiting.')
  ],
  jobs: [
    man('posix_openpt.3', 'Open a pseudoterminal master, then use grantpt(), unlockpt() and ptsname() to prepare and locate its slave.'),
    man('setsid.2', 'setsid() creates a session and a process group. The new session initially has no controlling terminal.'),
    man('setpgid.2', 'setpgid() places the child in a process group. The group is the unit that receives job-control signals.'),
    man('tcsetpgrp.3', 'tcsetpgrp() sets the foreground process group of the controlling terminal.'),
    man('termios.3', 'With ISIG enabled, the byte configured as VSUSP sends SIGTSTP to the foreground group.', 'tcgetattr(), tcsetattr(), VSUSP'),
    wait
  ],
  mapping: [mmap, fork, wait],
  filemap: [
    man('truncate.2', 'ftruncate() sets the open file’s size before mapping. The new region reads as zero when a file is extended.', 'ftruncate()'),
    mmap, man('msync.2', 'MS_SYNC waits for synchronisation of a shared file mapping. It does not publish private copy-on-write changes.'),
    man('pread.2', 'pread() reads from an explicit offset without moving the descriptor’s current offset.')
  ],
  threads: [
    pthreadCreate, posix('pthread_mutex_lock', 'Lock the mutex before reading or changing the shared queue state. Unlock it after publishing the update.', 'pthread_mutex_lock(), pthread_mutex_unlock()'),
    posix('pthread_cond_wait', 'The wait releases the mutex and reacquires it before returning. Check the condition in a loop because wakeups alone do not guarantee it is true.'),
    posix('pthread_cond_signal', 'Signal a condition variable after updating the shared state to wake a waiter. The waiter rechecks that state after taking the mutex.'), pthreadJoin
  ],
  atomics: [
    { title: 'C11 · <stdatomic.h> and memory order', url: 'https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf', note: 'See §7.17.3 and §7.17.7 for atomic loads, stores and fetch operations. A relaxed add makes the counter atomic. An acquire load that sees the release store can then safely read the published checksum.' },
    pthreadCreate, pthreadJoin
  ],
  mqueue: [
    man('mq_open.3', 'mq_open() creates or opens a POSIX message queue. mq_maxmsg and mq_msgsize set its capacity and per-message size.'),
    man('mq_send.3', 'mq_send() takes a message and an unsigned priority. Higher numbers take precedence.'),
    man('mq_receive.3', 'mq_receive() returns the oldest message at the highest available priority. The buffer must hold mq_msgsize bytes. An empty nonblocking queue gives EAGAIN.'),
    man('mq_unlink.3', 'mq_unlink() removes the name immediately. The queue stays alive until the remaining descriptors are closed.')
  ],
  replace: [
    open, man('rename.2', 'renameat() replaces the destination name atomically on the same filesystem. Readers that already hold a descriptor can keep reading the old file.', 'renameat()'),
    man('fsync.2', 'Sync the staging file before renaming, then sync the containing directory if the directory entry needs to reach durable storage. The lab demonstrates visibility in the guest.')
  ],
  inotify: [
    man('inotify_init.2', 'inotify_init1() creates a descriptor from which you read filesystem events.', 'inotify_init1()'),
    man('inotify_add_watch.2', 'inotify_add_watch() selects which events to report. IN_MOVED_TO reports a name moved into the watched directory.'),
    man('inotify.7', 'One read can contain several event records. Advance by sizeof(struct inotify_event) plus the record’s len field.', 'inotify event records'),
    man('rename.2', 'renameat() moves staged to ready in the watched directory. That move generates IN_MOVED_TO.', 'renameat()')
  ],
  events: [man('eventfd.2', 'Read and write an eight-byte uint64_t. In the default mode, a successful read returns the accumulated count and resets it to zero.'), poll],
  'fd-events': [
    mask, man('signalfd.2', 'Read blocked signals as signalfd_siginfo records. A pending signal in the mask makes the descriptor readable.'),
    man('timerfd_create.2', 'Create a timer descriptor, arm it with timerfd_settime(), and read its eight-byte count of expirations.', 'timerfd_create(), timerfd_settime()'),
    man('epoll.7', 'Register each descriptor with epoll_ctl(). epoll_wait() supplies ready events and their saved data.', 'epoll_create1(), epoll_ctl(), epoll_wait()')
  ],
  limits: [
    man('getrlimit.2', 'RLIMIT_NOFILE is one greater than the highest descriptor number the process may open. getrlimit() reads the soft and hard limits and setrlimit() updates them.', 'getrlimit(), setrlimit()'),
    man('open.2', 'When no descriptor slots are available under the process limit, open() fails with EMFILE.')
  ],
  trace: [strace, write, errno],
  supervise: [pipe, fork, poll, kill, wait],
  pidfd: [
    man('pidfd_open.2', 'pidfd_open() returns a descriptor for a specific process. Poll it for readability to observe process termination.'),
    man('pidfd_send_signal.2', 'Send a signal to the process identified by the descriptor. This avoids signalling an unrelated process after numeric PID reuse.'),
    man('timerfd_create.2', 'Arm a timer descriptor to represent each deadline. Read the expiration count to consume the event.', 'timerfd_create(), timerfd_settime()'),
    poll, wait
  ]
};
