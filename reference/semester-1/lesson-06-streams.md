# Lesson 6 — Streams, Buffers, and Backpressure

## Purpose

Understand how Node.js represents binary data, processes large or continuous datasets incrementally, and controls differences in throughput between producers and consumers.

> 📖 **Learning Journal**
>
> See the exercises, reflections, and code reviews for this lesson:
>
> → [Lesson 6 Journal](../../journal/semester-1/lesson-6.md)

---

## Core Concepts

* A `Buffer` represents raw binary data as bytes.
* Streams process data incrementally instead of loading an entire dataset into memory.
* Node provides readable, writable, duplex, and transform streams.
* `.pipe()` connects streams and automatically manages data flow.
* Backpressure prevents a fast producer from overwhelming a slower consumer.
* Streams improve memory efficiency but do not automatically make every operation faster.
* Many Node APIs—including files, HTTP requests, compression, and sockets—are built around streams.

---

## Mental Model

Think of a stream as a pipeline carrying data in manageable chunks.

```text
Producer
   │
   │ chunk
   ▼
Readable Stream
   │
   │
   ▼
Transform
   │
   │
   ▼
Writable Stream
   │
   ▼
Consumer
```

The entire dataset does not need to exist in application memory at once.

Instead:

```text
Read chunk
    ↓
Process chunk
    ↓
Write chunk
    ↓
Repeat
```

This keeps memory usage relatively stable even when the total dataset is very large.

---

## Quick Reference

| Concept      | Purpose                                       |
| ------------ | --------------------------------------------- |
| `Buffer`     | Represent raw bytes                           |
| Readable     | Produces data                                 |
| Writable     | Consumes data                                 |
| Duplex       | Both readable and writable                    |
| Transform    | Reads data, modifies it, and writes data      |
| `.pipe()`    | Connect streams while managing flow           |
| Backpressure | Prevent producers from overwhelming consumers |

### File Copy

```javascript
const fs = require("fs");

fs.createReadStream("large-file.txt")
    .pipe(fs.createWriteStream("copy.txt"));
```

The file is copied incrementally rather than being loaded entirely into application memory.

---

## Buffers

JavaScript strings represent text.

I/O ultimately operates on bytes.

Node's `Buffer` provides a way to work directly with those bytes.

```javascript
const buffer = Buffer.from("Hello");

console.log(buffer);
console.log(buffer.toString());
```

Conceptually:

```text
"Hello"
   │
   ▼
Encoding
   │
   ▼
Bytes
   │
   ▼
Buffer
```

The meaning of those bytes depends on their encoding.

---

## Streams vs. `readFile()`

Consider:

```javascript
fs.readFile("large-file.txt", (error, data) => {
    // ...
});
```

The asynchronous version does **not** block the Event Loop while waiting for the file operation.

However, the entire file must be accumulated in memory before `data` becomes available.

For a 4 GB file:

```text
readFile()

Disk
 │
 ▼
████████████████████████████
          Memory
```

A stream instead processes smaller chunks:

```text
Disk
 │
 ▼
████
 │
 ▼
Process
 │
 ▼
████
 │
 ▼
Process
```

The important distinction is primarily **memory consumption and incremental processing**, not simply asynchronous versus synchronous execution.

---

## Types of Streams

### Readable

Produces data.

Examples:

* file reads,
* HTTP request bodies,
* database result streams.

```javascript
const stream = fs.createReadStream("data.txt");
```

### Writable

Consumes data.

Examples:

* file writes,
* HTTP responses.

```javascript
const stream = fs.createWriteStream("output.txt");
```

### Duplex

Can independently read and write.

Examples:

* TCP sockets.

### Transform

A Duplex stream where output is derived from input.

Examples:

```text
Input
  ↓
Compression
  ↓
Compressed Output
```

Common uses include:

* compression,
* encryption,
* parsing,
* data transformation.

---

## Backpressure

Imagine:

```text
Producer: 100 MB/sec
             │
             ▼
Consumer: 10 MB/sec
```

Without flow control:

```text
Producer
   │
   ▼
██████████████████████████████
          Memory
   │
   ▼
Consumer
```

Memory usage continually grows because data arrives faster than it can be processed.

Backpressure allows the consumer to effectively say:

> Slow down. I'm not ready for more data yet.

Once capacity becomes available, production resumes.

---

## Writable Backpressure

For writable streams:

```javascript
const canContinue = writable.write(chunk);
```

If `write()` returns `false`, stop writing temporarily.

