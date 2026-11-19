# Course review

The Sites design guidance and the streaming lab’s UX and learning-design guides informed the workbench. The chapter sequence asks a Linux question, exposes the relevant editable C, shows actual guest output, suggests a small change and asks a separate transfer question. Each lesson links to a primary Linux reference.

The lesson picker, previous and next navigation, and browser drafts were checked on the published single-column workbench. Width checks included 1280, 768, 390 and 320 pixels. `npm run check` validates 28 lessons, source focus locations and the offline inventory. All 24 lesson programs ran successfully in the packaged Alpine guest with external networking disabled.

The course uses a real Alpine x86 guest. The two-process pipeline is an executable program, and the guest's timings depend on the host, browser and emulator. Offline use requires saving the course in that browser profile before disconnecting.

## Learner wording and guided workbench follow-up

The opening review used the basic C prerequisite and published revision `28021de`. Revision `963263a` added standalone source files and two shorter introductions during the review. The review was repeated against that revision and all 24 lesson routes. It covered the overview, first example, walkthrough excerpts, offline API notes, editor jump, and earlier-draft chooser. The closing review used the same pages to check what the site prepares, what the learner edits, the output they compare, the scope of the example and the placement of controls.

The walkthroughs mark their excerpts as read-only and identify the standalone program for changes. Each lesson names the source change and evidence to compare. The two short introductions name the exact printed lines and are linked from the larger pipe and thread examples. The pending-signal edit collects the child’s exit status before waiting for the signal, so it establishes the order through the program. The strace example prints program output and the trace under separate labels. The displayed file-mapping results describe visibility in a RAM-backed guest. Timer accuracy and power-loss recovery require separate measurements.

The controls keep the streamed guest startup, its cancel action, and the jump to the relevant source. The console keeps output with its lesson and identifies the run and source. When the current source differs from the previous completed run, the earlier output opens for comparison. Startup, build errors, program exits and interruption have distinct status messages. Essential instructions and explanations remain visible. Hints, API notes, the shell and guest reset are available through labelled controls.

Drafts keep their original per-lesson browser keys. Earlier saved work opens from a source chooser and runs using the original exercise commands. Output and drafts follow the selected source. A saved draft is identified before running, and unsuccessful storage operations say which copy is usable. The tab copy can be downloaded. Guest compilation checks the source and its helper header against the last compiled copies. It invalidates the previous source record before replacing the executable, so an interrupted replacement triggers compilation next time.

The 5 section capstones completed in the packaged Alpine guest with networking disabled. Build checks verify that each capstone closes its section and links only to earlier lessons in that section. All 28 concept diagrams were checked at desktop and narrow mobile widths.
