# Lesson 8 — Environment Variables, Configuration, and Secrets

## Purpose

Understand how Node.js applications receive configuration from their runtime environment, how to validate and normalize configuration at startup, and how to keep environment-specific values and secrets separate from application source code.

> 📖 **Learning Journal**
>
> See the exercises, reflections, and code reviews for this lesson:
>
> → [Lesson 8 Journal](../../journal/semester-1/lesson-8.md)

---

## Core Concepts

* Configuration describes how an application should behave in a particular environment.
* Configuration should generally remain separate from application source code.
* Node exposes environment variables through `process.env`.
* Values retrieved from `process.env` are strings or `undefined`.
* Configuration should be parsed, normalized, and validated before the application begins accepting work.
* Invalid required configuration should usually cause the application to fail at startup.
* Application code should depend on a normalized configuration object rather than repeatedly accessing `process.env`.
* Secrets are configuration, but configuration is not necessarily secret.
* Secrets should never be committed to source control.

---

## Mental Model

Treat environment variables as **untrusted external input at the application boundary**.

```text
Operating Environment
        │
        │ PORT="3000"
        │ LOG_LEVEL="info"
        │ DATABASE_URL="..."
        ▼
    process.env
        │
        ▼
Parse + Validate
        │
        ├── Missing?
        ├── Wrong type?
        ├── Invalid value?
        └── Invalid combination?
        │
        ▼
Normalized Config
        │
        ▼
   Application
```

Application code should operate on known, validated values rather than repeatedly interpreting raw environment variables.

---

## Quick Reference

| Concern              | Responsibility                     |
| -------------------- | ---------------------------------- |
| `process.env`        | Raw environment input              |
| Configuration module | Parse and normalize values         |
| Validation           | Reject invalid configuration       |
| Configuration object | Application-facing values          |
| Secret manager       | Securely store and provide secrets |

### Raw Environment Variable

```javascript
process.env.PORT;
```

May return:

```javascript
"3000"
```

or:

```javascript
undefined
```

### Normalized Configuration

```javascript
const config = {
    port: 3000,
    logLevel: "info"
};
```

The rest of the application should not need to know that these values originally came from strings.

---

## Environment Variables Are Strings

Consider:

```bash
PORT=3000
DEBUG=false
```

Node receives:

```javascript
process.env.PORT === "3000";
process.env.DEBUG === "false";
```

Therefore this is dangerous:

```javascript
if (process.env.DEBUG) {
    enableDebugMode();
}
```

The string `"false"` is truthy.

Instead, explicitly parse the value:

```javascript
const debug = process.env.DEBUG === "true";
```

Numbers require the same treatment:

```javascript
const port = Number(process.env.PORT);
```

---

## Validate at Startup

Required configuration should be checked before the application starts serving requests.

```javascript
function required(name) {
    const value = process.env[name];

    if (!value) {
        throw new Error(
            `Missing required environment variable: ${name}`
        );
    }

    return value;
}
```

Then:

```javascript
const port = Number(required("PORT"));

if (!Number.isInteger(port) || port <= 0) {
    throw new Error("PORT must be a positive integer");
}
```

Failing immediately provides a clear error:

```text
Application startup failed:
PORT must be a positive integer
```

instead of discovering the problem later:

```text
HTTP request
     │
     ▼
Service
     │
     ▼
Database client
     │
     ▼
??? connection failure
```

The closer a failure occurs to its cause, the easier it is to diagnose.

---

## Centralize Configuration

Avoid this throughout the application:

```javascript
const port = Number(process.env.PORT);
```

```javascript
const timeout = Number(process.env.TIMEOUT);
```

```javascript
const databaseUrl = process.env.DATABASE_URL;
```

Instead, create one configuration boundary:

```javascript
const config = {
    port: Number(required("PORT")),
    timeout: Number(process.env.TIMEOUT ?? 5000),
    databaseUrl: required("DATABASE_URL")
};

module.exports = config;
```

Consumers receive normalized values:

```javascript
const config = require("./config");

server.listen(config.port);
```

This provides a **single source of truth** for application configuration.

---

## Configuration vs. Secrets

Not all configuration is secret.

### Configuration

Examples:

```text
PORT=3000
LOG_LEVEL=info
REQUEST_TIMEOUT_MS=5000
NODE_ENV=production
```

These values influence application behavior but are not necessarily sensitive.

### Secrets

Examples:

```text
DATABASE_PASSWORD
API_KEY
PRIVATE_KEY
CLIENT_SECRET
```

Secrets require stronger controls.

They should generally be supplied through mechanisms such as:

```text
Secret Manager
     │
     ▼
Deployment Environment
     │
     ▼
Application
```

rather than:

```text
Source Code
     │
     ▼
Git Repository
```

---

## `.env` Files

For local development, `.env` files can provide convenient environment configuration.

```text
PORT=3000
NAME=node-project-lab
```

Using a package such as `dotenv`:

```javascript
require("dotenv").config();
```

However:

> `.env` is a development convenience, not a secret-management system.

Files containing real secrets should not be committed to source control.

A repository can instead include:

```text
.env.example
```

containing only expected variable names and safe example values.

---

## Defaults

Defaults are useful when a value is genuinely optional.

