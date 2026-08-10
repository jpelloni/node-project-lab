# Lesson 4 — The Event Loop, Concurrency, and Asynchronous I/O

## Purpose

Understand how Node.js handles large numbers of concurrent operations while JavaScript execution remains primarily single-threaded, and how the Event Loop, operating system, and libuv coordinate asynchronous work.

> 📖 **Learning Journal**
>
> See the exercises, reflections, and code reviews for this lesson:
>
> → [Lesson 4 Journal](../../journal/semester-1/lesson-4.md)

---

## Core Concepts

* JavaScript execution in a Node.js process is primarily single-threaded.
* Node achieves concurrency by allowing work to progress outside the JavaScript call stack.
* The Event Loop coordinates when completed asynchronous work can resume JavaScript execution.
* The operating system handles many asynchronous network operations directly.
* libuv maintains a worker pool for operations that cannot efficiently use non-blocking OS facilities.
* Concurrency and parallelism are related but different concepts.
* `await` pauses the current async function; it does not block the Event Loop.
* Independent asynchronous operations can often execute concurrently.
* CPU-intensive JavaScript can block the Event Loop.

---

## Mental Model

Think of the JavaScript thread as a coordinator rather than the worker responsible for performing every operation.

```
                ┌─────────────────┐
                │   JavaScript    │
                │   Call Stack    │
                └────────┬────────┘
                         │
                         ▼
                ┌─────────────────┐
                │   Node / libuv  │
                │   Event Loop    │
                └────────┬────────┘
                         │
              ┌──────────┴──────────┐
              ▼                     ▼
      Operating System        libuv Worker Pool
       Network / I/O          Some FS / DNS /
                              Crypto operations
              │                     │
              └──────────┬──────────┘
                         ▼
                 Work Completes
                         │
                         ▼
                Event Loop schedules
                JavaScript callback
```

JavaScript does not need to wait synchronously for most I/O.

It starts the operation, allows other work to proceed, and resumes processing the result when the operation completes.

---

## Quick Reference

| Concept              | Meaning                                                    |
| -------------------- | ---------------------------------------------------------- |
| Call Stack           | JavaScript currently executing                             |
| Event Loop           | Coordinates execution of asynchronous callbacks            |
| libuv                | Cross-platform asynchronous I/O infrastructure             |
| Worker Pool          | Threads used by libuv for certain operations               |
| Concurrency          | Multiple operations making progress over overlapping time  |
| Parallelism          | Multiple operations executing simultaneously               |
| `await`              | Suspend the current async function until a Promise settles |
| `Promise.all()`      | Await multiple independent Promises concurrently           |
| `process.nextTick()` | Schedule work before the Event Loop continues              |

### Sequential

```javascript
const users = await db.getUsers();
const reports = await storage.getReports();
```

If each operation takes one second:

```text
users    ██████████
                  reports    ██████████

Total ≈ 2 seconds
```

### Concurrent

```javascript
const [users, reports] = await Promise.all([
    db.getUsers(),
    storage.getReports()
]);
```

```text
users      ██████████
reports    ██████████

Total ≈ 1 second
```

Assuming the operations are independent and the downstream systems can safely handle the concurrency.

---

## Key APIs / Commands

### `async` / `await`

```javascript
async function loadUser() {
    const user = await getUser();
    return user;
}
```

`await` suspends `loadUser()` while allowing the Event Loop to continue processing other work.

### `Promise.all()`

```javascript
const [users, reports, permissions] = await Promise.all([
    db.getUsers(),
    storage.getReports(),
    graphApi.getPermissions()
]);
```

Use when the operations are independent and can safely execute concurrently.

### `process.nextTick()`

```javascript
process.nextTick(() => {
    console.log("next tick");
});
```

Schedules the callback to run after the current JavaScript operation completes but before the Event Loop proceeds to another phase.

### `setImmediate()`

```javascript
setImmediate(() => {
    console.log("immediate");
});
```

Schedules work for a future Event Loop iteration.

---

## Concurrency Is Not Unlimited Parallelism

A common misconception is:

> Node handles thousands of connections because libuv creates thousands of threads.

It does not.

For networking, the operating system can monitor large numbers of sockets efficiently without dedicating a thread to every connection.

The libuv worker pool is used for particular operations, including some:

* file system operations,
* DNS operations,
* cryptographic operations,
* compression operations.

This distinction is fundamental to Node's scalability.

---

## `await` Does Not Make Node Synchronous

This:

```javascript
await delay(5000);
```

does **not** mean:

> Stop Node for five seconds.

It means:

