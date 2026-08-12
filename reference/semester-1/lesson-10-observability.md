# Lesson 10 — Observability, Logging, and Diagnostics

## Purpose

Understand how logs, metrics, and traces provide different views into application behavior, how structured logging makes production data easier to analyze, and how to design observability that provides useful evidence without introducing unnecessary complexity or security risk.

> 📖 **Learning Journal**
>
> See the exercises, reflections, and code reviews for this lesson:
>
> → [Lesson 10 Journal](../../journal/semester-1/lesson-10.md)

---

## Core Concepts

* Observability is the ability to understand a system's internal state from the information it exposes.
* Logs record discrete events.
* Metrics measure system behavior over time.
* Traces follow work across components and boundaries.
* Structured logs are easier for machines to query and analyze than formatted text.
* Correlation IDs connect events belonging to the same logical operation.
* Log levels communicate severity and control output volume.
* Sensitive data must never be exposed through observability systems.
* Observability should provide evidence for investigation rather than simply generate data.
* Instrumentation has operational cost and should be intentional.

---

## Mental Model

Observability answers different questions using different signals.

```text id="xupfzg"
                Production System
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
        Logs         Metrics       Traces
          │            │            │
          ▼            ▼            ▼
    What happened?  How much?   Where did it go?
                    How often?
                       │
          └────────────┼────────────┘
                       ▼
                 Investigation
```

No single signal provides the complete picture.

Together they allow an engineer to move from:

> Something is wrong.

toward:

> This request became slow in this component because this resource became constrained.

---

## Quick Reference

| Signal         | Best At Answering                |
| -------------- | -------------------------------- |
| Logs           | What happened?                   |
| Metrics        | How often? How much?             |
| Traces         | Where did time or failure occur? |
| Correlation ID | Which events belong together?    |
| Alert          | Does someone need to act?        |

### Investigation Flow

```text id="56it6f"
Alert
  │
  ▼
Metric shows anomaly
  │
  ▼
Trace identifies component
  │
  ▼
Logs provide context
  │
  ▼
Hypothesis
  │
  ▼
Evidence
```

Observability supports debugging.

It does not replace it.

---

## Logs

Logs represent discrete events.

Example:

```javascript id="o7q0ua"
console.info({
    timestamp: new Date().toISOString(),
    level: "INFO",
    message: "Transaction created",
    transactionId: "tx-123"
});
```

Useful logs generally answer:

```text id="c2jj0p"
What happened?
When?
Where?
To what?
Under what context?
```

Logs should provide enough information to investigate behavior without requiring a developer to reproduce every production condition locally.

---

## Structured Logging

Plain-text logging:

```text id="2dfzg2"
2026-08-12 INFO Transaction tx-123 created for user 42
```

is readable by humans.

Structured logging:

```json id="7zq4j3"
{
    "timestamp": "2026-08-12T13:00:00.000Z",
    "level": "INFO",
    "message": "Transaction created",
    "transactionId": "tx-123",
    "userId": 42
}
```

is both human-readable and machine-queryable.

A logging platform can efficiently answer questions such as:

```text id="ml3aoz"
level = ERROR
AND transactionId = "tx-123"
```

or:

```text id="b5e88g"
service = "ledger-api"
AND durationMs > 1000
```

without relying on fragile string parsing.

---

## Metadata

Logging functions should allow contextual information to travel with the event.

```javascript id="9t91jo"
logger.info("Transaction created", {
    transactionId,
    accountId,
    durationMs
});
```

Producing:

```javascript id="09hpjg"
{
    timestamp: "...",
    level: "INFO",
    message: "Transaction created",
    transactionId: "tx-123",
    accountId: "acct-42",
    durationMs: 37
}
```

Metadata turns logs from messages into queryable evidence.

---

## Log Levels

A useful severity hierarchy might be:

```text id="fzme76"
TRACE
  │
DEBUG
  │
INFO
  │
WARN
  │
ERROR
  │
FATAL
```

Typical intent:

| Level | Purpose                                         |
| ----- | ----------------------------------------------- |
| TRACE | Extremely detailed execution information        |
| DEBUG | Diagnostic information for developers           |
| INFO  | Normal meaningful application events            |
| WARN  | Unexpected condition that may require attention |
| ERROR | Operation failed                                |
| FATAL | Application cannot safely continue              |

The exact names matter less than using them consistently.

---

## Log Filtering

A logger can define a minimum severity.

```javascript id="h9nz2t"
const levels = [
    "trace",
    "debug",
    "info",
    "warn",
    "error",
    "fatal"
];
```