```javascript
const port = Number(process.env.PORT ?? 3000);
```

They are dangerous when they hide missing required configuration.

For example:

```javascript
const databaseUrl =
    process.env.DATABASE_URL ?? "production-db";
```

A missing production setting may now silently connect somewhere unintended.

Use defaults deliberately.

---

## Configuration Validation

Validation should answer more than:

> Does the variable exist?

It may also need to answer:

```text
Is it the correct type?
        │
Is it within an allowed range?
        │
Is it one of the supported values?
        │
Is it compatible with other configuration?
```

For example:

```javascript
const allowedLevels = [
    "trace",
    "debug",
    "info",
    "warn",
    "error",
    "fatal"
];

if (!allowedLevels.includes(config.logLevel)) {
    throw new Error("Invalid LOG_LEVEL");
}
```

The application should begin execution with configuration it can trust.

---

## Configuration Libraries

A simple application may need nothing more than:

```javascript
const config = {
    port: Number(process.env.PORT),
    name: process.env.NAME
};
```

As configuration grows, libraries can provide:

* schema validation,
* type coercion,
* defaults,
* nested configuration,
* better validation errors.

Introduce that complexity when the problem earns it.

Do not start with an elaborate configuration framework simply because the application might need one someday.

---

## Key APIs / Patterns

### Read an environment variable

```javascript
process.env.PORT;
```

### Provide a fallback

```javascript
process.env.LOG_LEVEL ?? "info";
```

### Parse a number

```javascript
Number(process.env.PORT);
```

### Parse a boolean

```javascript
process.env.DEBUG === "true";
```

### Remove a variable from the current process

```javascript
delete process.env.TEMP_VALUE;
```

---

## Best Practices

* Treat environment variables as untrusted input.
* Parse environment variables once at the configuration boundary.
* Validate required configuration during startup.
* Fail fast when required configuration is invalid.
* Expose normalized configuration to the rest of the application.
* Keep environment-specific values out of source code.
* Keep secrets out of source control.
* Use a dedicated secret-management system in production.
* Provide `.env.example` rather than committing real `.env` files.
* Add configuration abstractions only when complexity justifies them.

---

## Common Mistakes

❌ Assuming environment variables already have JavaScript types.

❌ Treating `"false"` as the boolean `false`.

❌ Accessing `process.env` throughout the entire application.

❌ Waiting until configuration is first used before validating it.

❌ Silently defaulting required configuration.

❌ Storing credentials directly in source code.

❌ Committing production secrets to `.env`.

❌ Treating `.env` as a production secret manager.

❌ Building a complex configuration abstraction before the application needs it.

---

## Engineering Takeaways

* Configuration is an application boundary and should be treated like any other external input.
* Invalid systems should fail as close to the source of the problem as possible.
* Centralizing interpretation reduces duplicated assumptions.
* Application code becomes simpler when infrastructure concerns are normalized at boundaries.
* Secure secret handling is an operational responsibility, not merely a coding convention.
* Defaults should improve usability without hiding mistakes.
* Complexity should be introduced in response to demonstrated requirements.

---

## Interview Questions

**Why should configuration live outside application source code?**

Because configuration varies independently from the application's implementation. Separating the two allows the same artifact to run in multiple environments without source-code changes.

---

**What type are values in `process.env`?**

Existing environment variable values are exposed as strings. A missing value evaluates to `undefined`, so applications must explicitly parse values into numbers, booleans, or other required representations.

---

**Why should configuration be validated at startup?**

Startup validation catches configuration problems close to their source and prevents the application from entering an invalid operational state.

---

**Why use a configuration object instead of accessing `process.env` everywhere?**

A configuration object provides a single boundary for parsing, validation, defaults, and normalization. The rest of the application can then operate on trusted values.

---

**Should all missing configuration receive a default?**

No. Defaults are appropriate for genuinely optional settings. Required configuration should generally cause startup to fail when missing.

---

**Is a `.env` file a secret manager?**

No. It is primarily a convenient mechanism for providing environment variables, especially during local development. Production secrets should use appropriate secret-management infrastructure.

---

## Related Lessons

* [Lesson 5 — Errors, Exceptions, and Asynchronous Error Handling](./lesson-05-error-handling.md)
* [Lesson 10 — Observability, Logging, and Diagnostics](./lesson-10-observability.md)
* [Lesson 13 — Dependencies, Technical Debt, and Build vs Buy](./lesson-13-dependencies.md)
* [Lesson 15 — Production Readiness](./lesson-15-production-readiness.md)

---

## Remember

> Parse once, validate once, fail early, and give the rest of the application configuration it can trust.

---

## Jason's Notes

This lesson reinforced a pattern I had already used extensively in production: configuration should be centralized and validated before the application begins doing useful work.

Two details refined that understanding.

First, `process.env` values are strings because environment variables enter the process as textual values—not because JavaScript stores everything as strings. That means type conversion is explicitly the application's responsibility.

Second, the exercise exposed my tendency to introduce abstractions earlier than necessary. My instinct would normally have been to create a configuration class immediately. The simple configuration object solved the actual problem without introducing machinery that the requirements did not yet justify.

That became another practical application of a recurring principle:

> Every abstraction must pay rent.
