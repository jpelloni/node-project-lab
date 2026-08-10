# Lesson 1 — Understanding the Node Runtime

## Purpose

Understand what Node.js actually is, how it differs from JavaScript, and why the runtime exists. This lesson establishes the foundation for everything that follows by explaining the relationship between V8, Node.js, libuv, and the operating system.

> 📖 **Learning Journal**
>
> Interested in the exercises, reflections, and code reviews that produced this reference?
>
> → [Lesson 1 Journal](../../../journal/semester-1/lesson-1.md)

## Core Concepts

- Node.js is a JavaScript runtime, not a programming language.
- V8 executes JavaScript but does not provide operating system functionality.
- Node extends V8 with APIs such as `fs`, `http`, `process`, and `Buffer`.
- libuv provides a cross-platform interface for asynchronous I/O.
- The current working directory (`process.cwd()`) is determined by where Node is started, not where the script is located.

## Mental Model

Think of Node.js as three major layers:

```
Your Application
        │
        ▼
Node.js Runtime
(V8 + Node APIs + libuv)
        │
        ▼
Operating System
```

- **V8** executes JavaScript.
- **Node** provides runtime APIs.
- **libuv** communicates with the operating system.
- The operating system performs the actual work.

## Quick Reference

```
JavaScript
    │
    ▼
V8 Engine
    │
    ▼
Node Runtime
(Node APIs + libuv)
    │
    ▼
Operating System
```

| Component | Responsibility |
|-----------|----------------|
| JavaScript | Language |
| V8 | Execute JavaScript |
| Node.js | Runtime APIs |
| libuv | Async I/O and Event Loop |
| Operating System | Performs the actual work |

## Key APIs / Commands

### Determine the current working directory

```javascript
process.cwd();
```

### Determine the script location

```javascript
__dirname;
```

### Runtime information

```javascript
process.version;
process.platform;
process.arch;
```

### Run a Node program

```bash
node src/index.js
```

## Best Practices

- Understand the distinction between JavaScript and the Node runtime.
- Prefer platform APIs before adding third-party packages.
- Be aware of the difference between the current working directory and a file's directory.
- Learn how the runtime interacts with the operating system before building abstractions.

## Common Mistakes

❌ Assuming JavaScript can access files by itself.

❌ Confusing `process.cwd()` with `__dirname`.

❌ Assuming Node executes operating system calls directly without libuv.

❌ Treating Node as "just JavaScript."

## Engineering Takeaways

- Every platform exists to solve problems that the language alone cannot.
- Learn the platform before depending on abstractions.
- Responsibility boundaries make debugging easier.
- Understanding system layers improves architectural decisions.
- Knowing where responsibility changes—from your code, to Node, to the operating system—makes production issues easier to investigate.

## Interview Questions

**What is Node.js?**

A JavaScript runtime built on Google's V8 engine that provides APIs and a runtime environment for building server-side applications.

**Why can't V8 read files by itself?**

Because V8 is a JavaScript engine. File system access is provided by the Node runtime through operating system APIs.

**What is libuv responsible for?**

Providing a cross-platform abstraction for asynchronous I/O, networking, timers, and the Event Loop.

**What is the difference between `process.cwd()` and `__dirname`?**

`process.cwd()` returns the directory where Node was started.

`__dirname` returns the directory containing the current module.

## Related Lessons

- [Lesson 4 — The Event Loop](./lesson-04-event-loop.md)
- [Lesson 6 — Streams and Buffers](./lesson-06-streams.md)
- [Lesson 7 — Processes and Worker Threads](./lesson-07-processes.md)

## Jason's Notes

One of the biggest insights from this lesson was realizing why running the same script from different directories changes the result of `process.cwd()`. That distinction clarified the difference between the process environment and the module location, and reinforced that Node's behavior often depends on how the runtime is launched rather than where the code lives.