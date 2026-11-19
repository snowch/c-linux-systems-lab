export const course = {
  "slug": "c-linux-systems-lab",
  "title": "C Linux Systems Lab",
  "overview": {
    "description": "Learn how C programs use Linux. Open a file in a small standalone program, then work through errors, file I/O, processes, memory, threads, event loops and worker supervision.",
    "prerequisites": "Know basic C, including functions, pointers and arrays. The page prepares a separate Linux guest and the files each lesson needs. The guest can run all examples without external networking."
  },
  "summary": "Start with the Linux C API, then investigate processes, files, memory, concurrency and event-driven supervision.",
  "instructions": "On your first visit, select Run in Linux with the starter source unchanged. The page starts Linux if needed, prepares the files and compiles new or changed source with GCC.",
  "files": {
    "thread-start.c": "./examples/thread-start.c",
    "pipe-read.c": "./examples/pipe-read.c",
    "systems.c": "./examples/systems.c",
    "io-basics.c": "./examples/io-basics.c",
    "linux-tools.c": "./examples/linux-tools.c",
    "open-file.c": "./examples/open-file.c"
  },
  "prepare": "if [ ! -x /tmp/sys ] || ! cmp -s /tmp/lesson-input/systems.c /tmp/sys.source; then\n    echo 'Compiling systems.c in Linux'\n    gcc -std=c11 -Wall -Wextra -Werror -pthread /tmp/lesson-input/systems.c -o /tmp/sys.next\n    cp /tmp/lesson-input/systems.c /tmp/sys.source.next\n    rm -f /tmp/sys.source\n    mv /tmp/sys.next /tmp/sys\n    mv /tmp/sys.source.next /tmp/sys.source\nfi",
  "lessons": [
    {
      "id": "open-file",
      "section": "Linux API essentials",
      "title": "Open a file and get a descriptor",
      "intro": "Start with one system call and one value to read from its output.",
      "question": "What does open() give the program when it succeeds?",
      "task": "In main(), change the path string from \"/dev/null\" to \"/dev/zero\". Select Run in Linux again. Compare the path and descriptor on the two “opened” lines. Which field identifies what the program opened?",
      "hint": "Both paths name readable devices in this guest. The kernel assigns the descriptor number when each program opens its device.",
      "explanation": "Each successful run prints the path passed to open() and a nonnegative descriptor. The program uses that number in close(). It may receive the same number in both runs because each run has its own process.",
      "transfer": "Why does the program check the result of open() before passing it to close()?",
      "file": "open-file.c",
      "focus": "int fd = open(path, O_RDONLY);",
      "command": "/tmp/open-file",
      "prepare": "if [ ! -x /tmp/open-file ] || ! cmp -s /tmp/lesson-input/open-file.c /tmp/open-file.source; then\n    echo 'Compiling open-file.c in Linux'\n    gcc -std=c11 -Wall -Wextra -Werror /tmp/lesson-input/open-file.c -o /tmp/open-file.next\n    cp /tmp/lesson-input/open-file.c /tmp/open-file.source.next\n    rm -f /tmp/open-file.source\n    mv /tmp/open-file.next /tmp/open-file\n    mv /tmp/open-file.source.next /tmp/open-file.source\nfi"
    },
    {
      "id": "api-errors",
      "section": "Linux API essentials",
      "title": "Check a Linux API call and read errno",
      "file": "io-basics.c",
      "focus": "static void inspect_error",
      "intro": "C programs call the Linux API through library functions such as open() and read(). These calls return a result. When they return -1, errno identifies the failure. Know basic C to begin.",
      "question": "Can open() succeed while a later read() of that same descriptor fails?",
      "task": "In inspect_error(), change flags = O_WRONLY to flags = O_RDONLY. Select Run in Linux again. Compare both return lines with the starter. Did open() still succeed, and does read() now report bytes or an error?",
      "hint": "O_WRONLY opens the file for writing. O_RDONLY opens it for reading. /dev/null accepts either mode.",
      "explanation": "Both open() calls return a descriptor. With write-only access, read() reports EBADF. With read-only access, /dev/null returns zero bytes. This program prints the message for errno only when the call reports an error.",
      "transfer": "In inspect_error(), set path to \"/tmp/this-file-does-not-exist\" and run again. Which call fails this time, and what message does it print for its error code?",
      "prepare": "if [ ! -x /tmp/linux-api ] || ! cmp -s /tmp/lesson-input/io-basics.c /tmp/linux-api.source; then\n    echo 'Compiling io-basics.c in Linux'\n    gcc -std=c11 -Wall -Wextra -Werror  /tmp/lesson-input/io-basics.c -o /tmp/linux-api.next\n    cp /tmp/lesson-input/io-basics.c /tmp/linux-api.source.next\n    rm -f /tmp/linux-api.source\n    mv /tmp/linux-api.next /tmp/linux-api\n    mv /tmp/linux-api.source.next /tmp/linux-api.source\nfi",
      "command": "/tmp/linux-api errors"
    },
    {
      "id": "api-bytes",
      "section": "Linux API essentials",
      "title": "Write, rewind and read a file",
      "file": "io-basics.c",
      "focus": "static void copy_bytes",
      "intro": "read() and write() transfer bytes through a descriptor and return how many they moved. A file offset tracks the position. lseek() can change that position.",
      "question": "How large is the final transfer when fewer bytes are left than fit in the buffer?",
      "task": "In copy_bytes(), change “char buffer[4];” to “char buffer[6];”. Select Run in Linux again. Compare the individual “read” counts and the “EOF after” total with the starter. What did the buffer change?",
      "hint": "The size of the buffer limits how many bytes one read() can transfer.",
      "explanation": "The four-byte buffer produces transfers of 4, 4 and 3 bytes. The six-byte buffer produces 6 and 5. A smaller final count is a successful read of the bytes still available. Both runs read all 11 bytes before reaching the end.",
      "transfer": "What total would you expect if the program began reading at the offset left by write(), without rewinding?",
      "prepare": "if [ ! -x /tmp/linux-api ] || ! cmp -s /tmp/lesson-input/io-basics.c /tmp/linux-api.source; then\n    echo 'Compiling io-basics.c in Linux'\n    gcc -std=c11 -Wall -Wextra -Werror  /tmp/lesson-input/io-basics.c -o /tmp/linux-api.next\n    cp /tmp/lesson-input/io-basics.c /tmp/linux-api.source.next\n    rm -f /tmp/linux-api.source\n    mv /tmp/linux-api.next /tmp/linux-api\n    mv /tmp/linux-api.source.next /tmp/linux-api.source\nfi",
      "command": "/tmp/linux-api bytes"
    },
    {
      "id": "api-metadata",
      "section": "Linux API essentials",
      "title": "Inspect a file through its descriptor",
      "file": "io-basics.c",
      "focus": "static void describe_file",
      "intro": "openat() resolves a relative path using a directory descriptor. fstat() reports metadata about an already-open file, including its size, permissions and number of names.",
      "question": "What can fstat() still report after unlinkat() removes the file’s last name?",
      "task": "In describe_file(), change fchmod(fd, 0640) to fchmod(fd, 0600). Select Run in Linux again. Compare “mode”, “links” and “size” with the starter. Which of these responds to fchmod()?",
      "hint": "The printed mode shows permission digits in octal. A directory name and an open descriptor are separate ways to reach a file.",
      "explanation": "The mode shown changes from 640 to 600. In both runs, removing the last name makes the link count zero. fstat() still reports four bytes through the open descriptor.",
      "transfer": "If a second process already had the file open when the name was removed, could it still inspect the size through its own descriptor?",
      "prepare": "if [ ! -x /tmp/linux-api ] || ! cmp -s /tmp/lesson-input/io-basics.c /tmp/linux-api.source; then\n    echo 'Compiling io-basics.c in Linux'\n    gcc -std=c11 -Wall -Wextra -Werror  /tmp/lesson-input/io-basics.c -o /tmp/linux-api.next\n    cp /tmp/lesson-input/io-basics.c /tmp/linux-api.source.next\n    rm -f /tmp/linux-api.source\n    mv /tmp/linux-api.next /tmp/linux-api\n    mv /tmp/linux-api.source.next /tmp/linux-api.source\nfi",
      "command": "/tmp/linux-api metadata"
    },
    {
      "id": "descriptors",
      "section": "Linux API essentials",
      "title": "Trace a shared file offset",
      "intro": "A file descriptor is a process-local number. It refers to an open file description in the kernel, which stores the file position.",
      "question": "Which descriptors share the next byte position after the first read?",
      "focus": "static void descriptors",
      "task": "In descriptors(), replace dup(fd) with open(path, O_RDONLY | O_CLOEXEC). Select Run in Linux again. Compare all three characters. The printed label “duplicate” still names the second read even though you changed how that descriptor was opened.",
      "hint": "A second open() starts with its own position at the beginning of the file.",
      "explanation": "dup() shares the original description, so the second read starts at the next byte and returns e. The edited second open() starts at the first byte and returns h. The third descriptor starts at the first byte in both runs.",
      "transfer": "If a child read one byte through an inherited descriptor before exiting, what would the parent see when it reads through that same description?",
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
      "question": "Can the newly started program still use the descriptor with that flag set?",
      "task": "In close_on_exec(), change close_on_exec = 1 to close_on_exec = 0. Select Run in Linux again and compare “open” or “closed” with the starter.",
      "hint": "F_SETFD sets the descriptor flags. In the new program, F_GETFD checks whether the same slot is valid.",
      "explanation": "A successful exec closes a descriptor with FD_CLOEXEC set. The new program finds the slot open after you clear the flag.",
      "transfer": "Why might a multithreaded program set O_CLOEXEC when it opens a file instead of setting the flag in a separate call?",
      "prepare": "if [ ! -x /tmp/linux-tools ] || ! cmp -s /tmp/lesson-input/linux-tools.c /tmp/linux-tools.source; then\n    echo 'Compiling linux-tools.c in Linux'\n    gcc -std=c11 -Wall -Wextra -Werror -pthread /tmp/lesson-input/linux-tools.c -o /tmp/linux-tools.next\n    cp /tmp/lesson-input/linux-tools.c /tmp/linux-tools.source.next\n    rm -f /tmp/linux-tools.source\n    mv /tmp/linux-tools.next /tmp/linux-tools\n    mv /tmp/linux-tools.source.next /tmp/linux-tools.source\nfi",
      "command": "/tmp/linux-tools cloexec"
    },
    {
      "id": "pipe-read",
      "section": "Processes and terminal control",
      "title": "Read from a pipe and observe EOF",
      "intro": "Use one process to send bytes through a pipe and detect when there will be no more bytes.",
      "question": "What does the second read return after the pipe is empty and its write end has closed?",
      "task": "In main(), change the string assigned to text from \"go\" to \"ready\". Select Run in Linux again. Which line changes, and which read still reports zero bytes?",
      "hint": "The write uses sizeof text - 1 to send the letters without the final null byte.",
      "explanation": "The first read returns the queued bytes. It reads two bytes from the starter and five from the edited source. The second returns zero because no bytes remain and the write end is closed.",
      "transfer": "What would the second read wait for if the pipe were empty and the write end stayed open?",
      "file": "pipe-read.c",
      "focus": "int ends[2];",
      "assets": [
        "systems-support.h"
      ],
      "support": "systems-support.h",
      "command": "/tmp/lab-pipe-read"
    },
    {
      "id": "pipeline",
      "buildsOn": "pipe-read",
      "section": "Processes and terminal control",
      "title": "Connect two processes with a pipe",
      "intro": "fork() creates a child that inherits open descriptors. dup2() redirects standard input or output before exec replaces the child’s program.",
      "question": "After the text has passed through the pipe, what lets tr detect the end?",
      "focus": "static void pipeline",
      "task": "In pipeline(), comment out the parent’s “close(pipefd[1]);” just before “wait_ok(producer);”. Select Run in Linux again. Check whether “both processes exited” appears. The reader now waits for more bytes. Use Interrupt run if it is still waiting, or let the example’s 15-second alarm end the run. Undo your comment and rerun to recover the starter result.",
      "hint": "A pipe reader sees the end only after it reads the available bytes and every write end has been closed.",
      "explanation": "The producer exits and closes its write end. With the parent’s write end still open, tr cannot reach the end of the pipe. The parent waits for tr. If the alarm ends the run, “Alarm clock” and exit status 142 report that outcome. If you choose Interrupt run, the status reports the interruption.",
      "transfer": "Where could you set close-on-exec to keep an unrelated program from accidentally inheriting a copy of the pipe’s write end?",
      "command": "/tmp/sys pipeline",
      "file": "systems.c"
    },
    {
      "id": "signals",
      "section": "Processes and terminal control",
      "title": "Synchronise a parent with a signal",
      "intro": "A blocked signal can stay pending until a process explicitly waits for it. The parent blocks SIGUSR1 before creating the child.",
      "question": "Can the parent collect SIGUSR1 even when the child has already sent it and exited?",
      "focus": "static void signals",
      "task": "In signals(), move “wait_ok(child);” from below puts() to just above “int delivered = sigwaitinfo(&pending, NULL);”. Select Run in Linux again. The child now exits before the parent calls sigwaitinfo(). Does the same “parent received SIGUSR1” line appear?",
      "hint": "The child sends SIGUSR1 before it exits. The parent’s signal mask keeps that notification pending while wait_ok() collects the exit status.",
      "explanation": "sigwaitinfo() collects the pending SIGUSR1 in the edited run. Blocking before fork means the notification survives even if it arrives before the wait. The code then restores the parent’s original signal mask.",
      "transfer": "If each notification represents work that must be counted individually, what could you use to keep track of the count?",
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
      "question": "Which job receives the stop signal from that private terminal?",
      "task": "In terminal_session(), change suspend_key = 26 to suspend_key = 29. Select Run in Linux again. The program will write the new byte to its own terminal. Do both the stop and resume lines still appear?",
      "hint": "tcsetpgrp() makes the job’s group the foreground group. The example uses suspend_key both as the configured VSUSP byte and as the byte it writes.",
      "explanation": "The private terminal interprets its configured byte as a request to send SIGTSTP to its foreground group. The supervisor takes back control of the terminal, sends SIGCONT and collects the job’s exit status.",
      "transfer": "How could a shell put a suspended job back in the foreground before sending SIGCONT?",
      "prepare": "if [ ! -x /tmp/linux-tools ] || ! cmp -s /tmp/lesson-input/linux-tools.c /tmp/linux-tools.source; then\n    echo 'Compiling linux-tools.c in Linux'\n    gcc -std=c11 -Wall -Wextra -Werror -pthread /tmp/lesson-input/linux-tools.c -o /tmp/linux-tools.next\n    cp /tmp/lesson-input/linux-tools.c /tmp/linux-tools.source.next\n    rm -f /tmp/linux-tools.source\n    mv /tmp/linux-tools.next /tmp/linux-tools\n    mv /tmp/linux-tools.source.next /tmp/linux-tools.source\nfi",
      "command": "mkdir -p /dev/pts\nif ! mountpoint -q /dev/pts; then mount -t devpts devpts /dev/pts; fi\n/tmp/linux-tools jobs"
    },
    {
      "id": "mapping",
      "section": "Memory and concurrency",
      "title": "Compare shared and private memory",
      "intro": "mmap() creates a memory mapping. MAP_SHARED exposes subsequent writes through the shared mapping, while MAP_PRIVATE gives each process its own modified pages.",
      "question": "Which of the child’s writes will the parent see after it has collected the child’s exit status?",
      "focus": "static void mapping",
      "task": "In mapping(), change the child’s assignment from “*shared = *private = JOBS;” to “*shared = *private = 9;”. Select Run in Linux again. Which parent value changes, and which stays at 1?",
      "hint": "The parent prints after the child exits, so you are comparing its view after the writes.",
      "explanation": "The parent sees the shared value change from 4 to 9 when you change the child’s code. The parent’s private value remains 1 in both runs.",
      "transfer": "What would the two processes need in addition to MAP_SHARED if they both wanted to update the same counter safely?",
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
      "question": "After a write to the mapped region, which value does pread() see through the file descriptor?",
      "task": "In mapped_file(), change mapping_type = MAP_SHARED to mapping_type = MAP_PRIVATE. Select Run in Linux again. The code writes the same M. Compare the two reported byte values with the starter.",
      "hint": "The program reads “mapped byte” through memory and “file byte” through pread().",
      "explanation": "MAP_SHARED yields 77 through both reads. MAP_PRIVATE yields 77 through the mapping and 0 through the file descriptor. These results describe visibility in a guest with RAM-backed storage. Testing crash recovery would require persistent storage and a separate power-loss test.",
      "transfer": "What would a test need to establish whether a file update survives a power loss?",
      "prepare": "if [ ! -x /tmp/linux-tools ] || ! cmp -s /tmp/lesson-input/linux-tools.c /tmp/linux-tools.source; then\n    echo 'Compiling linux-tools.c in Linux'\n    gcc -std=c11 -Wall -Wextra -Werror -pthread /tmp/lesson-input/linux-tools.c -o /tmp/linux-tools.next\n    cp /tmp/lesson-input/linux-tools.c /tmp/linux-tools.source.next\n    rm -f /tmp/linux-tools.source\n    mv /tmp/linux-tools.next /tmp/linux-tools\n    mv /tmp/linux-tools.source.next /tmp/linux-tools.source\nfi",
      "command": "/tmp/linux-tools filemap"
    },
    {
      "id": "thread-start",
      "section": "Memory and concurrency",
      "title": "Start and join one thread",
      "intro": "Pass a message to one thread and wait for it to finish.",
      "question": "Which call ensures the worker has finished before main prints its last line?",
      "task": "In main(), change the string assigned to message from \"ready\" to \"hello\". Select Run in Linux again. Compare the text after “worker” and its position relative to “worker joined”.",
      "hint": "main() passes the address of message to pthread_create(). print_message() receives that address as its argument.",
      "explanation": "pthread_join() waits for the worker before main prints “worker joined”. Changing the message changes the worker’s text. The array still exists in main() when the worker reads it.",
      "transfer": "If another function owned the array and returned before the worker read it, could the worker still safely use its address?",
      "file": "thread-start.c",
      "focus": "static void *print_message",
      "assets": [
        "systems-support.h"
      ],
      "support": "systems-support.h",
      "command": "/tmp/lab-thread-start"
    },
    {
      "id": "threads",
      "buildsOn": "thread-start",
      "section": "Memory and concurrency",
      "title": "Coordinate a producer and a consumer",
      "intro": "Threads share memory. A mutex protects the queue state, and a condition variable allows a thread to sleep until the predicate it cares about might have changed.",
      "question": "What prevents the producer from writing a new value while the only queue slot is still full?",
      "focus": "static void threads",
      "task": "In the enum near the top of threads.c, change JOBS = 4 to JOBS = 6. Predict the sum. Select Run in Linux again and compare both “consumed” and “sum” with the starter.",
      "hint": "Under the mutex, the producer waits while the slot is full and the consumer waits while it is empty.",
      "explanation": "Waiting on the condition releases the mutex and takes it again before returning. Each thread rechecks its condition. The starter consumes 1 through 4 for a sum of 10. The edit consumes 1 through 6 for a sum of 21.",
      "transfer": "How could you signal shutdown so a thread waiting for a value or a free slot can still exit?",
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
      "question": "Why can the counter use relaxed atomic operations while the checksum uses the ready flag?",
      "task": "In the enum above publish() in atomics.c, change INCREMENTS = 10000 to INCREMENTS = 5000. Select Run in Linux again. Compare “combined atomic count” and “published checksum” with the starter. Which value depends on the number of loop iterations?",
      "hint": "The counter needs indivisible updates. The flag also has to publish a write to a different field.",
      "explanation": "The count goes from 20,000 to 10,000 because both threads update it. The checksum stays at 42. An acquire load that observes the release store lets the reader see the earlier checksum write.",
      "transfer": "When might using a mutex be simpler for shared data with several fields?",
      "prepare": "if [ ! -x /tmp/linux-tools ] || ! cmp -s /tmp/lesson-input/linux-tools.c /tmp/linux-tools.source; then\n    echo 'Compiling linux-tools.c in Linux'\n    gcc -std=c11 -Wall -Wextra -Werror -pthread /tmp/lesson-input/linux-tools.c -o /tmp/linux-tools.next\n    cp /tmp/lesson-input/linux-tools.c /tmp/linux-tools.source.next\n    rm -f /tmp/linux-tools.source\n    mv /tmp/linux-tools.next /tmp/linux-tools\n    mv /tmp/linux-tools.source.next /tmp/linux-tools.source\nfi",
      "command": "/tmp/linux-tools atomics"
    },
    {
      "id": "mqueue",
      "section": "Files and event loops",
      "title": "Receive messages in priority order",
      "file": "linux-tools.c",
      "focus": "static void priority_messages",
      "intro": "A POSIX message queue preserves message boundaries and assigns each message a priority. A nonblocking queue reports EAGAIN when it has no messages.",
      "question": "Does the order in which the program sends its two messages determine the order it receives them?",
      "task": "In priority_messages(), change first_priority = 1 to first_priority = 7. Select Run in Linux again. Which message is now received first? Check what the empty queue reports.",
      "hint": "The second message always has priority 5.",
      "explanation": "The queue returns the highest-priority message first, so the two messages switch order. The last read still finds the queue empty. Linux delivers older messages first if priorities tie.",
      "transfer": "What information would you put into a byte stream if a receiver needed to reconstruct separate messages and choose one by priority?",
      "prepare": "if [ ! -x /tmp/linux-tools ] || ! cmp -s /tmp/lesson-input/linux-tools.c /tmp/linux-tools.source; then\n    echo 'Compiling linux-tools.c in Linux'\n    gcc -std=c11 -Wall -Wextra -Werror -pthread /tmp/lesson-input/linux-tools.c -o /tmp/linux-tools.next\n    cp /tmp/lesson-input/linux-tools.c /tmp/linux-tools.source.next\n    rm -f /tmp/linux-tools.source\n    mv /tmp/linux-tools.next /tmp/linux-tools\n    mv /tmp/linux-tools.source.next /tmp/linux-tools.source\nfi",
      "command": "/tmp/linux-tools mqueue"
    },
    {
      "id": "replace",
      "section": "Files and event loops",
      "title": "Replace a file while readers hold it open",
      "intro": "renameat() replaces the destination directory entry. Readers that already opened the old file retain a handle to the old inode, the filesystem’s object for that file.",
      "question": "Can a reader already holding a descriptor see different bytes from a reader that opens the name after replacement?",
      "focus": "static void replace_file",
      "task": "Near the top of replace.c, change sample[] = \"hello\" to sample[] = \"ready\". Select Run in Linux again. Compare “open descriptor” and “reopened path”. Which one contains the staged bytes?",
      "hint": "The program writes sample into the staged file. It already wrote old into the file it opened before replacement.",
      "explanation": "The open descriptor still gives old, even after the name points to the staged file. The newly opened descriptor gives hello in the starter and ready after the edit. The guest demonstrates name replacement and the visibility of these reads using RAM-backed storage.",
      "transfer": "Why should the staged file be on the same filesystem as the destination when using renameat() to publish it?",
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
      "question": "Which operations can the directory watcher see during publication?",
      "task": "In watch_directory(), change “watch = IN_CREATE | IN_MOVED_TO;” to “watch = IN_MOVED_TO;”. Select Run in Linux again. Compare the event lines and identify the event that the narrower watch still reports.",
      "hint": "IN_CREATE reports the creation of the staging name. IN_MOVED_TO reports a rename’s destination entering the watched directory.",
      "explanation": "With both mask bits set, the watcher reports both operations. With only IN_MOVED_TO set, it reports ready and omits the earlier creation of staged.",
      "transfer": "What could a watcher do to recover if the event queue overflowed and some events were lost?",
      "prepare": "if [ ! -x /tmp/linux-tools ] || ! cmp -s /tmp/lesson-input/linux-tools.c /tmp/linux-tools.source; then\n    echo 'Compiling linux-tools.c in Linux'\n    gcc -std=c11 -Wall -Wextra -Werror -pthread /tmp/lesson-input/linux-tools.c -o /tmp/linux-tools.next\n    cp /tmp/lesson-input/linux-tools.c /tmp/linux-tools.source.next\n    rm -f /tmp/linux-tools.source\n    mv /tmp/linux-tools.next /tmp/linux-tools\n    mv /tmp/linux-tools.source.next /tmp/linux-tools.source\nfi",
      "command": "/tmp/linux-tools inotify"
    },
    {
      "id": "events",
      "section": "Files and event loops",
      "title": "Observe eventfd readiness",
      "intro": "eventfd represents a kernel counter as a descriptor. A producer can add to it, and an event loop can wait for it to become readable.",
      "question": "How many writes can one read account for?",
      "focus": "static void events",
      "task": "In events(), change increment = 1 to increment = 2. Select Run in Linux again. Compare “count” and the three poll results with the starter. Does the count represent the number of write calls or the values added?",
      "hint": "In the mode used here, reading the counter returns the accumulated value and resets it to zero.",
      "explanation": "The starter adds 1 four times and reads 4. The edit adds 2 four times and reads 8. The same poll results show when the counter is empty and when it is readable.",
      "transfer": "If you passed EFD_SEMAPHORE to eventfd(), what would one read return when the counter held 8?",
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
      "question": "Can one wait loop collect both notifications without running a signal handler?",
      "task": "In signals_and_timers(), change delay_ns = 50000000 to delay_ns = 1000000. Select Run in Linux again. This reduces the configured timer from 50 ms to 1 ms. Check whether both lines still appear.",
      "hint": "The ready descriptor tells the loop which kind of record to read.",
      "explanation": "In both cases the same loop reads a signal record and one timer expiration. Either descriptor can become readable first. The comparison tests event handling in this guest. Timer accuracy and hardware performance require separate measurements on the target system.",
      "transfer": "What should a loop do if it reads several accumulated expirations from a timer that repeats?",
      "prepare": "if [ ! -x /tmp/linux-tools ] || ! cmp -s /tmp/lesson-input/linux-tools.c /tmp/linux-tools.source; then\n    echo 'Compiling linux-tools.c in Linux'\n    gcc -std=c11 -Wall -Wextra -Werror -pthread /tmp/lesson-input/linux-tools.c -o /tmp/linux-tools.next\n    cp /tmp/lesson-input/linux-tools.c /tmp/linux-tools.source.next\n    rm -f /tmp/linux-tools.source\n    mv /tmp/linux-tools.next /tmp/linux-tools\n    mv /tmp/linux-tools.source.next /tmp/linux-tools.source\nfi",
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
      "task": "In descriptor_limit(), change maximum = 32 to maximum = 16. Select Run in Linux again. Compare the new open count and the final error with the starter.",
      "hint": "Standard input, output and error already occupy slots. A process can inherit other open descriptors too.",
      "explanation": "The new count drops when the limit drops. EMFILE means this process has no descriptor slot left below that limit. The program observes that expected condition on both runs.",
      "transfer": "What could you measure about a process’s open descriptors over time to tell a leak from an expected peak?",
      "prepare": "if [ ! -x /tmp/linux-tools ] || ! cmp -s /tmp/lesson-input/linux-tools.c /tmp/linux-tools.source; then\n    echo 'Compiling linux-tools.c in Linux'\n    gcc -std=c11 -Wall -Wextra -Werror -pthread /tmp/lesson-input/linux-tools.c -o /tmp/linux-tools.next\n    cp /tmp/lesson-input/linux-tools.c /tmp/linux-tools.source.next\n    rm -f /tmp/linux-tools.source\n    mv /tmp/linux-tools.next /tmp/linux-tools\n    mv /tmp/linux-tools.source.next /tmp/linux-tools.source\nfi",
      "command": "/tmp/linux-tools limits"
    },
    {
      "id": "trace",
      "section": "Diagnostics and resource limits",
      "title": "Trace an API call at the kernel boundary",
      "file": "linux-tools.c",
      "focus": "static void trace_target",
      "intro": "strace observes calls that cross from a process into the Linux kernel. A trace shows the operation, arguments, return value and an error when the call fails.",
      "question": "Which trace entry explains the program’s error message?",
      "task": "In trace_target(), change “const int fd = -1;” to “const int fd = STDOUT_FILENO;”. Select Run in Linux again. Under “Trace of write calls”, find the line that writes sample followed by a newline. What descriptor and return count does it show?",
      "hint": "The tracing command uses -e trace=write. Match the buffer and descriptor when more than one trace entry appears.",
      "explanation": "The starter’s targeted call returns −1 with EBADF. The edited call writes seven bytes to descriptor 1. The trace also contains the writes the program uses to print its own messages.",
      "transfer": "Which system calls would you look for in a trace when investigating why a program cannot open a file?",
      "assets": [
        "strace-x86"
      ],
      "prepare": "if [ ! -x /tmp/linux-tools ] || ! cmp -s /tmp/lesson-input/linux-tools.c /tmp/linux-tools.source; then\n    echo 'Compiling linux-tools.c in Linux'\n    gcc -std=c11 -Wall -Wextra -Werror -pthread /tmp/lesson-input/linux-tools.c -o /tmp/linux-tools.next\n    cp /tmp/lesson-input/linux-tools.c /tmp/linux-tools.source.next\n    rm -f /tmp/linux-tools.source\n    mv /tmp/linux-tools.next /tmp/linux-tools\n    mv /tmp/linux-tools.source.next /tmp/linux-tools.source\nfi",
      "command": "cp /tmp/lesson-input/strace-x86 /tmp/lab-strace\nchmod 700 /tmp/lab-strace\nprintf 'Program output\\n'\n/tmp/lab-strace -e trace=write -o /tmp/linux-lab-write.trace /tmp/linux-tools trace\nprintf '\\nTrace of write calls\\n'\ncat /tmp/linux-lab-write.trace"
    },
    {
      "id": "supervise",
      "section": "Capstones",
      "title": "Supervise a worker with a deadline",
      "intro": "A supervisor uses a pipe to collect a result, poll() to enforce a response deadline, and waitpid() to collect the worker’s exit status.",
      "question": "How can the supervisor distinguish a worker that replies from one that stays silent past the deadline?",
      "focus": "static void supervise",
      "task": "In supervise(), replace “for (;;)” and its “pause();” body with “usleep(20000);”. Keep the replacement under “if (stalled)”. Select Run in Linux again. Compare which path the second worker takes after its 20 ms delay.",
      "hint": "The worker can now reach the existing send_bytes() call after the delay.",
      "explanation": "If the supervisor sees no reply by the deadline, it signals the worker and collects its exit status. The edited second worker has a nominal 20 ms delay and can reply before the 100 ms deadline. Read the branch taken in the console instead of treating the timing as a benchmark.",
      "transfer": "How would you report a worker that closes the pipe without sending the word done separately from a worker that passes the deadline?",
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
      "question": "When does the supervisor escalate its first shutdown request to a second signal?",
      "task": "In supervise_pidfd(), change ignore_term = 1 to ignore_term = 0. Select Run in Linux again. Compare the sent signals and the final termination signal. Is the second deadline still needed?",
      "hint": "The first deadline sends SIGTERM and starts a grace period. The timer causes SIGKILL only if the worker has yet to exit.",
      "explanation": "With SIGTERM ignored, the second deadline sends SIGKILL. With the default SIGTERM behaviour, the worker exits after the first signal. Its pidfd becomes readable before the supervisor needs to escalate.",
      "transfer": "How could the supervisor let a worker finish its active job while rejecting new jobs before the shutdown deadline?",
      "prepare": "if [ ! -x /tmp/linux-tools ] || ! cmp -s /tmp/lesson-input/linux-tools.c /tmp/linux-tools.source; then\n    echo 'Compiling linux-tools.c in Linux'\n    gcc -std=c11 -Wall -Wextra -Werror -pthread /tmp/lesson-input/linux-tools.c -o /tmp/linux-tools.next\n    cp /tmp/lesson-input/linux-tools.c /tmp/linux-tools.source.next\n    rm -f /tmp/linux-tools.source\n    mv /tmp/linux-tools.next /tmp/linux-tools\n    mv /tmp/linux-tools.source.next /tmp/linux-tools.source\nfi",
      "command": "/tmp/linux-tools pidfd"
    }
  ]
};

