# Lesson 11 — Performance, Profiling, and Memory

## Purpose

Understand how to investigate Node.js performance using measurement rather than intuition, how benchmarking differs from profiling, how memory leaks develop, and how to identify the actual bottleneck before attempting optimization.

> 📖 **Learning Journal**
>
> See the exercises, reflections, and code reviews for this lesson:
>
> → [Lesson 11 Journal](../../journal/semester-1/lesson-11.md)

---

## Core Concepts

* Performance optimization should begin with measurement.
* Benchmarking measures how long an operation or workload takes.
* Profiling explains where execution time or resources are being consumed.
* High-resolution monotonic timers are preferable for measuring elapsed execution time.
* CPU bottlenecks and I/O bottlenecks require different solutions.
* High memory usage is not necessarily a memory leak.
* A memory leak occurs when memory that is no longer useful remains reachable and therefore cannot be reclaimed.
* Garbage collection automatically reclaims unreachable memory.
* Performance must be evaluated under representative workloads.
* Optimization should target demonstrated bottlenecks rather than suspected ones.

---

## Mental Model

Performance investigation should narrow uncertainty.

```text
Performance Problem
        │
        ▼
     Measure
        │
        ▼
Where is the time/resource going?
        │
        ├── CPU?
        ├── Memory?
        ├── I/O?
        ├── Network?
        ├── Database?
        └── Downstream dependency?
        │
        ▼
     Profile
        │
        ▼
   Hypothesis
        │
        ▼
     Change
        │
        ▼
   Measure Again
```

Optimization is an experiment.

Without the measurement before and after, you do not know whether the optimization actually improved anything.

---

## Quick Reference

| Tool / Concept            | Question                                 |
| ------------------------- | ---------------------------------------- |
| Benchmark                 | How long does this take?                 |
| CPU Profile               | Where is CPU time being spent?           |
| Heap Snapshot             | What objects occupy memory?              |
| Memory Profile            | How does memory change over time?        |
| `process.hrtime.bigint()` | How much elapsed time passed?            |
| `process.memoryUsage()`   | How much memory is the process using?    |
| Load Test                 | How does the system behave under demand? |

### Investigation Loop

```text
Measure
   ↓
Profile
   ↓
Hypothesize
   ↓
Change One Thing
   ↓
Measure Again
```

---

## Benchmarking vs. Profiling

### Benchmarking

Benchmarking answers:

> How long did this operation take?

For example:

```javascript
function benchmark(name, fn) {
    const start = process.hrtime.bigint();

    const result = fn();

    const durationMs =
        Number(process.hrtime.bigint() - start) / 1_000_000;

    console.info({
        name,
        durationMs
    });

    return result;
}
```

This tells us:

```text
Array Sort → 42.713 ms
```

It does **not** tell us why the operation took 42.713 ms.

---

### Profiling

Profiling answers:

> Where was that time spent?

Conceptually:

```text
Request                    800 ms
│
├── Validation              10 ms
├── Mapping                 20 ms
├── Calculation            610 ms
└── Database               160 ms
```

The profile provides a target:

```text
Calculation → 610 ms
```

Benchmarking identifies the symptom.

Profiling helps identify the cause.

---

## High-Resolution Timing

For measuring elapsed execution time:

```javascript
const start = process.hrtime.bigint();

// operation

const elapsed =
    process.hrtime.bigint() - start;
```

Convert nanoseconds to milliseconds:

```javascript
const durationMs =
    Number(elapsed) / 1_000_000;
```

Formatted:

```javascript
const duration =
    `${(Number(elapsed) / 1_000_000).toFixed(3)} ms`;
```

`process.hrtime.bigint()` is designed for high-resolution elapsed-time measurement and is monotonic, meaning wall-clock adjustments do not affect the result.

---

## Why Not `Date.now()`?

This works for coarse measurements:

```javascript
const start = Date.now();

// operation

console.log(Date.now() - start);
```

But `Date.now()` represents wall-clock time and provides millisecond resolution.

For benchmarking:

```javascript
process.hrtime.bigint()
```

provides much finer resolution and is designed for measuring durations.

Use the clock appropriate to the question.

---

## CPU-Bound vs. I/O-Bound

A slow operation does not automatically mean JavaScript itself is slow.

Consider:

```text
Request takes 2 seconds
```

Possible causes include:

```text
CPU calculation       1.8 s
Database query        1.8 s
External API          1.8 s
Connection waiting    1.8 s
Network latency       1.8 s
```

The symptom is identical.

The solutions are completely different.

### CPU-bound

