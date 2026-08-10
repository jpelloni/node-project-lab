# Lesson 3 — Modules, `require()`, `import`, and the Node Module System

## Purpose

Understand how Node.js organizes and loads code, how modules are isolated from one another, and the differences between the CommonJS and ECMAScript Module (ESM) systems.

> 📖 **Learning Journal**
>
> See the exercises, reflections, and code reviews for this lesson:
>
> → [Lesson 3 Journal](../../journal/semester-1/lesson-3.md)

---

## Core Concepts

- Every file in Node.js is treated as a module.
- CommonJS (`require`) and ECMAScript Modules (`import`) are different module systems.
- Node wraps CommonJS modules in a function to provide module scope.
- Modules are cached after their first execution.
- Circular dependencies can result in partially initialized exports.

---

## Mental Model

Think of modules as independent, reusable building blocks.

```
Application
      │
      ▼
Module A ─────┐
              │
              ▼
          Module B
              │
              ▼
          Module C
```

Each module:

- has its own scope,
- exposes a public API,
- hides its internal implementation,
- and is loaded only once.

---

## Quick Reference

| Concept | Description |
|---------|-------------|
| `require()` | Import a CommonJS module |
| `module.exports` | Export values from a CommonJS module |
| `exports` | Shorthand reference to `module.exports` |
| `import` | Import an ECMAScript Module |
| `export` | Export values from an ECMAScript Module |

### CommonJS

```javascript
const logger = require("./logger");

module.exports = {
    logger
};
```

### ECMAScript Modules

```javascript
import logger from "./logger.js";

export default logger;
```

---

## Key APIs / Commands

Load a module

```javascript
const math = require("./math");
```

Export an object

```javascript
module.exports = {
    add,
    subtract
};
```

Named export (ESM)

```javascript
export function add() {}
```

Default export (ESM)

```javascript
export default logger;
```

---

## Best Practices

- Prefer ESM for new Node.js projects unless CommonJS compatibility is required.
- Keep module interfaces small and focused.
- Export behavior rather than internal implementation details.
- Avoid circular dependencies.
- Treat modules as architectural boundaries.

---

## Common Mistakes

❌ Assigning directly to `exports` instead of `module.exports`.

❌ Creating tightly coupled modules.

❌ Exporting too many unrelated functions.

❌ Ignoring module caching when managing shared state.

❌ Assuming circular dependencies always work correctly.

---

## Engineering Takeaways

- Modules promote separation of concerns.
- Encapsulation improves maintainability.
- Public APIs should remain stable while internal implementations evolve.
- Good module boundaries naturally improve testing.
- Architectural organization is more important than file organization.

---

## Interview Questions

**Why does Node wrap CommonJS modules in a function?**

To provide module-level scope, preventing variables from leaking into the global scope while exposing values such as `module`, `exports`, `require`, `__dirname`, and `__filename`.

---

**What is module caching?**

After a module is loaded for the first time, Node caches it so subsequent `require()` calls return the same instance instead of executing the file again.

---

**Why does `exports = {}` behave differently from `module.exports = {}`?**

`exports` is initially a reference to `module.exports`. Reassigning `exports` changes the local variable rather than the object Node exports.

---

**Which module system should you choose for a new project?**

Prefer ECMAScript Modules for new development unless you have compatibility requirements that make CommonJS a better choice.

---

## Related Lessons

- [Lesson 1 — Understanding the Node Runtime](lesson-01-node-runtime.md)
- [Lesson 4 — The Event Loop](lesson-04-event-loop.md)
- [Lesson 14 — Testing as an Engineering Discipline](./lesson-14-testing.md)

---

## Remember

> Modules define architectural boundaries, not just file boundaries.

---

## Jason's Notes

The biggest insight from this lesson was understanding that `require()` isn't magic—it follows a well-defined loading process, wraps each CommonJS module in its own scope, and caches the result. Learning why `exports` and `module.exports` behave differently also clarified a behavior I'd previously understood only through experience rather than first principles.