// Retain the original run configuration for drafts saved against shared files.
const supportFiles = {
  'systems.c': 'systems-support.h',
  'linux-tools.c': 'process-support.h',
  'io-basics.c': null
};
function prepareStandalone(lesson) {
  const input = '/tmp/lesson-input/';
  const source = input + lesson.file;
  const executable = '/tmp/lab-' + lesson.id;
  const support = lesson.support && input + lesson.support;
  const currentSource = `cmp -s ${source} ${executable}.source`;
  const currentSupport = support && `cmp -s ${support} ${executable}.header`;
  return [
    `if [ ! -x ${executable} ] || ! ${currentSource}${currentSupport ? ' || ! ' + currentSupport : ''}; then`,
    `    echo 'Compiling ${lesson.file} in Linux'`,
    `    gcc -std=c11 -Wall -Wextra -Werror ${source} -o ${executable}.next -pthread`,
    `    cp ${source} ${executable}.source.next`,
    ...(support ? [`    cp ${support} ${executable}.header.next`] : []),
    `    rm -f ${executable}.source`,
    `    mv ${executable}.next ${executable}`,
    ...(support ? [`    mv ${executable}.header.next ${executable}.header`] : []),
    `    mv ${executable}.source.next ${executable}.source`,
    'fi'
  ].join('\n');
}
for (const lesson of course.lessons) {
  if (!Object.hasOwn(supportFiles, lesson.file)) {
    lesson.prepare ??= prepareStandalone(lesson);
    continue;
  }
  const original = lesson.file;
  const support = supportFiles[original];
  lesson.previous = {
    file: original,
    prepare: lesson.prepare ?? course.prepare,
    command: lesson.command,
    assets: lesson.assets
  };
  lesson.file = lesson.id + '.c';
  course.files[lesson.file] = './examples/' + lesson.file;
  if (support) {
    lesson.support = support;
    lesson.assets = [support, ...(lesson.assets ?? [])];
  }
  lesson.prepare = prepareStandalone(lesson);
  lesson.command = lesson.command.replace(/\/tmp\/[a-z-]+ [a-z0-9-]+(?=\n|$)/, '/tmp/lab-' + lesson.id);
  if (lesson.command === lesson.previous.command)
    throw Error('Missing lesson entry point for ' + lesson.id);
}
