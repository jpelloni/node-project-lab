# Lesson 12 — Debugging Like a Systems Engineer

## Purpose

Develop a disciplined debugging process based on reproduction, evidence, testable hypotheses, controlled experiments, and appropriate diagnostic tooling rather than intuition-driven code changes.

> 📖 **Learning Journal**
>
> See the exercises, reflections, and code reviews for this lesson:
>
> → [Lesson 12 Journal](../../journal/semester-1/lesson-12.md)

---

## Core Concepts

* Debugging is an investigation, not a sequence of guesses.
* Symptoms describe observable behavior; they do not identify the cause.
* Reproduction provides a controlled environment for testing hypotheses.
* Evidence should be gathered before changing code.
* A useful hypothesis must be specific and testable.
* Experiments should change one meaningful variable at a time.
* Evidence against a hypothesis is as valuable as evidence supporting one.
* Missing evidence is information that would help distinguish competing explanations.
* Node's Inspector Protocol provides runtime debugging and profiling capabilities.
* Explaining a problem forces assumptions into explicit statements that can be examined.

---

## Mental Model

A disciplined debugging investigation looks like:

```text
Symptom
   │
   ▼
Gather Evidence
   │
   ▼
Form Hypotheses
   │
   ▼
Rank Hypotheses
   │
   ▼
Design Experiment
   │
   ▼
Change One Variable
   │
   ▼
Observe Result
   │
   ├── Supports hypothesis
   │
   ├── Weakens hypothesis
   │
   └── Reveals new evidence
   │
   ▼
Repeat
```

The goal is not to prove the first hypothesis correct.

The goal is to progressively eliminate uncertainty.

---

## Quick Reference

| Concept          | Question                                              |
| ---------------- | ----------------------------------------------------- |
| Symptom          | What can we observe?                                  |
| Evidence         | What do we actually know?                             |
| Hypothesis       | What specific cause could explain it?                 |
| Missing Evidence | What information would distinguish explanations?      |
| Experiment       | What can we change or measure to test the hypothesis? |
| Conclusion       | What does the experiment allow us to say?             |

A useful debugging statement looks like:

```text
Because we observed X,
we suspect Y.

If Y is true,
then changing/measuring Z
should produce result A.

If result A does not occur,
Y becomes less likely.
```

That is much stronger than:

```text
Maybe it's the database.
```

---

## Symptoms Are Not Causes

Suppose users report:

```text
Feed requests intermittently time out.
```

That is a symptom.

Possible causes include:

```text
Memory pressure
CPU saturation
Database latency
Connection exhaustion
Cache latency
External API delay
Event Loop blocking
Network congestion
```

The symptom alone does not justify changing any of them.

A useful investigation begins by asking:

> What evidence would distinguish these possibilities?

---

## Evidence

Evidence consists of observations that are actually known.

For example:

```text
Symptoms:
- Feed requests intermittently time out.

Evidence:
- Failures increase during heavy traffic.
- Users following more accounts experience the problem more often.
- Memory and CPU show spikes near some failures.
```

These observations may support several hypotheses.

They do not yet prove one.

---

## Missing Evidence vs. Contradictory Evidence

This distinction matters.

Suppose the hypothesis is:

> The Lambda function is running out of memory.

Then:

```text
No cache errors observed
```

is not necessarily **missing evidence**.

It is evidence that weakens a cache-failure hypothesis.

Missing evidence for the memory hypothesis might instead be:

```text
- Memory usage immediately before timeout
- Lambda memory limit
- Garbage-collection activity
- Invocation duration
- Whether failed invocations approach the configured limit
- Whether increasing memory changes failure frequency
```

A useful rule:

> Missing evidence is information you wish you had. Contradictory evidence is information you already have that makes an explanation less likely.

---

## Hypotheses

A debugging hypothesis should be:

* specific,
* plausible,
* connected to existing evidence,
* testable,
* falsifiable.

Weak:

```text
Something is wrong with memory.
```

Better:

```text
Under heavy load, retained feed data causes the Lambda
to approach its configured memory limit, increasing
garbage-collection pressure and causing request latency
to exceed the timeout.
```

Now we know what to measure.

---

## Rank Hypotheses

Not every explanation deserves equal investigation time.

Consider:

```text
1. Connection pool exhaustion
2. Event consumer backlog
3. External API throttling
4. Network latency
5. Cosmic ray flipped a bit
```

All may technically be possible.

They are not equally probable.

Ranking should consider:

```text
Evidence fit
    +
Likelihood
    +
Ease of testing
    +
Potential impact
```

Start with explanations that best fit the evidence, not merely the most interesting explanations.

---

## Reproduction

Reproduction turns an unpredictable production problem into something that can be investigated repeatedly.

A useful reproduction should preserve the conditions relevant to the failure.

For example:

```text
Production failure
      │
      ├── Heavy traffic
      ├── Large user feed
      ├── Concurrent requests
      └── Memory pressure
              │
              ▼
       Test Environment
              │
              ├── Generate load
              ├── Large datasets
              ├── Similar concurrency
              └── Capture metrics
```

A reproduction that removes the condition causing the problem may produce a false sense of correctness.

---

## Change One Variable at a Time

Suppose a request is slow.

Changing all of these simultaneously:

```text
Increase memory
Increase CPU
Change query
Add cache
Increase connection pool
```

and seeing improvement tells us very little.

Instead:

```text
Baseline
   │
   ▼
Change connection pool
   │
   ▼
Measure
```

Then:

```text
New baseline
   │
   ▼
Change query
   │
   ▼
Measure
```

Controlled experiments preserve causality.

If five things change and the problem disappears, you do not know which change fixed it—or which four were unnecessary.

---

## Debugging Without Changing Code

Not every investigation should begin with a code edit.

Before changing implementation, inspect:

```text
Logs
Metrics
Traces
Configuration
Runtime state
Network behavior
Database behavior
Queue depth
Resource utilization
Deployment differences
```

Production systems often already contain evidence capable of narrowing the problem significantly.

The first debugging tool should often be observation.

---

## Node Inspector Protocol

Node supports the V8 Inspector Protocol.

Start an application with:

```bash
node --inspect app.js
```

Or pause before application code begins:

```bash
node --inspect-brk app.js
```

This allows compatible debugging tools to inspect the running process.

Capabilities include:

* breakpoints,
* stepping,
* variable inspection,
* call stacks,
* CPU profiling,
* heap inspection.

The important shift is from:

```text
Add console.log()
Restart
Guess
Repeat
```

toward direct runtime inspection.

---

## Breakpoints

A breakpoint pauses execution at a specific location.

This allows inspection of:

```text
Local variables
Function arguments
Call stack
Object state
Execution path
```

Breakpoints are particularly useful when the question is:

> How did the application reach this state?

rather than:

> Did this line execute?

---

## Conditional Breakpoints

Sometimes a failure occurs only for specific data.

Instead of stopping on every request:

```text
Breakpoint:
userId === "123"
```

or:

```text
Breakpoint:
balance < 0
```

This allows the debugger to stop only when the interesting state appears.

Conditional debugging can dramatically reduce noise when investigating intermittent behavior.

---

## Diagnostic Helpers

A small diagnostic wrapper can make execution flow visible:

```javascript
async function debugStep(name, fn) {
    console.info(`▶ ${name}`);

    const start = process.hrtime.bigint();

    try {
        const result = await fn();

        console.info(`✔ ${name}`);

        return result;
    } catch (error) {
        console.error(`❌ ${name} failed`, error);
        throw error;
    } finally {
        const durationMs =
            Number(process.hrtime.bigint() - start) / 1_000_000;

        console.info(
            `⏱ ${name}: ${durationMs.toFixed(3)} ms`
        );
    }
}
```

One subtle rule matters here:

```javascript
return fn();
console.info("success");
```

The second statement can never execute.

Once `return` executes, the function is finished.

Capture the result first when post-operation behavior is required.

---

## Preserve Failure Semantics

Diagnostic tooling should usually observe failures without changing their meaning.

This is dangerous:

```javascript
try {
    return await fn();
} catch (error) {
    console.error(error);
}
```

The original failure has now been swallowed.

The caller may believe the operation succeeded with:

```javascript
undefined
```

Prefer:

```javascript
try {
    return await fn();
} catch (error) {
    console.error(error);
    throw error;
}
```

Instrumentation should not accidentally alter application behavior.

---

## Rubber Duck Debugging

Explaining a problem aloud can expose assumptions.

For example:

```text
"The request enters here..."

"Then this function waits for..."

"Actually, why am I assuming that Promise
has completed before this executes?"
```

The benefit is not mystical.

Explanation forces implicit reasoning into explicit statements.

Once stated, assumptions become inspectable.

This works with:

* another engineer,
* a notebook,
* a whiteboard,
* a rubber duck,
* or an AI assistant.

The listener does not necessarily need to provide the answer.

---

## Production Debugging

Production debugging requires more caution than local debugging.

Avoid casually:

* attaching invasive debugging tools,
* pausing live processes,
* enabling extremely verbose logging,
* modifying production data,
* reproducing destructive operations.

Prefer evidence already available through:

```text
Logs
Metrics
Traces
Profiles
Request IDs
Deployment history
Configuration
```

If additional instrumentation is necessary, introduce it deliberately and safely.

---

## Debugging Distributed Systems

A failure may originate far from where it becomes visible.

```text
Client sees timeout
       │
       ▼
API waits
       │
       ▼
Service waits
       │
       ▼
Queue backed up
       │
       ▼
Consumer waits
       │
       ▼
Database connection pool exhausted
```

