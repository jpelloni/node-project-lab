# Lesson 7 — Processes, Child Processes, and Worker Threads

## Purpose

Understand how Node.js applications relate to operating-system processes and threads, and how to choose between asynchronous I/O, Worker Threads, child processes, and background processing based on the type of work being performed.

> 📖 **Learning Journal**
>
> See the exercises, reflections, and code reviews for this lesson:
>
> → [Lesson 7 Journal](../../journal/semester-1/lesson-7.md)

---

## Core Concepts

* The operating system creates and manages processes.
* A Node.js application normally runs as a single operating-system process.
* JavaScript execution within that process primarily occurs on one main thread.
* Asynchronous I/O does not require creating a new JavaScript thread.
* Worker Threads provide additional JavaScript execution threads within the same process.
* Child processes are separate operating-system processes with their own memory spaces.
* Background queues separate work from the lifecycle of an individual request or application process.
* The correct execution model depends on whether work is I/O-bound, CPU-bound, isolated, or asynchronous business work.

---

## Mental Model

Start with the Node process:

```text
Operating System
       │
       ▼
┌──────────────────────────────┐
│         Node Process         │
│                              │
│   ┌──────────────────────┐   │
│   │ Main JavaScript      │   │
│   │ Thread / Event Loop  │   │
│   └──────────────────────┘   │
│                              │
│   ┌────────┐  ┌────────┐     │
│   │Worker 1│  │Worker 2│ ... │
│   └────────┘  └────────┘     │
└──────────────────────────────┘

        Separate Process
              │
              ▼
       ┌──────────────┐
       │ Child Process│
       └──────────────┘
```

The main Event Loop should remain available to coordinate requests and asynchronous work.

Additional execution mechanisms should be introduced only when the workload requires them.

---

## Quick Reference

| Workload                             | Preferred Tool                   |
| ------------------------------------ | -------------------------------- |
| Network request                      | Async I/O                        |
| Database query                       | Async I/O                        |
| File streaming                       | Async I/O / Streams              |
| Heavy image processing               | Worker Thread or external worker |
| Large CPU calculation                | Worker Thread                    |
| Run another executable               | Child Process                    |
| Shell command                        | Child Process                    |
| Work that should outlive the request | Background Queue                 |
| Independently scalable workload      | Separate service / worker        |

### Decision Model

```text
What kind of work is this?
          │
          ├── Waiting on I/O?
          │       └── Async I/O
          │
          ├── Heavy CPU work?
          │       └── Worker Thread
          │
          ├── External executable?
          │       └── Child Process
          │
          └── Should happen independently?
                  └── Background Queue
```

---

## Processes

A process is an operating-system-managed execution environment.

Node exposes information about the current process through the global `process` object.

```javascript
console.log("Process ID:", process.pid);
console.log("Parent Process ID:", process.ppid);
console.log("Node version:", process.version);
console.log("Platform:", process.platform);
console.log("Architecture:", process.arch);
console.log("Working directory:", process.cwd());
console.log("Executable:", process.execPath);
console.log("Memory:", process.memoryUsage());
```

Processes have their own:

* memory space,
* environment variables,
* resources,
* lifecycle,
* process ID.

This isolation makes processes relatively expensive but also provides strong failure boundaries.

---

## Worker Threads

Worker Threads allow JavaScript to execute in parallel within the same Node process.

```javascript
const { Worker } = require("node:worker_threads");

const worker = new Worker("./worker.js");
```

They are most useful for **CPU-intensive JavaScript**.

Examples:

* image manipulation,
* cryptographic calculations,
* compression,
* parsing large CPU-heavy datasets,
* mathematical computation.

Worker Threads should generally **not** be introduced simply because an operation takes a long time.

The important question is:

> Is JavaScript actively consuming CPU, or is it waiting for I/O?

A large file read, for example, may take time but is primarily I/O-bound. Streaming or asynchronous file APIs are usually more appropriate than a Worker Thread.

---

## Child Processes

A child process creates a separate operating-system process.

```javascript
const { spawn } = require("node:child_process");

const child = spawn("node", ["worker.js"]);
```

Child processes are useful when:

* running external programs,
* executing shell commands,
* requiring stronger isolation,
* using software written in another language,
* separating failure domains.

Because each process has its own memory space, communication requires inter-process communication rather than ordinary shared JavaScript objects.

---

## Worker Threads vs. Child Processes

```text
Worker Thread
┌────────────────────────────┐
│ Same Process               │
│ Shared process resources   │
│ Lower isolation            │
│ Parallel JavaScript        │
└────────────────────────────┘

Child Process
┌────────────────────────────┐
│ Separate Process           │
│ Separate memory            │
│ Stronger isolation         │
│ Higher startup overhead    │
└────────────────────────────┘
```

Use the simplest mechanism that satisfies the workload's requirements.

---

## Background Queues

Some work should not belong to the request lifecycle at all.

Consider:

```text
POST /images
      │
      ▼
Accept Upload
      │
      ▼
Store Original
      │
      ▼
Publish Thumbnail Job
      │
      ▼
Return Response
```

