# Lesson 15 — Production Readiness

## Purpose

Understand what a Node.js service needs beyond correct business logic to operate safely in production, including graceful shutdown, health checks, timeouts, cancellation, failure behavior, monitoring, and deployment safety.

> 📖 **Learning Journal**
>
> See the exercises, reflections, and code reviews for this lesson:
>
> → [Lesson 15 Journal](../../journal/semester-1/lesson-15.md)

---

## Core Concepts

* A working application is not automatically a production-ready application.
* Graceful shutdown allows in-flight work to complete or terminate safely.
* Liveness and readiness answer different operational questions.
* Timeouts prevent operations from waiting indefinitely.
* `AbortController` provides a standard mechanism for cancellation.
* Continuing from an unknown or corrupted state can be more dangerous than crashing.
* Production systems must account for downstream dependency failures.
* Health checks should reflect the question the caller actually needs answered.
* Monitoring and alerts should identify conditions requiring action.
* Deployment and shutdown behavior are part of application architecture.

---

## Mental Model

Production readiness means considering the complete application lifecycle:

```text
        Start
          │
          ▼
  Validate Configuration
          │
          ▼
Initialize Dependencies
          │
          ▼
       Ready
          │
          ▼
   Accept Traffic
          │
          ▼
    Normal Operation
          │
          ├── Dependency failure
          ├── Timeout
          ├── Resource pressure
          └── Shutdown signal
                    │
                    ▼
            Stop New Work
                    │
                    ▼
           Finish / Cancel Work
                    │
                    ▼
            Release Resources
                    │
                    ▼
                  Exit
```

Production engineering asks:

> What happens during every part of this lifecycle—not just the happy path?

---

## Quick Reference

| Concern           | Question                                |
| ----------------- | --------------------------------------- |
| Liveness          | Is the process alive?                   |
| Readiness         | Can it safely receive traffic?          |
| Timeout           | How long are we willing to wait?        |
| Cancellation      | How do we tell work to stop?            |
| Graceful Shutdown | How do we stop without corrupting work? |
| Monitoring        | How do we know behavior is degrading?   |
| Alerting          | When does someone need to act?          |

---

## Graceful Shutdown

Production processes do not run forever.

They may stop because of:

* deployments,
* autoscaling,
* container replacement,
* host maintenance,
* crashes,
* operator action.

Unix-like environments commonly signal termination using:

```text
SIGTERM
SIGINT
```

Node can listen for them:

```javascript
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
```

The goal is not simply:

```text
Receive signal
      │
      ▼
process.exit()
```

A safer lifecycle is:

```text
Receive signal
      │
      ▼
Stop accepting new work
      │
      ▼
Complete or cancel in-flight work
      │
      ▼
Close resources
      │
      ▼
Exit
```

---

## Shutdown Ordering

Cleanup order depends on the responsibilities of the system.

Suppose an application contains:

```text
HTTP Server
Database
RabbitMQ
```

The correct shutdown order cannot be determined from those names alone.

RabbitMQ might be:

* publishing background work,
* consuming jobs,
* receiving critical events,
* delivering work that requires database access.

If the application consumes RabbitMQ messages and writes them to the database:

```text
RabbitMQ Consumer
       │
       ▼
   Processing
       │
       ▼
    Database
```

closing the database first would be unsafe.

A better sequence may be:

```text
Stop accepting HTTP traffic
          │
          ▼
Stop consuming new messages
          │
          ▼
Finish in-flight work
          │
          ▼
Close database connections
          │
          ▼
Close messaging connection
          │
          ▼
Exit
```

The rule is:

> Shut resources down according to dependency and work-flow relationships, not a memorized list.

---

## Idempotent Shutdown

Shutdown logic may be triggered more than once.

For example:

```text
SIGTERM
   │
   ▼
shutdown()

SIGINT
   │
   ▼
shutdown()
```

Cleanup should not accidentally execute twice.

A simple guard:

```javascript
let shuttingDown = false;

async function shutdown() {
    if (shuttingDown) {
        return;
    }

    shuttingDown = true;

    // cleanup
}
```

Production lifecycle operations should tolerate repeated signals safely.

---

## Cleanup Registration

A simple cleanup mechanism can centralize shutdown behavior:

```javascript
const cleanups = new Set();

function registerShutdown(cleanup) {
    if (typeof cleanup !== "function") {
        throw new TypeError(
            "cleanup must be a function"
        );
    }

    cleanups.add(cleanup);
}
```

Then:

```javascript
registerShutdown(async () => {
    await database.close();
});

registerShutdown(async () => {
    await messageBroker.close();
});
```

The important design question is not how clever the registry is.

It is whether shutdown behavior is:

* explicit,
* deterministic,
* observable,
* bounded.

---

## Shutdown Must Have a Deadline

Graceful shutdown cannot mean:

> Wait forever.

Suppose one cleanup operation hangs:

```text
SIGTERM
   │
   ▼
Close database
   │
   ▼
Waiting...
Waiting...
Waiting...
```

The orchestrator may eventually kill the process anyway.

A production shutdown strategy should define:

```text
Grace Period
     │
     ├── Complete normally → exit
     │
     └── Deadline exceeded → force termination
```

Graceful shutdown is **bounded graceful behavior**.

---

## Liveness

A liveness endpoint answers:

> Is this application process functioning enough that it should remain alive?

For example:

```http
GET /health/live
```

Response:

```json
{
    "status": "ok"
}
```

Liveness should generally avoid depending on every downstream service.

If the database is temporarily unavailable but the Node process itself is healthy, failing liveness could cause:

```text
Database outage
      │
      ▼
Every application instance
fails liveness
      │
      ▼
Orchestrator restarts all instances
      │
      ▼
Database still unavailable
      │
      ▼
Restart loop
```

The health check has now amplified the outage.

---

## Readiness

A readiness endpoint answers:

> Should this instance receive new work right now?

For example:

```http
GET /health/ready
```

Readiness may verify critical dependencies such as:

```text
Application initialized?
Database usable?
Required messaging connection available?
Critical startup state loaded?
```

If readiness fails:

```text
Instance remains alive
        │
        ▼
Traffic temporarily removed
```

This is different from:

```text
Instance must be restarted
```

---

## Liveness vs. Readiness

```text
             Application
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
     Liveness            Readiness
        │                   │
        ▼                   ▼
"Should this          "Should this
 process stay          instance receive
 alive?"               traffic?"
```

A service can therefore be:

```text
Alive: YES
Ready: NO
```

That is a valid and useful operational state.

---

## Health Checks Should Be Cheap

A health endpoint may be called frequently.

Avoid turning:

```http
GET /health/live
```

into:

```text
Query database
Call three APIs
Read object storage
Publish test message
Run expensive calculation
```

Health checks themselves can become production load.

Check only what is necessary to answer the health question.

---

## Timeouts

Every external operation has a question attached:

> How long are we willing to wait?

Without a timeout:

```text
Request
   │
   ▼
External Service
   │
   ▼
Never responds
   │
   ▼
Caller waits indefinitely
```

Meanwhile resources may remain occupied:

* connections,
* memory,
* request slots,
* promises,
* upstream callers.

Under load:

```text
One stuck request
      │
      ▼
Many stuck requests
      │
      ▼
Resource exhaustion
      │
      ▼
System degradation
```

Timeouts provide a bounded failure mode.

---

## Timeout Budgets

Timeouts should reflect the complete request path.

Suppose:

```text
Client timeout       5 seconds
       │
       ▼
API
       │
       ├── Service A timeout 10 seconds
       └── Database timeout 30 seconds
```

The internal timeout strategy makes little sense.

The client has already abandoned the request before downstream operations stop.

A more deliberate budget might be:

```text
Client               5.0 s
API total budget     4.5 s
Service call         2.0 s
Database             1.0 s
Remaining time       response / overhead
```

Timeouts are architectural decisions, not arbitrary numbers.

---

## `AbortController`

JavaScript provides a standard cancellation mechanism:

```javascript
const controller = new AbortController();

const response = await fetch(url, {
    signal: controller.signal
});
```

Cancellation:

```javascript
controller.abort();
```

Many modern APIs support `AbortSignal`.

This allows cancellation intent to propagate through a workflow.

---

## Timeout with `AbortController`

For example:

```javascript
const controller = new AbortController();

const timeout = setTimeout(() => {
    controller.abort();
}, 5000);

try {
    const response = await fetch(url, {
        signal: controller.signal
    });

    return response;
} finally {
    clearTimeout(timeout);
}
```

Modern Node also provides helpers such as:

```javascript
AbortSignal.timeout(5000);
```

which can simplify timeout-based cancellation where supported by the API being called.

---

## Cancellation Is Not Rollback

This distinction is important.

Calling:

```javascript
controller.abort();
```

means:

> Stop this operation if the receiving API supports cancellation.

It does **not** necessarily mean:

> Undo everything that has already happened.

For example:

```text
Request sent
    │
    ▼
Remote service updates database
    │
    ▼
Caller aborts
```

The remote side may already have completed the operation.

Cancellation, rollback, and idempotency solve different problems.

---

## Crashing Can Be Safer

Suppose the application violates an invariant:

```text
Ledger transaction partially applied
        │
        ▼
Internal state is unknown
```

Continuing may cause:

```text
More requests
    │
    ▼
More corrupted state
```

Restarting from a known state may be safer.

This does **not** mean:

> Crash whenever anything goes wrong.

Operational failures such as:

```text
HTTP 429
Database timeout
Invalid user input
```

may be recoverable.

But programmer errors or corrupted internal state may mean continued execution cannot be trusted.

---

## Failure Categories

A production system should distinguish:

```text
Failure
  │
  ├── Expected operational failure
  │       │
  │       ├── Retry?
  │       ├── Reject?
  │       └── Degrade?
  │
  └── Unsafe internal state
          │
          ├── Log
          ├── Stop new work
          └── Restart / terminate
```

The important question is:

> Can the application still guarantee its invariants?

If not, continuing may be the riskier choice.

---

## Monitoring Production Systems

A production service should expose evidence about:

### Traffic

```text
Request rate
Concurrent requests
```

### Errors

```text
Error count
Error rate
Failure categories
```

### Latency

```text
p50
p95
p99
```

### Resources

```text
CPU
Memory
Connections
Queue depth
```

### Dependencies

```text
Database latency
External API failures
Message broker health
```

Monitoring should reveal degradation before users become the monitoring system.

---

## Request Tracing Is Not a Metric

This distinction is worth preserving.

These are metrics:

```text
request_count
error_rate
response_time
queue_depth
```

A request trace is a different observability signal.

Tracing answers:

> Where did this particular request spend its time?

Metrics answer:

> How is the system behaving over time?

Both are valuable, but they solve different problems.

---

## Alerts

Useful alerts correspond to actionable conditions.

Examples:

```text
Sustained error rate > threshold
p95 latency > service objective
Readiness failing across instances
Queue depth continually increasing
Connection pool approaching exhaustion
```

Avoid alerts such as:

```text
One request returned 500
CPU briefly reached 80%
One health check failed once
```

unless those events genuinely require immediate human action.

An alert should mean:

> Someone should investigate this.

---

## Example: Ledger API Production Risks

Potential production risks might include:

### Dependency Unavailable

```text
API
 │
 ▼
Database / Queue unavailable
```

Mitigation:

* readiness checks,
* bounded retries,
* timeouts,
* monitoring.

### Authentication Failure

```text
Authentication provider
        │
        ▼
Requests rejected
```

Monitor:

* authentication error rate,
* provider latency,
* unexpected failure spikes.

### Process Alive but Unresponsive

```text
Process exists
     │
     ▼
Event Loop blocked
     │
     ▼
Requests timeout
```

Monitor:

* latency,
* Event Loop delay,
* readiness,
* resource utilization.

Production readiness requires thinking beyond:

> Is the process running?

---

## Deployment Safety

A deployment is itself a production event.

A safe deployment should consider:

```text
New version starts
      │
      ▼
Initialization completes
      │
      ▼
Readiness passes
      │
      ▼
Traffic begins
```

Old instance:

```text
Traffic removed
      │
      ▼
Shutdown signal
      │
      ▼
Drain in-flight work
      │
      ▼
Cleanup
      │
      ▼
Exit
```

Startup, readiness, traffic routing, and graceful shutdown work together.

---

## Key APIs / Commands

### Handle termination

```javascript
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
```

### Abort an operation

```javascript
const controller = new AbortController();
controller.abort();
```

### Access abort signal

```javascript
controller.signal;
```

### Timeout signal

```javascript
AbortSignal.timeout(5000);
```

### Exit code

```javascript
process.exitCode = 1;
```

When practical, setting `process.exitCode` and allowing the event loop to drain is safer than immediately forcing:

```javascript
process.exit(1);
```

which terminates the process synchronously and can truncate pending output or cleanup.

---

## Best Practices

* Design shutdown behavior explicitly.
* Stop accepting new work before closing resources needed by in-flight work.
* Make shutdown handlers safe against repeated invocation.
* Bound graceful shutdown with a deadline.
* Separate liveness from readiness.
* Keep health checks cheap and purposeful.
* Define timeouts for external operations.
* Propagate cancellation where supported.
* Design timeout budgets across service boundaries.
* Distinguish recoverable failures from unsafe internal states.
* Monitor traffic, errors, latency, resources, and dependencies.
* Alert on actionable conditions.
* Coordinate readiness and graceful shutdown with deployment behavior.

