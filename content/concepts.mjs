export const concepts = {
  "open-file": {
    title: "The lifetime of one file descriptor",
    nodes: [
      ["open()", "Path and access flags"],
      ["Linux", "Installs an open-file reference"],
      ["close()", "Releases the descriptor"]
    ],
    caption: "Check for -1 before treating the result as a handle. A later open can reuse the same number."
  },
  "api-errors": {
    title: "Read errno at the right moment",
    nodes: [
      ["Call", "read on a write-only descriptor"],
      ["Return value", "-1 shows failure"],
      ["Diagnose", "errno is EBADF"]
    ],
    caption: "First inspect the return value. Successful calls do not promise to clear leftover errno."
  },
  "api-bytes": {
    title: "Write, rewind and collect the bytes",
    nodes: [
      ["write()", "Updates bytes and advances offset"],
      ["lseek()", "Puts offset back at zero"],
      ["read()", "Advance by the returned count"]
    ],
    caption: "File reads can be short. A zero count here means the file is at EOF."
  },
  "api-metadata": {
    title: "Keep file access after unlink",
    nodes: [
      ["Open file", "fstat reads metadata through fd"],
      ["unlinkat()", "Removes directory entry"],
      ["Same fd", "Still reads file and sees link count change"]
    ],
    caption: "Removing a name and releasing an open descriptor are separate operations."
  },
  "descriptors": {
    title: "Two handles can share one offset",
    nodes: [
      ["Original fd", "Refers to one open file description"],
      ["dup()", "Adds another descriptor to that description"],
      ["Read either fd", "Advances the shared offset"]
    ],
    caption: "An independent open creates a separate open file description with its own offset."
  },
  "cloexec": {
    title: "Follow a descriptor across exec",
    nodes: [
      ["Before exec", "Descriptor is open"],
      ["exec()", "Replaces program in the same process"],
      ["After exec", "FD_CLOEXEC decides whether it survives"]
    ],
    caption: "Close-on-exec is a flag on a descriptor. Duplicates may have different flag values."
  },
  "file-apis-capstone": {
    title: "Observe the file and its shared offset",
    nodes: [
      ["Write and inspect", "fstat gives file size"],
      ["Seek and duplicate", "Both descriptors see one offset"],
      ["Read through duplicate", "Original offset also advances"]
    ],
    caption: "File size describes the stored bytes. The offset records where the next sequential read will start."
  },
  "pipe-read": {
    title: "Read past the final queued byte",
    nodes: [
      ["Write end", "Adds go to the pipe"],
      ["Close writer", "No more bytes can arrive"],
      ["Reader", "Reads go, then receives EOF"]
    ],
    caption: "The reader drains queued bytes first. EOF follows when no write end is still open."
  },
  "pipeline": {
    title: "Connect one process’s output to another’s input",
    nodes: [
      ["Producer", "dup2 makes stdout the pipe write end"],
      ["Pipe", "Carries bytes between descriptors"],
      ["Consumer", "dup2 makes stdin the pipe read end"]
    ],
    caption: "The parent closes its copies so the consumer can reach EOF after the producer exits."
  },
  "signals": {
    title: "Block, queue and collect one signal",
    nodes: [
      ["Parent", "Blocks SIGUSR1"],
      ["Child", "Sends SIGUSR1, which becomes pending"],
      ["Parent", "sigwaitinfo consumes it"]
    ],
    caption: "The parent can wait after the signal arrived because the blocked signal can remain pending."
  },
  "jobs": {
    title: "Stop and resume a foreground process group",
    nodes: [
      ["Assign terminal", "tcsetpgrp selects the job"],
      ["Send suspend byte", "Terminal delivers SIGTSTP"],
      ["Observe and resume", "waitpid sees stop, SIGCONT resumes"]
    ],
    caption: "The terminal targets its foreground process group. A stopped child has a state change before it exits."
  },
  "mapping": {
    title: "Compare shared and private pages after fork",
    nodes: [
      ["Before fork", "Both mappings have initial values"],
      ["Child writes", "Shared page or private copy"],
      ["Parent after wait", "Compares its two mappings"]
    ],
    caption: "MAP_SHARED exposes updates through both mappings. MAP_PRIVATE gives a writer its own changed page."
  },
  "filemap": {
    title: "Compare the mapping with the backing file",
    nodes: [
      ["Map file", "mmap returns a view"],
      ["Write one byte", "Shared update or private copy"],
      ["pread()", "Reads the file’s byte"]
    ],
    caption: "MAP_PRIVATE changes the mapped view while pread still sees the original file."
  },
  "thread-start": {
    title: "Start one worker and wait for it",
    nodes: [
      ["Main", "Passes a pointer to pthread_create"],
      ["Worker", "Uses the pointer and returns"],
      ["Join", "Main continues after worker finishes"]
    ],
    caption: "The pointed-to data must stay live while the worker uses it."
  },
  "threads": {
    title: "Coordinate a shared queue",
    nodes: [
      ["Consumer", "Checks the predicate under the mutex"],
      ["Wait", "Releases mutex while sleeping"],
      ["Producer", "Updates queue and signals"]
    ],
    caption: "The consumer reacquires the mutex and checks again. A wakeup is a reason to recheck the predicate."
  },
  "atomics": {
    title: "Publish a result through an atomic flag",
    nodes: [
      ["Worker", "Writes checksum"],
      ["Release store", "Sets ready"],
      ["Acquire load", "Observes ready, then reads checksum"]
    ],
    caption: "The release and acquire pair orders the data publication. The atomic count serves a separate purpose."
  },
  "memory-capstone": {
    title: "Watch a worker modify a mapped byte",
    nodes: [
      ["Main", "Maps one backing byte B"],
      ["Worker", "Writes W and finishes"],
      ["After join", "Compare the mapping with the file"]
    ],
    caption: "The join establishes completion. The mapping mode controls whether the write reaches the file view."
  },
  "mqueue": {
    title: "Observe priority in the receive order",
    nodes: [
      ["Sender", "Enqueues messages with priorities"],
      ["Kernel queue", "Chooses highest priority first"],
      ["Receiver", "Gets one message and its priority"]
    ],
    caption: "Priority can change delivery order. Within a priority, messages are received in queue order."
  },
  "replace": {
    title: "Replace a name while a reader holds the old file",
    nodes: [
      ["Old fd", "References old contents"],
      ["renameat()", "Publishes staged file at the name"],
      ["New open", "Reaches replacement contents"]
    ],
    caption: "The directory entry changes atomically. The old open descriptor still refers to the old file."
  },
  "inotify": {
    title: "Observe which filesystem names changed",
    nodes: [
      ["Watch", "Select IN_CREATE and IN_MOVED_TO"],
      ["Directory operation", "Creates staged, renames it"],
      ["read()", "Returns typed records with names"]
    ],
    caption: "One read can return several records. Advance by each fixed header and its reported name length."
  },
  "events": {
    title: "Convert a counter into readiness",
    nodes: [
      ["write()", "Adds a 64-bit counter increment"],
      ["poll()", "Reports counter readable"],
      ["read()", "Takes the accumulated count"]
    ],
    caption: "A normal eventfd read resets the counter. Another immediate poll can confirm it was consumed."
  },
  "fd-events": {
    title: "Wait for a signal and a timer together",
    nodes: [
      ["Sources", "signalfd and timerfd"],
      ["epoll_wait()", "Returns a ready descriptor"],
      ["read()", "Decode its source-specific data"]
    ],
    caption: "Readiness does not identify the record format. Use the registered descriptor to decide what to read."
  },
  "events-capstone": {
    title: "Watch an atomic name change in an event loop",
    nodes: [
      ["Publish", "renameat moves staged to current"],
      ["Wake", "epoll signals inotify is readable"],
      ["Inspect", "IN_MOVED_TO names current"]
    ],
    caption: "epoll delivers readiness on the event stream. The inotify record confirms the publication."
  },
  "limits": {
    title: "Observe a per-process descriptor limit",
    nodes: [
      ["Set limit", "RLIMIT_NOFILE bounds descriptor numbers"],
      ["Open repeatedly", "Consume slots"],
      ["Failure", "open returns -1 with EMFILE"]
    ],
    caption: "Existing descriptors count towards the limit. The process may have fewer new slots than the numeric limit."
  },
  "trace": {
    title: "Match a program error to a syscall",
    nodes: [
      ["Program", "Calls write on descriptor -1"],
      ["Kernel", "Returns -1 with EBADF"],
      ["strace", "Shows the arguments and result"]
    ],
    caption: "The program’s later diagnostic is a separate successful write. Use arguments to identify the failing call."
  },
  "diagnostics-capstone": {
    title: "Confirm descriptor exhaustion in the trace",
    nodes: [
      ["Program", "Sets a limit and opens /dev/null repeatedly"],
      ["strace", "Captures open and openat"],
      ["Last failed open", "EMFILE supports the diagnosis"]
    ],
    caption: "Lowering the process limit reduces the count of successful opens. The failure remains EMFILE."
  },
  "supervise": {
    title: "Follow a response or a deadline",
    nodes: [
      ["Worker", "Can write to its result pipe"],
      ["Supervisor", "Polls for readable bytes"],
      ["Finish", "Read result or signal, then reap"]
    ],
    caption: "A timeout and a child exit tell you different things. The parent still collects the child’s status."
  },
  "pidfd": {
    title: "Watch a worker by process descriptor",
    nodes: [
      ["Start worker", "Open pidfd and timerfd"],
      ["First deadline", "Send SIGTERM"],
      ["Second deadline", "Escalate if needed, then reap"]
    ],
    caption: "The pidfd can become readable as soon as the worker exits. The timer describes the supervisor’s deadline."
  },
};
