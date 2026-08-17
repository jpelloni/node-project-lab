# Semester 1 — Node Foundations Cheat Sheet

> A rapid review of the Node.js runtime and the engineering principles developed during Semester 1.

---

## 1 — Understanding the Node Runtime

```text
JavaScript
    ↓
V8
    ↓
Node.js APIs + libuv
    ↓
Operating System
```

* **V8** executes JavaScript.
* **Node.js** provides runtime APIs such as `fs`, `http`, `process`, and `Buffer`.
* **libuv** provides the Event Loop and cross-platform asynchronous I/O.
* The **operating system** ultimately performs the underlying I/O work.
* `process.cwd()` → where Node was started.
* `__dirname` → directory containing the current CommonJS module.

> **Remember:** Know which layer owns the behavior you're debugging.

---

## 2 — npm, package.json, and Dependency Resolution

* `package.json` describes the project and its declared dependencies.
* `package-lock.json` records the resolved dependency graph.
* `node_modules` contains installed packages.
* npm resolves both **direct** and **transitive** dependencies.

```bash
npm install
npm ls
npm explain <package>
```

> **Remember:** The dependency graph is larger than `package.json`.

---

## 3 — The Node Module System

### CommonJS

```javascript
const module = require("./module");

module.exports = value;
```

### ES Modules

```javascript
import value from "./module.js";

export default value;
```

* Modules are cached after loading.
* Module resolution determines which file or package is loaded.
* CommonJS and ESM have different loading semantics.
* Avoid mixing module systems casually.

> **Remember:** A module system defines loading, boundaries, and dependency relationships—not just syntax.

---

## 4 — Event Loop, Concurrency, and Async I/O

JavaScript execution is primarily single-threaded.

That does **not** mean Node can only perform one operation at a time.

```text
JavaScript
    ↓
Event Loop
    ↓
Node/libuv/OS
    ↓
Async work
    ↓
Callback / Promise continuation
```

* I/O can progress outside the JavaScript execution thread.
* CPU-heavy JavaScript blocks the Event Loop.
* `Promise` does not automatically mean parallel execution.
* Worker Threads are useful for CPU-bound work.

> **Remember:** Don't block the Event Loop.

---

## 5 — Errors and Asynchronous Error Handling

Synchronous:

```javascript
try {
    operation();
} catch (error) {
    // handle
}
```

Async:

```javascript
try {
    await operation();
} catch (error) {
    // handle
}
```

* Errors should carry useful context.
* Catch errors where you can meaningfully handle them.
* Do not silently swallow failures.
* Expected operational failures and programmer errors are different categories.

> **Remember:** Catch an error because you can do something useful with it.

---

## 6 — Streams, Buffers, and Backpressure

### Buffer

Represents binary data.

```javascript
const buffer = Buffer.from("hello");
```

### Stream

Processes data incrementally instead of loading everything into memory.

```text
Producer → Stream → Consumer
```

### Backpressure

```text
Fast Producer
      ↓
Slow Consumer
      ↓
"Slow down"
```

Backpressure prevents an overwhelmed consumer from causing uncontrolled memory growth.

> **Remember:** Don't consume data faster than the next stage can handle it.

---

## 7 — Processes, Child Processes, and Worker Threads

### Child Process

Separate process and memory space.

Useful for:

* external commands,
* process isolation,
* independent programs.

### Worker Thread

Separate JavaScript execution thread within the process.

Useful for:

* CPU-intensive JavaScript.

```text
I/O-bound → async APIs
CPU-bound → consider Worker Threads
External program → Child Process
```

> **Remember:** Choose concurrency based on the type of work.

---

## 8 — Environment Variables, Configuration, and Secrets

```javascript
process.env.DATABASE_URL;
```

Configuration should:

* be validated at startup,
* fail fast when required values are missing,
* separate environment-specific values from code.

Never commit:

* passwords,
* tokens,
* API keys,
* private keys,
* credentials.

> **Remember:** Configuration determines behavior; secrets require stronger protection than ordinary configuration.

---

## 9 — npm Packages, Semantic Versioning, and Publishing

Semantic versioning:

```text
MAJOR.MINOR.PATCH
```

```text
MAJOR → breaking change
MINOR → backward-compatible feature
PATCH → backward-compatible fix
```

Ranges matter:

```text
1.2.3
^1.2.3
~1.2.3
```

Publishing creates a contract with consumers.

> **Remember:** Once someone depends on your package, your changes impose costs on them.

---

## 10 — Observability, Logging, and Diagnostics

Three major signals:

```text
Logs    → What happened?
Metrics → How much / how often?
Traces  → Where did it happen?
```

Prefer structured logs:

```javascript
logger.info("Transaction created", {
    transactionId,
    durationMs
});
```

Use correlation IDs to connect distributed work.

Never log secrets.

Alerts should indicate conditions requiring action.

> **Remember:** Production systems should provide evidence about their own behavior.

---

## 11 — Performance, Profiling, and Memory

### Benchmarking

> How long did it take?

```javascript
const start = process.hrtime.bigint();

operation();

const ms =
    Number(process.hrtime.bigint() - start) / 1_000_000;
```

### Profiling

> Where was the time/resource spent?

### Memory Leak

Not:

> Uses lots of memory.

Instead:

> Retains memory that is no longer useful.