---

## Common Mistakes

❌ Calling `process.exit()` immediately on `SIGTERM`.

❌ Closing dependencies before work that requires them has drained.

❌ Allowing graceful shutdown to wait forever.

❌ Making liveness depend on every downstream service.

❌ Treating liveness and readiness as interchangeable.

❌ Performing expensive work in health endpoints.

❌ Making external calls without timeouts.

❌ Assuming cancellation reverses already-completed side effects.

❌ Continuing after internal invariants can no longer be trusted.

❌ Treating request traces as metrics.

❌ Alerting on every isolated failure.

❌ Assuming a running process is necessarily a healthy service.

---

## Engineering Takeaways

* Production readiness is lifecycle design.
* Correct shutdown is the inverse of correct startup.
* Dependencies determine shutdown ordering.
* A healthy process and a traffic-ready process are different states.
* Unbounded waiting is a failure mode.
* Cancellation should propagate when work is no longer useful.
* Availability does not justify continuing from an unsafe state.
* Monitoring should expose degradation before users report it.
* Deployment behavior is part of application behavior.
* Production architecture includes how software starts, fails, recovers, and stops.

---

## Interview Questions

**Why is graceful shutdown important?**

It allows an application to stop accepting new work, complete or safely cancel in-flight operations, release resources, and terminate without unnecessarily losing work or corrupting state.

---

**What is the difference between liveness and readiness?**

Liveness indicates whether the process should remain running. Readiness indicates whether the instance is currently able to accept new work.

---

**Why shouldn't liveness always check the database?**

A temporary database outage could cause every otherwise-healthy application instance to fail liveness and restart, amplifying the original dependency outage.

---

**Why do production systems need timeouts?**

Without timeouts, failed or unreachable dependencies can cause operations to wait indefinitely while holding resources, eventually creating broader system degradation.

---

**What does `AbortController` provide?**

It provides a standardized way to communicate cancellation to operations that support an `AbortSignal`.

---

**Does aborting a request undo remote side effects?**

Not necessarily. The remote system may already have processed the request. Cancellation and transactional rollback are separate concerns.

---

**Why can crashing be safer than continuing?**

If a programmer error leaves the process in an unknown state or violates critical invariants, continuing may allow corrupted state to affect additional operations. Restarting from a known state can be safer.

---

**How should shutdown order be determined?**

By the dependencies between active workflows and resources. Stop new work first, allow existing work to drain, then release the resources that work depends upon.

---

**Why should graceful shutdown have a timeout?**

Because a stuck cleanup operation should not prevent termination indefinitely. Graceful shutdown must eventually yield to forced termination.

---

## Related Lessons

* [Lesson 5 — Errors, Exceptions, and Asynchronous Error Handling](./lesson-05-error-handling.md)
* [Lesson 7 — Processes, Child Processes, and Worker Threads](./lesson-07-processes.md)
* [Lesson 8 — Environment Variables, Configuration, and Secrets](./lesson-08-configuration.md)
* [Lesson 10 — Observability, Logging, and Diagnostics](./lesson-10-observability.md)
* [Lesson 11 — Performance, Profiling, and Memory](./lesson-11-performance.md)
* [Lesson 12 — Debugging Like a Systems Engineer](./lesson-12-debugging.md)
* [Lesson 16 — Thinking Like a Senior Node Engineer](./lesson-16-capstone.md)

---

## Remember

> A production service must know how to start, prove it is ready, bound its waiting, survive expected failures, and stop safely.

---

## Jason's Notes

Much of the production-readiness thinking in this lesson matched practices I had encountered before, but several details made the mental model more precise.

The RabbitMQ shutdown question was a useful example. There is no universally correct shutdown priority for "RabbitMQ." Its position depends on what role messaging plays in the workflow and which resources active messages require. Shutdown order follows dependencies, not technology names.

The distinction between liveness and readiness also became clearer:

```text
Liveness → Is the application functioning enough to remain alive?
Readiness → Can the application safely receive work?
```

The most useful new Node-specific capability was `AbortController`. I immediately recognized previous situations where being able to propagate cancellation through asynchronous work would have been useful.

The broader lesson was that production readiness is not a collection of infrastructure checkboxes.

It is designing the entire lifecycle of the application—including what happens when the application is asked to stop.
