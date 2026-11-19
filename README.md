# C Linux Systems Lab

Copyright © 2026 Christopher Snow.

[Open the course](https://snowch.github.io/c-linux-systems-lab/). Linux file descriptors, processes, signals, memory, threads and supervision. Know basic C and how to read a shell command.

Each lesson includes editable C source, a runnable experiment, a code change, a hint and a transfer question. **Run in Linux** compiles the source with GCC and executes it in a self-hosted Alpine Linux guest using WebAssembly. The browser saves source changes per lesson. Reset Linux starts a fresh guest and keeps the editor changes.

Choose **Download for offline use** before disconnecting. Save roughly 130 MB of free browser storage for this course. Open the same URL in the same browser profile after the page reports **Available offline**. The lesson files, editor, compiler, kernel and runtime are included. External documentation requires an internet connection. HTTPS or localhost and a browser with WebAssembly and service workers are required.

## Lessons

- [Trace a shared file offset](https://snowch.github.io/c-linux-systems-lab/#descriptors)
- [Connect two processes with a pipe](https://snowch.github.io/c-linux-systems-lab/#pipeline)
- [Synchronise a parent with a signal](https://snowch.github.io/c-linux-systems-lab/#signals)
- [Compare shared and private memory](https://snowch.github.io/c-linux-systems-lab/#mapping)
- [Coordinate a producer and a consumer](https://snowch.github.io/c-linux-systems-lab/#threads)
- [Replace a file while readers hold it open](https://snowch.github.io/c-linux-systems-lab/#replace)
- [Observe eventfd readiness](https://snowch.github.io/c-linux-systems-lab/#events)
- [Supervise a worker with a deadline](https://snowch.github.io/c-linux-systems-lab/#supervise)

## Develop

Use Node.js 22 or later. Run `npm run check` to build and validate the course. Run `npm run dev` to serve it at http://localhost:4173. GitHub Actions publishes `dist/` to Pages. Original source is in `examples/`, chapter content in `content/course.mjs`, and guest build notes in [runtime/README.md](runtime/README.md).

This course uses the chapter structure, typography and build conventions of [GPU Lab](https://github.com/snowch/gpu-lab).