> Suspend this async function until the Promise settles and allow Node to process other work in the meantime.

Sequential `await` statements can still unnecessarily serialize independent operations:

```javascript
await operationA();
await operationB();
```

If B does not depend on A, concurrency may be more appropriate.

---

## `Promise.all()` Requires Engineering Judgment

`Promise.all()` is appropriate when:

* operations are independent,
* ordering does not matter,
* downstream systems can handle the concurrency,
* failure semantics are acceptable.

It can be harmful when concurrency is unbounded.

For example:

```javascript
await Promise.all(
    users.map(user => externalApi.send(user))
);
```

With 50,000 users, this can overwhelm:

* connection pools,
* external APIs,
* memory,
* rate limits.

A better strategy may be controlled concurrency:

```text
50,000 requests
       │
       ▼
    Batch 1
  100 concurrent
       │
       ▼
    Batch 2
  100 concurrent
       │
       ▼
      ...
```

Concurrency is a resource that should be managed deliberately.

---

## Best Practices

* Keep Event Loop work short.
* Avoid synchronous I/O in request-processing paths.
* Run independent asynchronous operations concurrently when appropriate.
* Limit concurrency when interacting with constrained downstream systems.
* Understand dependency ordering before using `Promise.all()`.
* Measure before assuming concurrency will improve performance.
* Move genuinely CPU-intensive work away from the main Event Loop when necessary.

---

## Common Mistakes

❌ Assuming asynchronous means parallel.

❌ Assuming every asynchronous operation uses a separate thread.

❌ Saying `await` blocks the Event Loop.

❌ Sequentially awaiting operations that are completely independent.

❌ Using `Promise.all()` for an unbounded number of operations.

❌ Performing CPU-heavy work on the main JavaScript thread.

❌ Assuming more concurrency always means better performance.

---

## Engineering Takeaways

* Concurrency is about coordinating work, not simply creating threads.
* Resources have capacity limits even when APIs are asynchronous.
* Performance improvements can create downstream failures if system boundaries are ignored.
* Optimize the entire workflow rather than one component in isolation.
* Understand what actually performs the work before reasoning about system performance.
* Backpressure and bounded concurrency are fundamental tools for protecting systems.

---

## Interview Questions

**How can Node handle thousands of connections with one JavaScript thread?**

Node avoids blocking the JavaScript thread while waiting for most I/O. The operating system and libuv manage asynchronous operations, while the Event Loop schedules JavaScript execution when results become available.

---

**What is the difference between concurrency and parallelism?**

Concurrency means multiple operations can make progress during overlapping periods of time.

Parallelism means multiple operations are physically executing simultaneously.

---

**Does `await` block the Event Loop?**

No. `await` suspends the current async function while allowing the Event Loop to continue processing other work.

---

**When should you use `Promise.all()`?**

When multiple asynchronous operations are independent and the downstream systems can safely handle them concurrently.

---

**When should you avoid `Promise.all()`?**

When operations depend on one another, ordering matters, failure semantics require different handling, or unbounded concurrency could overwhelm a downstream resource.

---

**Why can CPU-intensive JavaScript hurt Node performance?**

JavaScript executes primarily on the main thread. Long-running CPU work prevents the Event Loop from returning to other callbacks, increasing latency across the entire process.

---

**Does libuv create a thread for every network request?**

No. Network I/O generally uses operating-system asynchronous facilities. libuv maintains a limited worker pool for operations that require it.

---

## Related Lessons

* [Lesson 1 — Understanding the Node Runtime](./lesson-01-node-runtime.md)
* [Lesson 6 — Streams, Buffers, and Backpressure](./lesson-06-streams.md)
* [Lesson 7 — Processes, Child Processes, and Worker Threads](./lesson-07-processes.md)
* [Lesson 11 — Performance, Profiling, and Memory](./lesson-11-performance.md)
* [Lesson 15 — Production Readiness](./lesson-15-production-readiness.md)

---

## Remember

> Asynchronous code removes waiting from the JavaScript thread; it does not remove resource limits from the system.

---

## Jason's Notes

Two ideas from this lesson became particularly important.

The first was learning about `process.nextTick()` and recognizing situations in previous applications where deferred cleanup or post-processing could have benefited from understanding Node's scheduling behavior.

The second came from production experience: using `Promise.all()` against an external API resulted in HTTP 429 responses because the application generated requests faster than the external system could accept them. The eventual solution was controlled concurrency—processing sequential batches while allowing requests within each batch to execute asynchronously.

That experience reinforced an important distinction: concurrency is not something to maximize. It is something to manage.
