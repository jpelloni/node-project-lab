# Lesson 14 — Testing as an Engineering Discipline

## Purpose

Understand testing as a method for verifying software behavior rather than maximizing coverage, how test boundaries affect maintainability, when mocking is appropriate, and how architecture influences the quality and usefulness of a test suite.

> 📖 **Learning Journal**
>
> See the exercises, reflections, and code reviews for this lesson:
>
> → [Lesson 14 Journal](../../journal/semester-1/lesson-14.md)

---

## Core Concepts

* Tests should verify observable behavior rather than internal implementation details.
* Code coverage measures which code executed during tests, not whether the tests correctly verify behavior.
* Tests should fail when behavior becomes incorrect.
* Good tests remain valid when implementation changes but behavior does not.
* Unit, integration, and end-to-end tests answer different questions.
* Mocking is useful for isolating boundaries but harmful when it recreates large portions of the system.
* Excessive mocking can produce tests that verify the mocks rather than the application.
* Deterministic tests avoid uncontrolled dependencies on time, randomness, networks, or external state.
* Good architecture naturally creates useful testing boundaries.
* Test quality should be evaluated by the confidence the suite provides.

---

## Mental Model

A test establishes a behavioral contract:

```text
Given
  │
  ▼
Known Conditions
  │
  ▼
Execute Behavior
  │
  ▼
Observe Result
  │
  ▼
Does it satisfy
the contract?
```

The test should care primarily about:

```text
Input → Observable Behavior → Output
```

not:

```text
Input
  ↓
Internal Function A
  ↓
Internal Function B
  ↓
Private Variable C
  ↓
Implementation Detail D
```

If the implementation can change without changing behavior, the test should ideally continue passing.

---

## Quick Reference

| Test Type          | Primary Question                                     |
| ------------------ | ---------------------------------------------------- |
| Unit               | Does this unit behave correctly?                     |
| Integration        | Do these components work together correctly?         |
| End-to-End         | Does the complete workflow behave correctly?         |
| Load               | Does the system behave correctly under demand?       |
| Chaos / Resilience | Does the system handle failure conditions correctly? |

### Healthy Testing Direction

```text
Behavior
   │
   ▼
Test
```

### Brittle Testing Direction

```text
Implementation
      │
      ▼
    Test
      │
      ▼
Refactor breaks test
despite unchanged behavior
```

---

## Behavior vs. Implementation

Consider a logger.

A useful behavioral test might verify:

```javascript
test("logger.info writes an INFO payload", () => {
    // ...

    logger.info("User created", {
        userId: 123
    });

    assert.equal(payload.level, "INFO");
    assert.equal(payload.message, "User created");
    assert.equal(payload.userId, 123);
    assert.match(
        payload.timestamp,
        /^\d{4}-\d{2}-\d{2}T/
    );
});
```

The contract is:

```text
INFO log
   │
   ├── correct level
   ├── correct message
   ├── supplied metadata
   └── valid timestamp
```

The test does not require one exact timestamp value or care how the object was constructed.

---

## Brittle Tests

Compare:

```javascript
assert.deepStrictEqual(calls[0], {
    timestamp: new Date().toISOString(),
    level: "INFO",
    message: "This is an info message"
});
```

This test has multiple problems.

### Time Dependency

These calls occur at different moments:

```javascript
logger.info(...);
new Date().toISOString();
```

Even a tiny difference can fail the test.

### Exact Shape Dependency

Suppose the logger legitimately adds:

```javascript
service: "ledger-api"
```

The public behavior may still be correct, but exact object equality fails.

The test is now enforcing implementation shape beyond the behavior it actually needs to verify.

---

## Test the Contract

Instead of asking:

> Did the implementation construct exactly the object I imagined?

ask:

> What must be true for this behavior to be correct?

For the logger:

```javascript
assert.equal(payload.level, "INFO");
assert.equal(payload.message, message);
assert.match(payload.timestamp, timestampPattern);
```