```javascript
if (!writable.write(chunk)) {
    await once(writable, "drain");
}
```

The `drain` event indicates that the consumer is ready for more data.

When using `.pipe()`, Node manages this flow automatically.

---

## `.pipe()`

For straightforward stream chains:

```javascript
readable.pipe(writable);
```

is generally preferable to manually managing:

```javascript
readable.on("data", chunk => {
    writable.write(chunk);
});
```

because `.pipe()` handles flow control and backpressure for you.

For modern production pipelines, `stream.pipeline()` is often even better because it provides stronger error and completion handling across the entire chain.

```javascript
const { pipeline } = require("node:stream/promises");

await pipeline(
    fs.createReadStream("input.txt"),
    fs.createWriteStream("output.txt")
);
```

---

## Key APIs

### Create a Buffer

```javascript
Buffer.from("Hello");
```

### Read a file as a stream

```javascript
fs.createReadStream("input.txt");
```

### Write a file as a stream

```javascript
fs.createWriteStream("output.txt");
```

### Connect streams

```javascript
readable.pipe(writable);
```

### Build a managed pipeline

```javascript
await pipeline(
    readable,
    transform,
    writable
);
```

---

## Best Practices

* Stream large or continuous datasets rather than buffering them entirely.
* Use `.pipe()` or `pipeline()` when manual chunk handling isn't necessary.
* Respect backpressure when manually writing to streams.
* Handle stream errors explicitly.
* Prefer `pipeline()` for multi-stage production stream processing.
* Choose appropriate encodings when converting between strings and Buffers.
* Measure before assuming streaming will improve performance.

---

## Common Mistakes

❌ Assuming `readFile()` blocks the Event Loop simply because it loads the entire file.

❌ Loading very large files completely into memory unnecessarily.

❌ Ignoring the return value of `writable.write()`.

❌ Manually handling `data` events when `.pipe()` or `pipeline()` already solves the problem.

❌ Treating Buffers as strings without considering encoding.

❌ Assuming streams eliminate resource limits.

---

## Engineering Takeaways

* Process data at the rate the system can safely consume it.
* Memory is a finite resource and should be treated as such.
* Incremental processing allows systems to handle datasets much larger than available memory.
* Flow control is essential whenever producers and consumers operate at different speeds.
* Prefer platform mechanisms that already solve difficult coordination problems.
* Backpressure is a general distributed-systems concept, not merely a Node stream feature.

---

## Interview Questions

**Why does Node use Buffers?**

I/O operates on raw bytes, while JavaScript's native string representation is text-oriented. Buffers provide Node with an efficient representation for binary data.

---

**Why are streams more memory-efficient than `readFile()`?**

Streams process data incrementally, while `readFile()` accumulates the entire file in memory before returning it.

---

**What is backpressure?**

Backpressure is flow control that prevents a producer from sending data faster than a consumer can safely process it.

---

**What does it mean when `writable.write()` returns `false`?**

The writable stream's internal buffer has reached its threshold and the producer should stop writing until the `drain` event occurs.

---

**When should you use `.pipe()`?**

When data should flow directly between streams without requiring manual control over each chunk.

---

**Why might `pipeline()` be preferable to `.pipe()`?**

`pipeline()` coordinates completion and error propagation across the complete stream chain, making multi-stage pipelines easier to manage safely.

---

## Related Lessons

* [Lesson 1 — Understanding the Node Runtime](lesson-01-node-runtime.md)
* [Lesson 4 — The Event Loop, Concurrency, and Asynchronous I/O](./lesson-04-event-loop.md)
* [Lesson 7 — Processes, Child Processes, and Worker Threads](./lesson-07-processes.md)
* [Lesson 11 — Performance, Profiling, and Memory](./lesson-11-performance.md)
* [Lesson 15 — Production Readiness](./lesson-15-production-readiness.md)

---

## Remember

> Never produce data indefinitely faster than the system can consume it.

---

## Jason's Notes

Backpressure was the major discovery from this lesson. It provided a name and a built-in solution for a class of problems I'd encountered previously when one part of a system produced work faster than another could consume it.

The lesson also corrected an important mental model: asynchronous `readFile()` does not lock the Event Loop. Its primary limitation with large files is that the entire file must be held in memory. Streams solve that problem by processing data incrementally.

Backpressure also connected directly to an earlier production experience where an external API returned HTTP 429 responses because requests were being generated faster than the downstream service could accept them. The mechanisms were different, but the engineering problem was the same: **the producer must respect the capacity of the consumer.**