The API timeout is the symptom.

The database connection pool may be the cause.

This is why correlation, traces, and system-level reasoning matter.

---

## Key Commands / APIs

### Start Inspector

```bash
node --inspect app.js
```

### Break immediately on startup

```bash
node --inspect-brk app.js
```

### High-resolution timing

```javascript
process.hrtime.bigint();
```

### Stack trace

```javascript
new Error().stack;
```

### Runtime memory

```javascript
process.memoryUsage();
```

### Runtime CPU usage

```javascript
process.cpuUsage();
```

---

## Best Practices

* Describe the symptom before proposing a cause.
* Gather evidence before changing code.
* Separate known facts from assumptions.
* Form specific, falsifiable hypotheses.
* Rank hypotheses based on evidence.
* Reproduce the relevant failure conditions.
* Change one meaningful variable at a time.
* Preserve failure semantics when adding diagnostics.
* Use the Inspector when runtime state matters.
* Record what experiments disproved, not only what succeeded.
* Follow failures across system boundaries.

---

## Common Mistakes

❌ Treating the first plausible explanation as the root cause.

❌ Editing code before gathering evidence.

❌ Calling contradictory evidence "missing evidence."

❌ Changing several variables simultaneously.

❌ Reproducing the happy path instead of the failure conditions.

❌ Adding logging that changes program behavior.

❌ Swallowing errors inside diagnostic wrappers.

❌ Assuming the component reporting the error caused the error.

❌ Treating production as an unrestricted debugging environment.

❌ Continuing to defend a hypothesis after evidence contradicts it.

---

## Engineering Takeaways

* Debugging is uncertainty reduction.
* Evidence should determine which hypothesis survives.
* A failed experiment is useful if it eliminates an explanation.
* Reproduction quality determines investigation quality.
* Observability and debugging are complementary disciplines.
* Distributed systems require following causality across component boundaries.
* Diagnostic tooling should observe the system without changing its semantics.
* Good engineers become attached to evidence, not hypotheses.

---

## Interview Questions

**Why is reproducing a bug important?**

Reproduction creates a repeatable environment where hypotheses can be tested and changes can be compared against a known failing condition.

---

**What makes a good debugging hypothesis?**

It is specific, plausible, supported by available evidence, testable, and capable of being disproven.

---

**Why should you change one variable at a time?**

Because controlled changes allow the observed result to be associated with a specific intervention. Multiple simultaneous changes destroy that causal information.

---

**What is the difference between missing evidence and contradictory evidence?**

Missing evidence is information that has not yet been collected and would help evaluate a hypothesis. Contradictory evidence has already been observed and makes a hypothesis less likely.

---

**Why can explaining a bug aloud help?**

Explaining the execution path forces assumptions and reasoning into explicit statements, making inconsistencies easier to notice.

---

**What does `--inspect-brk` do?**

It starts Node with the Inspector enabled and pauses execution before application code begins, allowing a debugger to attach before the program proceeds.

---

**Should diagnostic code swallow errors?**

Generally no. Diagnostic instrumentation should observe failures while preserving the application's original failure semantics unless changing those semantics is explicitly intended.

---

## Related Lessons

* [Lesson 5 — Errors, Exceptions, and Asynchronous Error Handling](./lesson-05-error-handling.md)
* [Lesson 10 — Observability, Logging, and Diagnostics](./lesson-10-observability.md)
* [Lesson 11 — Performance, Profiling, and Memory](./lesson-11-performance.md)
* [Lesson 14 — Testing as an Engineering Discipline](./lesson-14-testing.md)
* [Lesson 15 — Production Readiness](./lesson-15-production-readiness.md)
* [Lesson 16 — Thinking Like a Senior Node Engineer](./lesson-16-capstone.md)

---

## Remember

> Gather evidence before changing code.

And when the evidence changes:

> Change your hypothesis before changing the evidence.

---

## Jason's Notes

The most useful part of this lesson was turning debugging practices I already used into a more explicit investigation process.

My initial production-timeout exercise started with a reasonable hypothesis: the Lambda function might be running out of memory. The important refinement was recognizing that "no cache errors" and "no DynamoDB read errors" were not missing evidence for that hypothesis. They were existing evidence that made other hypotheses less likely.

That distinction sharpened the process:

```text
What do I know?
What do I suspect?
What information am I missing?
What experiment would distinguish the possibilities?
```

The lesson also introduced the Node Inspector Protocol as a practical tool. I had frequently used logging and rubber-duck debugging, but had not appreciated how much runtime inspection Node exposes directly.

The larger takeaway was that debugging should not be a contest to see whether my first explanation was correct.

The objective is to progressively eliminate explanations until the remaining one is supported by evidence.