Then:

```text
Queue
  │
  ▼
Background Worker
  │
  ▼
Generate Thumbnails
```

This provides:

* request isolation,
* retry capability,
* workload buffering,
* independent scaling,
* failure recovery.

A queue solves a different problem from a Worker Thread.

Worker Threads answer:

> Where should CPU-intensive work execute?

Queues answer:

> When and independently of what should this work execute?

The two can be combined.

---

## Example: Image Processing Service

Suppose an API:

1. accepts an image upload,
2. stores the image,
3. generates five thumbnails,
4. returns quickly to the client.

A reasonable architecture is:

```text
HTTP Request
     │
     ▼
Main Event Loop
     │
     ├── Stream image to storage
     │
     ├── Publish thumbnail job
     │
     ▼
HTTP Response

             Queue
               │
               ▼
        Background Worker
               │
               ▼
         Worker Thread
               │
               ▼
       Resize thumbnails
```

The important distinction is responsibility:

* **Event Loop** coordinates request handling.
* **Async I/O / streams** handle upload and storage.
* **Queue** separates thumbnail generation from the request lifecycle.
* **Worker Thread** may perform CPU-intensive image transformation.

---

## Key APIs

### Process information

```javascript
process.pid;
process.ppid;
process.memoryUsage();
process.cwd();
```

### Worker Threads

```javascript
const { Worker } = require("node:worker_threads");
```

### Child Processes

```javascript
const {
    spawn,
    exec,
    execFile,
    fork
} = require("node:child_process");
```

---

## Best Practices

* Keep CPU-intensive work off the main Event Loop.
* Prefer asynchronous I/O for I/O-bound operations.
* Use Worker Threads for substantial CPU-bound JavaScript workloads.
* Use child processes when executing external programs or requiring process isolation.
* Use queues when work should be decoupled from request processing.
* Stream large files instead of moving them to Worker Threads simply because they are large.
* Measure before introducing additional concurrency infrastructure.

---

## Common Mistakes

❌ Creating Worker Threads for ordinary asynchronous I/O.

❌ Assuming a slow operation is automatically CPU-bound.

❌ Treating processes and threads as equivalent.

❌ Performing CPU-intensive work directly on the main Event Loop.

❌ Using child processes when ordinary asynchronous APIs are sufficient.

❌ Assuming Worker Threads and queues solve the same problem.

❌ Introducing parallelism before measuring whether it is needed.

---

## Engineering Takeaways

* Match the execution model to the workload.
* Waiting and computing are fundamentally different resource problems.
* Isolation has a cost but can provide valuable failure boundaries.
* Decoupling work from request processing can improve reliability and scalability.
* Concurrency architecture should follow evidence rather than intuition.
* A component should perform work appropriate to its responsibility.

---

## Interview Questions

**What is the difference between a process and a thread?**

A process has its own isolated memory and operating-system resources. Threads execute within a process and share that process's resources.

---

**When should you use Worker Threads in Node?**

For CPU-intensive JavaScript workloads that would otherwise block the main Event Loop long enough to affect application responsiveness.

---

**Would you use a Worker Thread to read a very large file?**

Usually not. File reading is primarily I/O-bound. Asynchronous file APIs or streams are generally more appropriate.

---

**When would you use a child process instead of a Worker Thread?**

When executing another program, requiring stronger process isolation, or running work that should exist in a separate operating-system process.

---

**Why doesn't Node create a new process for every HTTP request?**

Processes are comparatively expensive to create and maintain. Node instead uses asynchronous I/O and the Event Loop to coordinate many concurrent requests efficiently within a small number of processes.

---

**What is the difference between a queue and a Worker Thread?**

A queue decouples when and where work is processed from the request that created it. A Worker Thread provides parallel JavaScript execution within a Node process.

---

## Related Lessons

* [Lesson 1 — Understanding the Node Runtime](./lesson-01-node-runtime.md)
* [Lesson 4 — The Event Loop, Concurrency, and Asynchronous I/O](./lesson-04-event-loop.md)
* [Lesson 6 — Streams, Buffers, and Backpressure](./lesson-06-streams.md)
* [Lesson 11 — Performance, Profiling, and Memory](./lesson-11-performance.md)
* [Lesson 15 — Production Readiness](./lesson-15-production-readiness.md)

---

## Remember

> Waiting on I/O → async APIs. Burning CPU → consider Worker Threads. Running another executable → child process. Decoupled work → queue.

---

## Jason's Notes

The major correction from this lesson was realizing that processes and threads are not interchangeable concepts.

Another important refinement was learning to classify work before deciding where it should execute. My initial instinct for the image-processing challenge was to put the upload into a Worker Thread and thumbnail generation into a child process. Breaking the workflow down by workload changed that:

* uploading and storing the image are I/O-bound,
* thumbnail generation is CPU-bound,
* returning the response belongs to the request lifecycle,
* and asynchronous thumbnail processing belongs behind a queue.

The important question is no longer simply, "How expensive is this operation?"

It is:

> "What resource is this operation actually waiting on or consuming?"