```text
Measure
   ↓
Profile
   ↓
Hypothesize
   ↓
Change
   ↓
Measure Again
```

> **Remember:** Measure before optimizing. Then measure again.

---

## 12 — Debugging Like a Systems Engineer

```text
Symptom
   ↓
Evidence
   ↓
Hypothesis
   ↓
Experiment
   ↓
Observation
   ↓
Conclusion
```

A good hypothesis is:

* specific,
* plausible,
* testable,
* falsifiable.

Change **one meaningful variable at a time**.

Node Inspector:

```bash
node --inspect app.js
node --inspect-brk app.js
```

And:

> Don't make the hypothesis bigger than the experiment can test.

> **Remember:** Become attached to evidence, not hypotheses.

---

## 13 — Dependencies, Technical Debt, and Build vs. Buy

Before installing:

```text
What problem does this solve?
Can we reasonably build it?
Should we own that implementation?
Is the package healthy?
What dependencies does it introduce?
What security risk does it introduce?
```

Useful commands:

```bash
npm ls
npm explain <package>
npm outdated
npm audit
npm view <package>
```

Watch for supply-chain risks such as **typosquatting**.

> **Remember:** A dependency doesn't eliminate ownership. It changes what you own.

---

## 14 — Testing as an Engineering Discipline

Test:

```text
Behavior
```

not:

```text
Implementation details
```

### Test Types

```text
Unit        → Does this unit behave correctly?
Integration → Do these components work together?
E2E         → Does the workflow work?
Load        → Does it work under demand?
Chaos       → Does it survive failure conditions?
```

Coverage answers:

> Did this code execute?

It does **not** answer:

> Did we test it correctly?

Mock external boundaries deliberately.

Avoid building layers of mocks that recreate the application.

> **Remember:** Coverage tells you what ran. Tests should tell you what works.

---

## 15 — Production Readiness

### Liveness

```http
GET /health/live
```

> Should this process remain alive?

### Readiness

```http
GET /health/ready
```

> Should this instance receive work?

### Graceful Shutdown

```text
Signal
   ↓
Stop accepting work
   ↓
Drain / cancel work
   ↓
Release dependencies
   ↓
Exit
```

Handle:

```javascript
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
```

External operations need **timeouts**.

Cancellation:

```javascript
const controller = new AbortController();

controller.abort();
```

Shutdown also needs a deadline.

> **Remember:** A service must know how to start, prove it is ready, bound its waiting, and stop safely.

---

## 16 — Thinking Like a Senior Node Engineer

The complete investigation loop:

```text
Observe
   ↓
Measure
   ↓
Gather Evidence
   ↓
Form Hypotheses
   ↓
Rank
   ↓
Experiment
   ↓
Verify
   ↓
Deploy Safely
   ↓
Monitor
   ↓
Learn
```

For production incidents:

1. Define the exact symptom.
2. Gather identifiers and timestamps.
3. Follow logs, metrics, and traces.
4. Separate evidence from assumptions.
5. Create specific hypotheses.
6. Rank them.
7. Design controlled experiments.
8. Reproduce the conditions that exposed the failure.
9. Test the actual failure mode.
10. Deploy using a strategy appropriate to the risk.
11. Improve monitoring, tests, documentation, or process afterward.

> **Remember:** Senior engineering is not knowing the answer first. It is knowing how to reach a trustworthy answer.

---

# Node Diagnostic Toolbox

```bash
# Dependencies
npm ls
npm explain <package>
npm outdated
npm audit
npm view <package>

# Runtime debugging
node --inspect app.js
node --inspect-brk app.js

# Profiling
node --cpu-prof app.js
node --heap-prof app.js

# Testing
node --test
```

Useful runtime APIs:

```javascript
process.cwd();
process.memoryUsage();
process.cpuUsage();
process.hrtime.bigint();
process.on("SIGTERM", handler);

new Error().stack;

AbortSignal.timeout(5000);
```

---

# The Semester 1 Engineering Loop

When something goes wrong:

```text
What do I KNOW?
      ↓
What do I SUSPECT?
      ↓
What evidence is MISSING?
      ↓
What experiment reduces uncertainty?
      ↓
What does the result actually prove?
      ↓
What is the smallest justified change?
      ↓
How will I prove it worked?
```

---

# Engineering Principles

* Learn from first principles.
* Build before using libraries.
* Measure before optimizing.
* Gather evidence before changing code.
* Test behavior, not implementation.
* Every abstraction must pay rent.
* Every dependency is a maintenance decision.
* Design for production, not just development.
* Simplicity scales.
* A metric is evidence only for what it actually measures.
* Good engineers become attached to evidence, not hypotheses.
* Complexity must be earned by demonstrated requirements.

---

# The Jason Rule™

```text
Do we actually need this?
        │
        ├── No → Don't build it.
        │
        └── Yes
             │
             ▼
      What's the simplest
      thing that solves it?
```

Or, in its evolved Semester 1 form:

> **Complexity must earn its way into the system.**

---

# Final Mental Model

The recurring enemy throughout Semester 1 was not complexity, dependencies, abstraction, optimization, or clever engineering.

It was **certainty without sufficient evidence**.

```text
Optimization without measurement
Diagnosis without evidence
Abstraction without requirements
Dependencies without evaluation
Coverage without confidence
Deployment without lifecycle design
```

The corrective habit is simple:

> **Understand first. Measure second. Change third. Verify always.**