This makes the test strict about the contract while flexible about irrelevant implementation details.

Good tests are not less rigorous.

They are rigorous about the **right things**.

---

## Code Coverage

Coverage tools can tell us:

```text
Line 1   ✓
Line 2   ✓
Line 3   ✓
Line 4   ✓
Line 5   ✓
```

They cannot tell us:

```text
Was the correct result asserted?
Was the important edge case tested?
Would this test detect the bug?
Does this test describe useful behavior?
```

This test creates coverage:

```javascript
test("calculate", () => {
    calculateTotal(items);
});
```

but verifies nothing.

The code executed.

That does not mean it was correct.

---

## Coverage Is Still Useful

Coverage is valuable as a diagnostic tool.

For example:

```text
Critical validation branch
        │
        ▼
Never executed by tests
```

That is useful information.

Coverage can reveal:

* untested branches,
* forgotten error paths,
* suspicious gaps,
* dead code.

The problem occurs when:

```text
95% coverage
```

becomes equivalent to:

```text
95% confidence
```

Those numbers measure different things.

---

## Test Failure Behavior

Sometimes the behavior under test is:

> Does this operation throw?

A simple helper might be:

```javascript
function expectThrows(fn) {
    const response = {
        threw: false,
        error: null
    };

    try {
        fn();
    } catch (error) {
        response.threw = true;
        response.error = error;
    }

    return response;
}
```

Then:

```javascript
const result = expectThrows(() => {
    throw new Error("Boom");
});

assert.equal(result.threw, true);
assert.equal(result.error.message, "Boom");
```

The important part is not merely that *an* exception occurred.

Tests should verify the failure contract when that distinction matters.

Node's built-in assertion library already provides this capability:

```javascript
assert.throws(
    () => operation(),
    /Boom/
);
```

Build the simple mechanism to understand the behavior; use the platform capability once you understand what it provides.

---

## Unit Tests

Unit tests isolate a small behavioral boundary.

For example:

```text
calculateFee()
     │
     ▼
Known input
     │
     ▼
Expected result
```

Good candidates include:

* business rules,
* transformations,
* validation,
* calculations,
* deterministic decision logic.

Unit tests should generally be:

* fast,
* deterministic,
* focused,
* independent.

---

## Integration Tests

Integration tests verify that components work together.

For example:

```text
Account Service
      │
      ▼
Repository
      │
      ▼
Database
```

They answer questions unit tests cannot:

```text
Does the query actually work?
Does serialization match?
Does the database constraint behave as expected?
Does configuration connect correctly?
```

Mocks cannot prove that real integrations work.

---

## End-to-End Tests

End-to-end tests exercise a complete externally visible workflow.

```text
HTTP Request
     │
     ▼
Controller
     │
     ▼
Service
     │
     ▼
Repository
     │
     ▼
Database
     │
     ▼
HTTP Response
```

They provide high confidence that the system works as a whole.

But they are usually:

* slower,
* harder to diagnose,
* more expensive to maintain.

They complement rather than replace lower-level tests.

---

## Mocking

Mocks are useful when the test should isolate a boundary.

Suppose:

```text
Payment Service
      │
      ▼
External Payment API
```

A unit test should not make real financial transactions.

Mocking the external boundary is appropriate.

```text
Payment Service
      │
      ▼
Mock Payment API
```

Now the test can simulate:

* success,
* rejection,
* timeout,
* invalid response.

---

## When Mocking Becomes Harmful

Consider:

```text
Controller
   │
 Mock Service
   │
 Mock Repository
   │
 Mock Database
   │
 Mock Driver
```

Eventually the test may prove only that:

> The mocks behave the way we configured the mocks to behave.

This creates false confidence.

A warning sign is when test setup recreates large portions of the application's architecture.

At that point, an integration test may be simpler and more valuable.

---

## Mock at Boundaries

A useful rule is:

> Mock things your unit does not own.

Examples:

```text
Your Business Logic
        │
        ├── External HTTP API → mock
        ├── Clock → control
        ├── Randomness → control
        └── Message Publisher → mock
```

But if you repeatedly mock every internal class solely because the architecture makes them impossible to instantiate together, the architecture itself may deserve examination.

---

## Deterministic Tests

A deterministic test produces the same result from the same conditions.

Dangerous:

```javascript
const now = new Date();
```

inside logic being tested when exact time affects behavior.

Better designs may inject a clock:

```javascript
function isExpired(expiration, now) {
    return expiration < now;
}
```

The test controls both:

```javascript
const now =
    new Date("2026-08-13T12:00:00Z");
```

The principle applies to:

* time,
* randomness,
* network responses,
* generated IDs,
* environment state.

Control nondeterministic boundaries when they affect the contract.

---

## Architecture and Testability

Suppose business logic directly performs:

```text
Business Logic
   ├── Read process.env
   ├── Call database
   ├── Call HTTP API
   ├── Read current time
   └── Generate random ID
```

Testing becomes difficult because everything is coupled.

Instead:

```text
Business Logic
      │
      ├── Config
      ├── Repository
      ├── API Client
      ├── Clock
      └── ID Generator
```

Now boundaries can be controlled independently.

This is not architecture **for the sake of tests**.

It is evidence that responsibilities have been separated clearly.

Testability is often a side effect of good design.

---

## Testing Errors

Do not test only happy paths.

For example:

```text
createTransaction()
      │
      ├── Valid transaction
      ├── Invalid amount
      ├── Account missing
      ├── Duplicate request
      └── Repository failure
```

Failure behavior is part of the application's contract.

Tests should verify:

* expected error type,
* relevant error information,
* state remains valid,
* side effects did or did not occur as required.

---

## Tests as Documentation

A well-written test explains expected behavior.

For example:

```javascript
test(
    "rejects a withdrawal that would exceed the available balance",
    () => {
        // ...
    }
);
```

This communicates more than:

```javascript
test("withdrawal test 3", () => {
    // ...
});
```

A future developer should be able to understand the rule being protected without first reverse-engineering the implementation.

---

## TDD

Test-Driven Development is commonly summarized as:

```text
Red
 │
 ▼
Write failing test
 │
 ▼
Green
 │
 ▼
Write smallest implementation that passes
 │
 ▼
Refactor
 │
 ▼
Repeat
```

The deeper idea is not:

> Tests must always be written first.

It is:

> Define the behavior before allowing implementation details to dominate the design.

Thinking in terms of behavioral contracts makes TDD easier to understand because the test describes what must become true.

---

## Choosing the Right Test

Ask:

```text
What risk am I trying to reduce?
          │
          ├── Logic wrong?
          │      └── Unit
          │
          ├── Components incompatible?
          │      └── Integration
          │
          ├── Workflow broken?
          │      └── End-to-End
          │
          ├── Capacity failure?
          │      └── Load
          │
          └── Failure handling broken?
                 └── Resilience / Chaos
```

Do not add a test type simply because it exists.

Choose the test that provides evidence about the risk.

---

## Key APIs / Commands

### Node test runner

```javascript
const test = require("node:test");
```

### Assertions

```javascript
const assert = require("node:assert");
```

### Equality

```javascript
assert.equal(actual, expected);
```

### Deep equality

```javascript
assert.deepStrictEqual(actual, expected);
```

### Pattern matching

```javascript
assert.match(value, /pattern/);
```

### Exception assertion

```javascript
assert.throws(() => operation());
```

### Async rejection assertion

```javascript
await assert.rejects(
    async () => operation()
);
```

### Run tests

```bash
node --test
```

---

## Best Practices

* Test behavior rather than implementation details.
* Identify the contract before writing assertions.
* Keep unit tests focused and deterministic.
* Use integration tests for real component boundaries.
* Use end-to-end tests for critical workflows.
* Mock external or nondeterministic boundaries deliberately.
* Avoid deep layers of mocks.
* Test important failure behavior.
* Use coverage to find gaps, not define quality.
* Write test names that describe the behavior being protected.
* Refactor tests when they become unnecessarily coupled to implementation.

