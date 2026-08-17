# Lesson 5 — Errors, Exceptions, and Asynchronous Error Handling

## Purpose

Understand how Node.js represents and propagates failures, how synchronous and asynchronous error handling differ, and how to design errors that communicate enough information for the application to make appropriate decisions.

> 📖 **Learning Journal**
>
> See the exercises, reflections, and code reviews for this lesson:
>
> → [Lesson 5 Journal](../../journal/semester-1/lesson-5.md)

---

## Core Concepts

* Errors are values that represent failure conditions.
* `throw` interrupts the current synchronous execution path.
* `try/catch` handles exceptions thrown within its synchronous execution scope.
* Promise rejections represent failures in asynchronous Promise-based operations.
* `await` allows rejected Promises to be handled using `try/catch`.
* Operational errors and programmer errors represent fundamentally different kinds of failure.
* Custom error classes allow callers to distinguish failure types without inspecting error messages.
* Errors should be handled at the layer that has enough context to make a meaningful decision.

---

## Mental Model

An error should travel upward until it reaches a layer capable of deciding what the failure means.

```text
Low-Level Operation
        │
        │ throws / rejects
        ▼
Service Layer
        │
        │ propagate or translate
        ▼
Application Boundary
        │
        ├── Retry?
        ├── Return an error?
        ├── Log?
        └── Crash?
```

The goal is not:

> Catch every error.

The goal is:

> Handle each error at the correct responsibility boundary.

---

## Quick Reference

| Mechanism          | Use                                             |
| ------------------ | ----------------------------------------------- |
| `throw`            | Signal a synchronous failure                    |
| `try/catch`        | Handle exceptions in the current execution path |
| `Promise.reject()` | Represent an asynchronous Promise failure       |
| `await`            | Resume an async function when a Promise settles |
| `.catch()`         | Handle a Promise rejection                      |
| Custom `Error`     | Represent a meaningful failure category         |

### Synchronous Error

```javascript
try {
    validate(input);
} catch (error) {
    console.error(error);
}
```

### Asynchronous Error

```javascript
try {
    await loadUser();
} catch (error) {
    console.error(error);
}
```

---

## Operational vs. Programmer Errors

### Operational Error

A failure that can reasonably occur while otherwise-correct software is running.

Examples:

* database unavailable,
* invalid user input,
* HTTP timeout,
* missing file,
* external API returns `429`.

The application may be able to:

* retry,
* reject the request,
* degrade functionality,
* or report the problem.

### Programmer Error

A defect in the application itself.

Examples:

* accessing a property on `undefined`,
* violating an internal invariant,
* calling a function with an impossible internal state,
* incorrect assumptions in application logic.

These often indicate that continuing execution may be unsafe.

---

## Custom Error Classes

Use custom errors when the **type of failure affects what happens next**.

```javascript
class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = "ValidationError";
    }
}
```

Then callers can make decisions based on type:

```javascript
try {
    validate(input);
} catch (error) {
    if (error instanceof ValidationError) {
        // Handle expected validation failure
    } else {
        throw error;
    }
}
```

This is preferable to:

```javascript
if (error.message === "Input is invalid") {
    // ...
}
```

Error messages are for humans.

Error types are for programs.

---

## Asynchronous Error Boundaries

This does not work:

```javascript
try {
    setTimeout(() => {
        throw new Error("Boom");
    }, 100);
} catch (error) {
    console.error(error);
}
```

The callback executes later, after the surrounding `try/catch` has already completed.

The issue is not that there are multiple Event Loops.

The callback executes during a **later turn of the same Event Loop**, outside the original synchronous call stack.

Promise-based APIs solve this by representing asynchronous completion explicitly:

```javascript
try {
    await someAsyncOperation();
} catch (error) {
    console.error(error);
}
```

`await` allows the async function to resume with the Promise's rejection as an exception at that point in the function.

---

## Error Translation

Low-level errors should not always leak directly through application boundaries.

For example:

```text
PostgreSQL unique constraint violation
                │
                ▼
        Account Service
                │
                ▼
         ConflictError
                │
                ▼
           HTTP 409
```

Each layer translates the failure into terminology meaningful to the next layer.

Avoid destroying the original cause when doing this.

Modern JavaScript supports:

```javascript
throw new Error("Unable to create account", {
    cause: error
});
```

This preserves useful diagnostic context.

---

## Key APIs / Patterns

### Throw an error

```javascript
throw new Error("Something failed");
```

### Reject a Promise

```javascript
return Promise.reject(new Error("Something failed"));
```

### Handle with `await`

```javascript
try {
    await operation();
} catch (error) {
    // Decide what this failure means here.
}
```

### Preserve the original cause

```javascript
throw new Error("Request processing failed", {
    cause: error
});
```

---

## Best Practices

* Distinguish expected operational failures from programming defects.
* Catch errors only when you can meaningfully handle, translate, or enrich them.
* Preserve the original error when wrapping failures.
* Use custom error types when behavior depends on the error category.
* Include enough context for failures to be diagnosable.
* Fail fast when required assumptions or invariants are violated.
* Handle Promise rejections deliberately.

---

## Common Mistakes

❌ Catching every error and silently continuing.

❌ Using error-message strings as program logic.

❌ Wrapping an error and losing the original cause.

❌ Assuming an outer `try/catch` catches errors thrown by callbacks that execute later.

❌ Creating custom error classes when callers do not need to distinguish the failure.

❌ Logging the same error at every layer as it propagates.

❌ Treating every failure as recoverable.

---

## Engineering Takeaways

* Failure is part of system design, not an exceptional afterthought.
* Errors should carry enough information to support decisions.
* Responsibility boundaries should determine where failures are handled.
* Unknown state can be more dangerous than downtime.
* Recovery should be intentional rather than automatic.
* Good error handling makes both application behavior and debugging more predictable.

---

## Interview Questions

**What is the difference between an operational error and a programmer error?**

An operational error is an expected failure condition that can occur while correct software is running, such as a timeout or unavailable dependency. A programmer error represents a defect in the application itself.

---

**Why can't `try/catch` catch every asynchronous error?**

`try/catch` handles exceptions thrown while its synchronous execution path is active. A callback that executes later runs on a different call stack, after the original `try` block has completed.

---

**Why does `try/catch` work with `await`?**

A rejected Promise awaited inside an async function resumes that function by throwing at the `await` expression, allowing the surrounding `try/catch` to handle it.

---

**When should you create a custom error class?**

When callers need to distinguish a particular failure category in order to make a different programmatic decision.

---

**Should every error be caught?**

No. An error should generally be caught only when that layer can recover from it, translate it, add useful context, or perform required boundary handling.

---

## Related Lessons

* [Lesson 4 — The Event Loop, Concurrency, and Asynchronous I/O](lesson-04-event-loop.md)
* [Lesson 10 — Observability, Logging, and Diagnostics](lesson-10-observability.md)
* [Lesson 12 — Debugging Like a Systems Engineer](./lesson-12-debugging.md)
* [Lesson 15 — Production Readiness](./lesson-15-production-readiness.md)

---

## Remember

> Catch an error where you can make a meaningful decision about it—not merely where you can make it disappear.

---

## Jason's Notes

The important realization from this lesson was understanding why a `try/catch` surrounding asynchronous callback registration cannot catch an exception thrown later by that callback.

The original mental model described this as the `throw` and `catch` occurring on different Event Loop instances. A more precise model is that the callback executes during a later turn of the same Event Loop on a new JavaScript call stack, after the original `try/catch` has completed.

The lesson also clarified when custom error classes earn their complexity: when identifying the error type changes what the application should do next.