If production is configured for:

```text id="3hp43k"
WARN
```

then:

```text id="25v3k2"
TRACE  ✗
DEBUG  ✗
INFO   ✗
WARN   ✓
ERROR  ✓
FATAL  ✓
```

Filtering reduces unnecessary volume while retaining important events.

---

## Correlation IDs

A single request may cross many components.

```text id="ugwsm6"
Client
  │
  │ correlationId=abc123
  ▼
API
  │
  ▼
Account Service
  │
  ▼
Queue
  │
  ▼
Ledger Worker
  │
  ▼
Database
```

If every component records:

```javascript id="j6l93s"
{
    correlationId: "abc123"
}
```

an engineer can reconstruct the complete logical workflow.

Without correlation:

```text id="g1p86n"
Thousands of unrelated events
```

With correlation:

```text id="hqjxlo"
abc123 → API
abc123 → Account Service
abc123 → Queue
abc123 → Worker
abc123 → Database
```

Correlation converts distributed events into a coherent investigation path.

---

## Metrics

Metrics represent numeric measurements over time.

Examples:

```text id="scxw9d"
request_count
error_rate
response_time
memory_usage
cpu_usage
queue_depth
active_connections
```

Metrics are particularly useful for identifying patterns.

For example:

```text id="b1x0ea"
Response Time

100ms ─────────────
120ms ─────────────
110ms ─────────────
950ms ───────────── ▲
1.2s  ───────────── ▲
1.4s  ───────────── ▲
```

Logs might explain individual slow requests.

Metrics reveal that the system itself is changing.

---

## Traces

A trace follows a logical operation across components.

```text id="r3nx05"
HTTP Request                 820ms
│
├── Authentication           20ms
│
├── Account Service          70ms
│
├── Ledger Service          690ms
│   │
│   ├── Database Query      650ms
│   └── Mapping              40ms
│
└── Response                 40ms
```

Immediately, the investigation has a target:

```text id="c0jbs1"
Database Query → 650ms
```

Tracing is especially valuable in distributed systems where one request crosses multiple service boundaries.

---

## Logs, Metrics, and Traces Together

Suppose users report intermittent slow requests.

### Metrics

Reveal:

```text id="cxm5nq"
p95 latency increased
```

### Traces

Reveal:

```text id="v5vx4k"
Database span accounts for most latency
```

### Logs

Reveal:

```text id="zav8r6"
Connection acquisition frequently exceeded 500ms
```

Now the investigation has evidence:

```text id="9t1f3u"
Symptom
   ↓
Measurement
   ↓
Location
   ↓
Context
   ↓
Hypothesis
```

This is much stronger than searching logs until something looks suspicious.

---

## Secrets and Sensitive Data

Observability systems frequently have:

* long retention periods,
* broad engineering access,
* third-party integrations,
* backups,
* exports.

Therefore this is dangerous:

```javascript id="ubgthn"
logger.info("Login", {
    username,
    password
});
```

So is:

```javascript id="8qq8e7"
logger.debug("Request", {
    authorization: req.headers.authorization
});
```

Never intentionally log:

* passwords,
* authentication tokens,
* API keys,
* private keys,
* connection-string credentials,
* sensitive personal data unless explicitly approved and appropriately protected.

Assume logs may eventually be viewed by someone who should not possess application secrets.

---

## Errors in Logs

Logging only this:

```javascript id="14ujc1"
logger.error("Request failed");
```

provides little diagnostic value.

Prefer useful context:

```javascript id="u1ikvv"
logger.error("Request failed", {
    requestId,
    accountId,
    operation: "createTransaction",
    error: error.message
});
```

Stack traces can be valuable for unexpected programmer errors.

But avoid logging the same failure at every layer.

```text id="e04cps"
Repository logs error
        │
Service logs same error
        │
Controller logs same error
        │
Global handler logs same error
```

One failure becomes four apparently independent failures.

Log where the information is most meaningful.

---

## Alerts

An alert is not simply a metric threshold.

An alert means:

> Someone may need to act.

Good alerts should generally correspond to meaningful operational conditions such as:

* sustained error-rate increase,
* readiness failure,
* queue backlog,
* latency exceeding service objectives,
* resource exhaustion.

Poor alerts create noise.

Noise teaches engineers to ignore alerts.

---

## Building the Logger Incrementally

The lesson's logger began with:

```javascript id="75t5h3"
function info(message) {
    console.info(message);
}
```

Then requirements justified additional capabilities:

```text id="wm5w6q"
Message
   │
   ▼
Timestamp + Level
   │
   ▼
Structured Metadata
   │
   ▼
Severity Filtering
   │
   ▼
Trace / Debug Support
```

The architecture grew because requirements grew.

Not because future requirements were imagined.

That distinction matters.

---

## Key APIs / Patterns

### Structured console output

```javascript id="ysv3h0"
console.info({
    timestamp: new Date().toISOString(),
    level: "INFO",
    message: "Application started"
});
```

### Process memory

```javascript id="0zdj4m"
process.memoryUsage();
```

### High-resolution timing

```javascript id="l1oj5m"
const start = process.hrtime.bigint();
```

### Stack capture

```javascript id="3a2ubg"
new Error().stack;
```

---

## Best Practices

* Prefer structured logs over formatted strings.
* Include useful contextual metadata.
* Propagate correlation identifiers across system boundaries.
* Define log-level semantics consistently.
* Measure meaningful system behavior rather than everything possible.
* Never expose secrets through observability data.
* Avoid duplicate logging of the same error.
* Alert on actionable conditions.
* Consider observability during system design rather than after production failure.
* Add instrumentation when it answers a real operational question.

---

## Common Mistakes

❌ Treating logging and observability as the same thing.

❌ Logging plain strings that require parsing later.

❌ Logging every possible piece of information.

❌ Logging secrets or authentication credentials.

❌ Generating a new correlation ID at every service boundary.

❌ Logging the same exception repeatedly as it propagates.

❌ Alerting on conditions nobody needs to act upon.

❌ Collecting metrics without knowing what question they answer.

❌ Building a sophisticated logging framework before the application needs one.

---

## Engineering Takeaways

* Production systems should provide evidence about their own behavior.
* Different observability signals answer different questions.
* Instrumentation should support decisions rather than merely generate data.
* Context turns raw events into useful evidence.
* Observability must be designed across system boundaries.
* Security requirements apply to diagnostic data too.
* Operational visibility is part of application architecture.
* Complexity in tooling should grow alongside demonstrated requirements.

---

## Interview Questions

**What is the difference between logs, metrics, and traces?**

Logs record discrete events and their context. Metrics measure numeric behavior over time. Traces follow individual operations across components and show where time and failures occur.

---

**Why is structured logging preferable to plain-text logging?**

Structured logs expose fields that logging systems can index, filter, aggregate, and query directly without relying on parsing human-formatted strings.

---

**Why are correlation IDs useful?**

They allow events from the same logical operation to be associated across asynchronous operations and service boundaries.

---

**What makes a good production metric?**

A good metric measures behavior relevant to system health, performance, capacity, or business operation and supports a meaningful engineering decision.

---

**What makes a good alert?**

A good alert identifies an actionable condition where human intervention may be required. Alerts that do not require action create noise.

---

**Why should secrets never appear in logs?**

Logs frequently have broader access, longer retention, and different security boundaries than the systems holding the original secret. Logging a secret creates additional uncontrolled copies of sensitive information.

---

**Should every error be logged where it is caught?**

No. Logging the same error at multiple layers creates duplication and can distort operational metrics. Errors should generally be logged where sufficient context exists to make the event meaningful.

---

## Related Lessons

* [Lesson 5 — Errors, Exceptions, and Asynchronous Error Handling](./lesson-05-error-handling.md)
* [Lesson 8 — Environment Variables, Configuration, and Secrets](./lesson-08-configuration.md)
* [Lesson 11 — Performance, Profiling, and Memory](./lesson-11-performance.md)
* [Lesson 12 — Debugging Like a Systems Engineer](./lesson-12-debugging.md)
* [Lesson 15 — Production Readiness](./lesson-15-production-readiness.md)

---

## Remember

> Production systems should provide evidence about their own behavior.

---

## Jason's Notes

Most of the individual observability concepts in this lesson were familiar from production work. I had implemented logging, monitoring, correlation, and diagnostics across multiple systems before beginning the lesson.

The more valuable learning came from how the logger was developed.

My first implementation introduced only what the exercise required. When additional requirements appeared—structured metadata, filtering, trace information—the implementation grew to support them.

At one point I deliberately resisted introducing an enum for log levels because it solved a problem the logger did not yet have. That small decision became a concrete example of a larger engineering discipline:

> Every abstraction must pay rent.

The lesson therefore changed less about how I think about observability and more about how I approach building the infrastructure that supports it: start with the operational question, add the smallest mechanism that answers it, and allow complexity to grow only when new requirements justify it.