---

## Common Mistakes

❌ Treating high coverage as proof of test quality.

❌ Testing private implementation details.

❌ Using exact timestamps when only timestamp validity matters.

❌ Mocking every dependency regardless of test purpose.

❌ Writing tests that reproduce the implementation.

❌ Testing only successful behavior.

❌ Making tests depend on real current time or uncontrolled randomness.

❌ Using only unit tests to verify integrations.

❌ Using only end-to-end tests because they appear more realistic.

❌ Keeping brittle tests because changing tests feels dangerous.

---

## Engineering Takeaways

* Tests are executable behavioral contracts.
* Confidence matters more than coverage percentage.
* A test should fail for the right reason.
* Test boundaries should correspond to architectural boundaries.
* Excessive mocking can hide integration failures.
* Determinism makes failures meaningful.
* Failure behavior deserves the same design attention as successful behavior.
* Good architecture tends to produce code that is naturally easier to test.
* Testing is a design discipline, not merely a release gate.

---

## Interview Questions

**Why isn't high code coverage the same as high test quality?**

Coverage measures which code executed during the test suite. It does not determine whether meaningful behavior was asserted or whether the tests would detect incorrect behavior.

---

**Why should tests verify behavior instead of implementation?**

Because implementation can legitimately change while the external contract remains the same. Behavior-focused tests allow refactoring without unnecessarily rewriting the test suite.

---

**When is mocking useful?**

Mocking is useful when isolating a unit from external, expensive, nondeterministic, or dangerous dependencies.

---

**When does mocking become harmful?**

When mocks reproduce large portions of the system, couple tests tightly to implementation details, or allow tests to pass without verifying that real components integrate correctly.

---

**Why does good architecture often improve testability?**

Clear responsibility and dependency boundaries allow components to be exercised independently without requiring unrelated infrastructure or state.

---

**What is the role of code coverage?**

Coverage is a diagnostic tool that identifies which code paths were executed by tests. It can reveal testing gaps but should not be treated as a direct measure of test quality.

---

**What is TDD trying to accomplish?**

TDD uses failing tests to define desired behavior before implementation, then introduces the smallest implementation needed to satisfy that behavior and refactors while preserving the contract.

---

## Related Lessons

* [Lesson 5 — Errors, Exceptions, and Asynchronous Error Handling](./lesson-05-error-handling.md)
* [Lesson 9 — npm Packages, Semantic Versioning, and Publishing](./lesson-09-package-publishing.md)
* [Lesson 12 — Debugging Like a Systems Engineer](./lesson-12-debugging.md)
* [Lesson 15 — Production Readiness](./lesson-15-production-readiness.md)
* [Lesson 16 — Thinking Like a Senior Node Engineer](./lesson-16-capstone.md)

---

## Remember

> Coverage tells you what ran. Tests should tell you what works.

---

## Jason's Notes

The biggest change in perspective from this lesson was realizing that I had historically treated code coverage as a stronger measure of test quality than it actually is.

A coverage report proves that code executed during the test suite. It does not prove that the test verified the correct behavior.

The logger exercise made the distinction concrete. An exact object comparison looked rigorous but was actually brittle because it depended on an exact timestamp and exact object shape. Testing the behavioral contract—correct level, message, metadata, and a valid timestamp—was both more resilient and more meaningful.

The discussion of mocking also clarified a boundary I had used intuitively before: mocks are valuable for isolating units, but when the mock chain becomes several layers deep, the test begins validating an artificial version of the system.

Most importantly, the lesson gave me a clearer understanding of TDD. Thinking of tests as behavioral contracts makes the red-green-refactor cycle much more meaningful than simply "write the test before the code."

The objective isn't coverage.

It is confidence that the software behaves correctly.