```text
JavaScript actively computing
        │
        ▼
Main thread occupied
```

Possible responses:

* improve the algorithm,
* reduce unnecessary computation,
* cache appropriate results,
* consider Worker Threads.

### I/O-bound

```text
JavaScript waiting
        │
        ▼
External resource
```

Possible responses:

* optimize the query,
* investigate the downstream service,
* improve concurrency,
* examine connection pools,
* cache appropriate data.

Classify the bottleneck before attempting to fix it.

---

## Memory Usage

Node exposes process memory information:

```javascript
console.log(process.memoryUsage());
```

Typical fields include:

```text
rss
heapTotal
heapUsed
external
arrayBuffers
```

### Heap

The JavaScript heap contains objects managed by V8's garbage collector.

```text
V8 Heap
│
├── Object
├── Array
├── Closure
├── Function
└── ...
```

### RSS

Resident Set Size represents memory currently held in physical memory for the process and includes more than the JavaScript heap.

Therefore:

```text
RSS ≠ JavaScript heap usage
```

Understanding which memory measurement is growing matters during investigation.

---

## Garbage Collection

JavaScript automatically reclaims memory that is no longer reachable.

```javascript
function createUser() {
    const user = {
        name: "Jason"
    };
}
```

After the function completes, if nothing retains `user`, it eventually becomes eligible for garbage collection.

Conceptually:

```text
Object
  │
  ├── Reachable?
  │      └── Keep
  │
  └── Unreachable?
         └── Eligible for GC
```

A memory leak occurs when unwanted data remains reachable.

---

## Memory Leaks

Consider:

```javascript
const requests = [];

function handleRequest(request) {
    requests.push(request);
}
```

If entries are never removed:

```text
requests
│
├── Request 1
├── Request 2
├── Request 3
├── Request 4
├── ...
└── Request 1,000,000
```

Those objects remain reachable through `requests`.

Garbage collection cannot reclaim them.

The issue is not:

> Node forgot to free memory.

The issue is:

> The application still holds references to memory it no longer needs.

---

## High Memory Usage vs. Memory Leak

These are not the same.

### High but stable

```text
Memory
  │
8GB ────────────────
7GB ────────████████
6GB ───█████
5GB ─██
   └──────────────── Time
```

The application may simply require substantial memory.

### Leak

```text
Memory
  │
8GB ───────────────█
7GB ─────────────██
6GB ──────────██
5GB ───────██
4GB ────██
3GB ──██
   └──────────────── Time
```

Memory continually trends upward and fails to return after workloads complete.

The **trend** matters more than a single measurement.

---

## Common Sources of Memory Leaks

Examples include:

### Unbounded collections

```javascript
const cache = new Map();
```

with no eviction policy.

### Forgotten timers

```javascript
setInterval(() => {
    // retains references
}, 1000);
```

### Event listeners

Listeners continually added but never removed.

### Closures

Closures unintentionally retaining large objects.

### Request history

Diagnostic or application data stored indefinitely in process memory.

The common pattern is:

> Something still references data that should have become disposable.

---

## Profiling Workflow

Suppose memory continually increases.

Do not immediately rewrite suspected code.

Instead:

```text
1. Establish baseline
        ↓
2. Reproduce growth
        ↓
3. Capture heap snapshot
        ↓
4. Run workload
        ↓
5. Capture another snapshot
        ↓
6. Compare retained objects
        ↓
7. Identify retention path
        ↓
8. Form hypothesis
        ↓
9. Make targeted change
        ↓
10. Repeat workload
```

This transforms:

> I think the cache is leaking.

into:

> Heap snapshots show `Map` entries retaining 1.2 GB of objects after requests complete.

Now there is evidence.

---

## Performance Under Load

Code that performs well once may behave very differently under sustained demand.

```text
1 Request
   │
   ▼
 50 ms
```

does not imply:

```text
10,000 concurrent requests
        │
        ▼
      50 ms
```

Load may expose:

* connection-pool exhaustion,
* memory pressure,
* garbage-collection overhead,
* queue growth,
* rate limits,
* lock contention,
* downstream saturation.

Performance is a system property, not merely a function property.

---

## Percentiles Matter

An average can hide poor user experience.

Suppose request times are:

```text
90 ms
95 ms
100 ms
105 ms
110 ms
3000 ms
```

An average compresses those experiences into one number.

Production systems commonly track percentiles such as:

```text
p50
p95
p99
```

because they reveal the behavior experienced by slower portions of traffic.

A service can have an acceptable average while still having unacceptable tail latency.

---

## Key APIs / Tools

### High-resolution timing

