export const concepts = {
  "open-file": {
    title: "The lifetime of one file descriptor",
    visual: {
      kind: "layers",
      layers: [
        ["C program","open(path, O_RDONLY)","Names the file and requested access"],
        ["Kernel","Resolve path and open file","Install a reference in the process descriptor table"],
        ["C program","fd","Pass the descriptor to close() when finished"],
      ],
      crossings: ["System call","Return descriptor"],
    },
    caption: "Check for -1 before treating the result as a handle. A later open can reuse the same number.",
  },
  "api-errors": {
    title: "Read errno at the right moment",
    visual: {
      kind: "layers",
      layers: [
        ["C program","read(fd, …)","The descriptor was opened write-only"],
        ["Kernel","Check the access mode","Read access is missing"],
        ["C program","Return -1, errno = EBADF","Check the return value before interpreting errno"],
      ],
      crossings: ["System call","Failure"],
    },
    caption: "First inspect the return value. Successful calls do not promise to clear leftover errno.",
  },
  "api-bytes": {
    title: "Write, rewind and collect the bytes",
    nodes: [
      ["write()","Updates bytes and advances offset"],
      ["lseek()","Puts offset back at zero"],
      ["read()","Advance by the returned count"],
    ],
    caption: "File reads can be short. A zero count here means the file is at EOF.",
  },
  "api-metadata": {
    title: "Keep file access after unlink",
    visual: {
      kind: "state",
      identity: "The same open descriptor",
      before: ["Before unlink","Name refers to the file. fstat reports its metadata."],
      action: "unlinkat() removes the name",
      after: ["After unlink","The descriptor still refers to the file. fstat can show the new link count."],
    },
    caption: "Removing a name and releasing an open descriptor are separate operations.",
  },
  "descriptors": {
    title: "Two handles can share one offset",
    visual: {
      kind: "object",
      sources: [
        ["Original descriptor","Read h at offset 0"],
        ["dup() descriptor","Read e at offset 1"],
      ],
      target: ["One open file description","Both reads advance the same position."],
      field: ["Shared offset after both reads","2"],
    },
    caption: "An independent open creates a separate open file description with its own offset.",
  },
  "cloexec": {
    title: "Follow a descriptor across exec",
    visual: {
      kind: "compare",
      cases: [
        {"label":"FD_CLOEXEC set","facts":[["Before exec","Descriptor is open"],["After exec","The kernel closes it"]]},
        {"label":"FD_CLOEXEC clear","facts":[["Before exec","Descriptor is open"],["After exec","The descriptor survives"]]},
      ],
    },
    caption: "Close-on-exec is a flag on a descriptor. Duplicates may have different flag values.",
  },
  "file-apis-capstone": {
    title: "Observe the file and its shared offset",
    visual: {
      kind: "object",
      sources: [
        ["Original descriptor","Seek to byte 0"],
        ["Duplicate descriptor","Read h and advance over it"],
      ],
      target: ["Open file description","One shared position for both handles. The file still contains 5 bytes."],
      field: ["Offset observed on original","1"],
    },
    caption: "File size describes the stored bytes. The offset records where the next sequential read will start.",
  },
  "pipe-read": {
    title: "Read past the final queued byte",
    visual: {
      kind: "queue",
      writer: ["Write end","write() sends go, then closes"],
      name: "Queued pipe bytes",
      cells: ["g","o",null,null],
      reader: ["Read end","Reads queued bytes first"],
      signal: ["EOF","Only after all writers are closed and buffered bytes are consumed."],
    },
    caption: "The reader drains queued bytes first. EOF follows when no write end is still open.",
  },
  "pipeline": {
    title: "Connect one process’s output to another’s input",
    visual: {
      kind: "queue",
      writer: ["Producer","stdout → write end via dup2()"],
      name: "Pipe buffer",
      cells: ["h","e","l","l","o"],
      reader: ["Consumer","stdin ← read end via dup2()"],
      signal: ["Parent’s copies","Close both unused descriptors so they do not keep a writer open."],
    },
    caption: "The parent closes its copies so the consumer can reach EOF after the producer exits.",
  },
  "signals": {
    title: "Block, queue and collect one signal",
    visual: {
      kind: "sequence",
      participants: ["Parent process","Child process"],
      messages: [
        ["local-left","Block SIGUSR1","sigprocmask() before fork()"],
        ["left","SIGUSR1","Child sends it while the parent blocks delivery"],
        ["local-left","sigwaitinfo()","Consumes the pending signal"],
      ],
    },
    caption: "The parent can wait after the signal arrived because the blocked signal can remain pending.",
  },
  "jobs": {
    title: "Stop and resume a foreground process group",
    visual: {
      kind: "sequence",
      participants: ["Terminal / supervisor","Foreground job"],
      messages: [
        ["local-left","tcsetpgrp()","Assign the job’s process group to the terminal"],
        ["right","SIGTSTP","Terminal generates the signal from the suspend byte"],
        ["local-left","waitpid(WUNTRACED)","Observe the stopped status"],
        ["right","SIGCONT","Resume the job"],
      ],
    },
    caption: "The terminal targets its foreground process group. A stopped child has a state change before it exits.",
  },
  "mapping": {
    title: "Compare shared and private pages after fork",
    visual: {
      kind: "compare",
      cases: [
        {"label":"MAP_SHARED","facts":[["Child writes","Both views refer to the updated shared page"],["Parent after waiting","Sees the child’s update"]]},
        {"label":"MAP_PRIVATE","facts":[["Child writes","A private changed page is created for the writer"],["Parent after waiting","Keeps its original value"]]},
      ],
    },
    caption: "MAP_SHARED exposes updates through both mappings. MAP_PRIVATE gives a writer its own changed page.",
  },
  "filemap": {
    title: "Compare the mapping with the backing file",
    visual: {
      kind: "compare",
      cases: [
        {"label":"MAP_SHARED","facts":[["Write through mapping","Mapped byte changes"],["pread() from file","Sees the changed byte"]]},
        {"label":"MAP_PRIVATE","facts":[["Write through mapping","Mapped byte changes in a private copy"],["pread() from file","Sees the original byte"]]},
      ],
    },
    caption: "MAP_PRIVATE changes the mapped view while pread still sees the original file.",
  },
  "thread-start": {
    title: "Start one worker and wait for it",
    visual: {
      kind: "sequence",
      participants: ["Main thread","Worker"],
      messages: [
        ["right","pthread_create()","Pass a pointer to live data"],
        ["local-right","Use the input","Worker runs independently"],
        ["left","Worker finishes","pthread_join() waits for this point"],
        ["local-left","Continue","Main can now leave the input’s scope"],
      ],
    },
    caption: "The pointed-to data must stay live while the worker uses it.",
  },
  "threads": {
    title: "Coordinate a shared queue",
    visual: {
      kind: "queue",
      writer: ["Producer","Locks, stores value, signals"],
      name: "One-slot queue",
      cells: ["value"],
      reader: ["Consumer","Wakes, rechecks and reads"],
      signal: ["Shared rule","Both check the queue predicate while holding the same mutex."],
    },
    caption: "The consumer reacquires the mutex and checks again. A wakeup is a reason to recheck the predicate.",
  },
  "atomics": {
    title: "Publish a result through an atomic flag",
    visual: {
      kind: "sequence",
      participants: ["Publishing thread","Main thread"],
      messages: [
        ["local-left","Write checksum","The data write precedes the ready flag"],
        ["right","Ready flag","Release store becomes visible to the acquire load"],
        ["local-right","Read checksum","Only after the acquire load observes publication"],
      ],
    },
    caption: "The release and acquire pair orders the data publication. The atomic count serves a separate purpose.",
  },
  "memory-capstone": {
    title: "Watch a worker modify a mapped byte",
    visual: {
      kind: "compare",
      cases: [
        {"label":"MAP_SHARED","facts":[["After worker joins","Mapping contains W"],["Read from file","W"]]},
        {"label":"MAP_PRIVATE","facts":[["After worker joins","Mapping contains W"],["Read from file","B"]]},
      ],
    },
    caption: "The join establishes completion. The mapping mode controls whether the write reaches the file view.",
  },
  "mqueue": {
    title: "Observe priority in the receive order",
    visual: {
      kind: "queue",
      writer: ["Sender","Sends first, then second"],
      name: "Priority order at receive",
      cells: ["second","first"],
      reader: ["Receiver","mq_receive() takes highest priority first"],
      signal: ["Starter priorities","second has 5. first has 1."],
    },
    caption: "Priority can change delivery order. Within a priority, messages are received in queue order.",
  },
  "replace": {
    title: "Replace a name while a reader holds the old file",
    visual: {
      kind: "compare",
      cases: [
        {"label":"Reader already holding an fd","facts":[["Before rename","Descriptor points to old file"],["After rename","Reads old contents"]]},
        {"label":"Reader opening the name later","facts":[["After rename","Name resolves to replacement"],["After open","Reads new contents"]]},
      ],
    },
    caption: "The directory entry changes atomically. The old open descriptor still refers to the old file.",
  },
  "inotify": {
    title: "Observe which filesystem names changed",
    visual: {
      kind: "layers",
      layers: [
        ["Filesystem","Directory entry changes","A watched create or move produces an event"],
        ["Kernel","inotify descriptor","Queues a record for the watch"],
        ["Application","Read and decode records","Use each record’s mask and name length"],
      ],
      crossings: ["Generate event","Read events"],
    },
    caption: "One read can return several records. Advance by each fixed header and its reported name length.",
  },
  "events": {
    title: "Convert a counter into readiness",
    visual: {
      kind: "state",
      identity: "The same eventfd counter",
      before: ["Before read","Counter is nonzero. poll() reports readable."],
      action: "read() takes the count",
      after: ["After read","Counter is 0. An immediate poll finds no input."],
    },
    caption: "A normal eventfd read resets the counter. Another immediate poll can confirm it was consumed.",
  },
  "fd-events": {
    title: "Wait for a signal and a timer together",
    visual: {
      kind: "object",
      sources: [
        ["signalfd","A pending signal is readable"],
        ["timerfd","An expiration is readable"],
      ],
      target: ["One epoll wait","The event identifies which descriptor is ready."],
      field: ["Read format","Signal record or 64-bit count"],
    },
    caption: "Readiness does not identify the record format. Use the registered descriptor to decide what to read.",
  },
  "events-capstone": {
    title: "Watch an atomic name change in an event loop",
    visual: {
      kind: "layers",
      layers: [
        ["Application","renameat()","Publish staged under the name current"],
        ["Kernel","inotify + epoll","Enqueue IN_MOVED_TO, then signal descriptor readiness"],
        ["Event loop","Decode the record","Match IN_MOVED_TO and the name current"],
      ],
      crossings: ["Publish name","Read ready descriptor"],
    },
    caption: "epoll delivers readiness on the event stream. The inotify record confirms the publication.",
  },
  "limits": {
    title: "Observe a per-process descriptor limit",
    nodes: [
      ["Set limit","RLIMIT_NOFILE bounds descriptor numbers"],
      ["Open repeatedly","Consume slots"],
      ["Failure","open returns -1 with EMFILE"],
    ],
    caption: "Existing descriptors count towards the limit. The process may have fewer new slots than the numeric limit.",
  },
  "trace": {
    title: "Match a program error to a syscall",
    visual: {
      kind: "layers",
      layers: [
        ["C program","write(-1, …)","Pass an invalid descriptor"],
        ["Kernel","Descriptor lookup fails","Returns an error"],
        ["strace","write(-1, …) = -1 EBADF","Shows arguments and the syscall result"],
      ],
      crossings: ["System call","Observed result"],
    },
    caption: "The program’s later diagnostic is a separate successful write. Use arguments to identify the failing call.",
  },
  "diagnostics-capstone": {
    title: "Confirm descriptor exhaustion in the trace",
    visual: {
      kind: "layers",
      layers: [
        ["Application","Open /dev/null repeatedly","Each successful open takes a descriptor slot"],
        ["Kernel","Limit reached","RLIMIT_NOFILE leaves no slot for the next open"],
        ["strace","open(…) = -1 EMFILE","The last failed open identifies the cause"],
      ],
      crossings: ["Attempt another open","Read the trace"],
    },
    caption: "Lowering the process limit reduces the count of successful opens. The failure remains EMFILE.",
  },
  "supervise": {
    title: "Follow a response or a deadline",
    visual: {
      kind: "compare",
      cases: [
        {"label":"Worker replies","facts":[["Readiness","Result pipe has data"],["Supervisor","Reads result and reaps worker"]]},
        {"label":"Deadline expires","facts":[["Readiness","poll() returns 0"],["Supervisor","Signals worker, then reaps it"]]},
      ],
    },
    caption: "A timeout and a child exit tell you different things. The parent still collects the child’s status.",
  },
  "pidfd": {
    title: "Watch a worker by process descriptor",
    nodes: [
      ["Start worker","Open pidfd and timerfd"],
      ["First deadline","Send SIGTERM"],
      ["Second deadline","Escalate if needed, then reap"],
    ],
    caption: "The pidfd can become readable as soon as the worker exits. The timer describes the supervisor’s deadline.",
  },
};
