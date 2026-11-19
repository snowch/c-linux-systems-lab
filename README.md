# C Linux Systems Lab

Copyright © 2026 Christopher Snow.

[Open the course](https://snowch.github.io/c-linux-systems-lab/). Know basic C. Start with one call to open a file, then learn return values, errno, file I/O and metadata. Later lessons apply those contracts to processes, concurrency, event loops and supervision.

Each lesson introduces the relevant calls in short excerpts, then runs the example and asks you to make one change in its standalone C program. Use **Show me where to edit** to open the program at the change. If you saved work against an earlier shared file, open **Edit the lesson program** and use **Choose source** to open that draft. **Run in Linux** sends the selected source to an Alpine Linux guest running in WebAssembly. The guest compiles new or changed source with GCC. The draft status reports whether the browser saved an edit. Use **Download source** if saving fails. Open **Linux shell and reset** for the shell or a fresh guest. Resetting Linux keeps editor changes.

Choose **Download for offline use** before disconnecting. Save roughly 145 MB of free browser storage for this course. Open the same URL in the same browser profile after the page reports **Available offline**. The lesson files, editor, compiler, kernel and runtime are included. External documentation requires an internet connection. HTTPS or localhost and a browser with WebAssembly and service workers are required.

Capstone sections link back to the smaller exercises and open the complete runnable example.

## Lessons

Each teaching section ends with a capstone that combines its skills. Each lesson opens with a concept diagram.

### Linux API essentials

- [Open and close a file](https://snowch.github.io/c-linux-systems-lab/#open-file)
- [Check a Linux API call and read errno](https://snowch.github.io/c-linux-systems-lab/#api-errors)
- [Write, rewind and read a file](https://snowch.github.io/c-linux-systems-lab/#api-bytes)
- [Inspect a file through its descriptor](https://snowch.github.io/c-linux-systems-lab/#api-metadata)
- [Trace a shared file offset](https://snowch.github.io/c-linux-systems-lab/#descriptors)
- [Control which descriptors survive exec](https://snowch.github.io/c-linux-systems-lab/#cloexec)
- [Follow one file through two descriptors](https://snowch.github.io/c-linux-systems-lab/#file-apis-capstone) · Section capstone
- [Read from a pipe and observe EOF](https://snowch.github.io/c-linux-systems-lab/#pipe-read)

### Processes and terminal control

- [Connect two processes with a pipe](https://snowch.github.io/c-linux-systems-lab/#pipeline)
- [Synchronise a parent with a signal](https://snowch.github.io/c-linux-systems-lab/#signals)
- [Stop and resume a foreground job](https://snowch.github.io/c-linux-systems-lab/#jobs) · Section capstone

### Memory and concurrency

- [Compare shared and private memory](https://snowch.github.io/c-linux-systems-lab/#mapping)
- [Map bytes backed by an open file](https://snowch.github.io/c-linux-systems-lab/#filemap)
- [Start and join one thread](https://snowch.github.io/c-linux-systems-lab/#thread-start)
- [Coordinate a producer and a consumer](https://snowch.github.io/c-linux-systems-lab/#threads)
- [Share a counter and publish a result](https://snowch.github.io/c-linux-systems-lab/#atomics)
- [Write a file mapping from a worker](https://snowch.github.io/c-linux-systems-lab/#memory-capstone) · Section capstone

### Files and event loops

- [Receive messages in priority order](https://snowch.github.io/c-linux-systems-lab/#mqueue)
- [Replace a file while readers hold it open](https://snowch.github.io/c-linux-systems-lab/#replace)
- [Observe a directory while publishing a file](https://snowch.github.io/c-linux-systems-lab/#inotify)
- [Observe eventfd readiness](https://snowch.github.io/c-linux-systems-lab/#events)
- [Handle timers and signals in one event loop](https://snowch.github.io/c-linux-systems-lab/#fd-events)
- [Observe publication through an event loop](https://snowch.github.io/c-linux-systems-lab/#events-capstone) · Section capstone

### Diagnostics and resource limits

- [Diagnose descriptor exhaustion](https://snowch.github.io/c-linux-systems-lab/#limits)
- [Trace an API call at the kernel boundary](https://snowch.github.io/c-linux-systems-lab/#trace)
- [Trace a process that runs out of descriptors](https://snowch.github.io/c-linux-systems-lab/#diagnostics-capstone) · Section capstone

### Capstones

- [Supervise a worker with a deadline](https://snowch.github.io/c-linux-systems-lab/#supervise)
- [Escalate a worker shutdown with a process descriptor](https://snowch.github.io/c-linux-systems-lab/#pidfd)

## Scope

The course runs the Linux interfaces through a real kernel in the guest. The guest uses RAM-backed storage. Measurements and filesystem sync exercises describe observable Linux behaviour without testing physical disks or representing native hardware performance.

## Develop

Use Node.js 22 or later. Run `npm run check` to build and validate the course. Run `npm run dev` to serve it at http://localhost:4173. GitHub Actions publishes `dist/` to Pages. Original source is in `examples/`, chapter content in `content/course.mjs`, and guest build notes in [runtime/README.md](runtime/README.md).

This course uses the chapter structure, typography and build conventions of [GPU Lab](https://github.com/snowch/gpu-lab).