```javascript
process.hrtime.bigint();
```

### Process memory

```javascript
process.memoryUsage();
```

### CPU usage

```javascript
process.cpuUsage();
```

### Node inspector

```bash
node --inspect app.js
```

### CPU profile

```bash
node --cpu-prof app.js
```

### Heap profile

```bash
node --heap-prof app.js
```

These tools provide evidence about where application resources are actually being consumed.

---

## Best Practices

* Measure before optimizing.
* Establish a baseline before making performance changes.
* Reproduce performance problems when possible.
* Distinguish CPU-bound work from I/O-bound work.
* Use profiling to locate bottlenecks.
* Examine trends rather than isolated memory measurements.
* Test under representative workloads.
* Measure again after every optimization.
* Prefer the simplest change that resolves the measured bottleneck.
* Track tail latency in addition to averages.

---

## Common Mistakes

❌ Optimizing code because it looks inefficient.

❌ Assuming the slowest-looking code is the bottleneck.

❌ Confusing benchmarking with profiling.

❌ Treating high memory usage as proof of a memory leak.

❌ Assuming garbage collection can reclaim reachable objects.

❌ Making several performance changes simultaneously.

❌ Benchmarking unrealistic workloads.

❌ Measuring only averages.

❌ Declaring an optimization successful without measuring afterward.

---

## Engineering Takeaways

* Performance problems are evidence problems before they are code problems.
* Measurement should precede intervention.
* The location of a symptom is not necessarily the location of its cause.
* Resource trends often reveal more than individual measurements.
* System performance emerges from interactions between components.
* Optimization requires both a baseline and a measurable outcome.
* Faster code is irrelevant if it does not improve the actual bottleneck.
* Production performance should be evaluated from the user's experience, not only internal implementation speed.

---

## Interview Questions

**What is the difference between benchmarking and profiling?**

Benchmarking measures the performance of an operation or workload. Profiling determines where execution time or resources are being consumed within that workload.

---

**Why shouldn't optimization begin before measurement?**

Because without measurement there is no reliable evidence that the suspected code is actually responsible for the performance problem. Optimizing the wrong component adds complexity without improving the system.

---

**What is a memory leak?**

A memory leak occurs when data that is no longer useful remains reachable by the application, preventing garbage collection from reclaiming it.

---

**Does high memory usage mean an application has a memory leak?**

No. An application may legitimately require substantial memory. A leak is characterized by unnecessary retained memory, often visible as continued growth that does not return after workloads complete.

---

**Why is `process.hrtime.bigint()` useful for benchmarking?**

It provides high-resolution monotonic timing suitable for measuring elapsed durations without being affected by wall-clock adjustments.

---

**Why are latency percentiles useful?**

Percentiles expose tail behavior that averages can hide. Metrics such as p95 and p99 show the experience of slower requests and can reveal production problems invisible in average latency.

---

**How would you investigate a suspected Node.js memory leak?**

Reproduce the growth, establish memory behavior over time, capture heap snapshots before and after the workload, compare retained objects and retention paths, form a hypothesis from that evidence, make a targeted change, and repeat the measurement.

---

## Related Lessons

* [Lesson 4 — The Event Loop, Concurrency, and Asynchronous I/O](./lesson-04-event-loop.md)
* [Lesson 6 — Streams, Buffers, and Backpressure](./lesson-06-streams.md)
* [Lesson 7 — Processes, Child Processes, and Worker Threads](./lesson-07-processes.md)
* [Lesson 10 — Observability, Logging, and Diagnostics](./lesson-10-observability.md)
* [Lesson 12 — Debugging Like a Systems Engineer](./lesson-10-observability.md)
* [Lesson 15 — Production Readiness](./lesson-15-production-readiness.md)

---

## Remember

> Measure before optimizing. Then measure again.

---

## Jason's Notes

The most important realization from this lesson was recognizing how often I had previously tried to improve performance by reasoning about where the bottleneck probably was instead of first gathering evidence.

The distinction between benchmarking and profiling made that problem especially clear. A benchmark can establish that something is slow, but it cannot tell me how that time is distributed across the work being performed. Profiling provides the evidence needed to move from observation to explanation.

The lesson also clarified the definition of a memory leak. High memory usage alone is not a leak. The important issue is whether the application continues retaining memory that is no longer useful.

The larger change in thinking was straightforward:

> Performance optimization should be treated as an investigation, not an intuition exercise.

That makes "premature optimization is the root of all evil" much more useful than a warning against optimization. The problem isn't optimization itself. The problem is optimizing before knowing what problem needs to be solved.
