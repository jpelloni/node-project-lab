# Lesson 9 — npm Packages, Semantic Versioning, and Publishing

## Purpose

Understand how reusable Node.js packages are designed, versioned, published, and maintained, and how publishing software changes an engineer's responsibilities because external consumers now depend on its public contract.

> 📖 **Learning Journal**
>
> See the exercises, reflections, and code reviews for this lesson:
>
> → [Lesson 9 Journal](../../journal/semester-1/lesson-9.md)

---

## Core Concepts

* An npm package is a reusable unit of JavaScript or Node.js functionality.
* A package's public API is a contract with its consumers.
* Semantic Versioning communicates the compatibility impact of releases.
* Breaking changes require deliberate migration strategies.
* Deprecation provides consumers time to move away from APIs before removal.
* Applications and libraries have different dependency-management responsibilities.
* npm provides commands for incrementing package versions consistently.
* Publishing a package creates an ongoing maintenance responsibility.

---

## Mental Model

An application is primarily controlled by its developers.

A library introduces another party:

```text
Package Maintainer
        │
        │ publishes
        ▼
     Package
        │
        │ depends on
        ▼
Consumer Application
```

A package change can therefore affect systems the maintainer:

* does not control,
* cannot inspect,
* cannot deploy,
* and may not even know exist.

That makes the package's public API a compatibility boundary.

---

## Quick Reference

### Semantic Versioning

```text
MAJOR.MINOR.PATCH

  2  .  4  .  7
  │     │     │
  │     │     └── Backward-compatible bug fix
  │     │
  │     └──────── Backward-compatible functionality
  │
  └────────────── Breaking change
```

| Change                      | Version |
| --------------------------- | ------- |
| Bug fix                     | PATCH   |
| Backward-compatible feature | MINOR   |
| Breaking API change         | MAJOR   |

Examples:

```text
1.4.2 → 1.4.3   Patch
1.4.2 → 1.5.0   Minor
1.4.2 → 2.0.0   Major
```

---

## Semantic Versioning

Semantic Versioning communicates intent about compatibility.

Given:

```text
3.7.4
```

### Patch

```text
3.7.4 → 3.7.5
```

Use for backward-compatible fixes.

Examples:

* fix incorrect calculation,
* correct internal error handling,
* patch a bug without changing the public contract.

### Minor

```text
3.7.4 → 3.8.0
```

Use for backward-compatible functionality.

Examples:

* add a new function,
* add an optional argument,
* expose new functionality without breaking existing consumers.

### Major

```text
3.7.4 → 4.0.0
```

Use when consumers may need to modify their code.

Examples:

* remove a public function,
* change required parameters,
* change return behavior incompatibly,
* rename exported APIs.

---

## npm Version Commands

npm can update the version consistently.

### Patch

```bash
npm version patch
```

### Minor

```bash
npm version minor
```

### Major

```bash
npm version major
```

For example:

```text
package.json

"version": "1.3.4"
```

Running:

```bash
npm version minor
```

produces:

```text
"version": "1.4.0"
```

and, in a Git repository under normal npm behavior, creates a corresponding commit and version tag.

This makes versioning useful in automated release workflows.

---

## Public APIs Are Contracts

Consider:

```javascript
function loadConfig(path) {
    // ...
}
```

Consumers may write:

```javascript
const config = loadConfig("./config.json");
```

Changing the function to:

```javascript
function loadConfig(path, environment) {
    // environment now required
}
```

may appear trivial inside the package.

For consumers, however:

```text
Package Release
      │
      ▼
Consumer A breaks
Consumer B breaks
Consumer C breaks
Consumer D breaks
      ...
```

The cost of a breaking change is multiplied across the dependency graph.

---

## Deprecation

Suppose a popular package contains:

```javascript
function loadConfig() {
    // poorly designed API
}
```

A better API is created:

```javascript
function createConfig() {
    // improved design
}
```

Removing `loadConfig()` immediately creates unnecessary disruption.

A safer lifecycle is:

```text
Current API
    │
    ▼
Introduce Replacement
    │
    ▼
Deprecate Old API
    │
    ▼
Document Migration
    │
    ▼
Allow Migration Time
    │
    ▼
Next Major Version
    │
    ▼
Remove Old API
```

Deprecation communicates:

> This still works today, but consumers should stop depending on it.

---

## Communicating Deprecation

A deprecated function can remain functional while signaling its future removal.

For example:

```javascript
/**
 * @deprecated Use createConfig() instead.
 * loadConfig() will be removed in v3.
 */
function loadConfig() {
    // ...
}
```

Communication should also appear in:

* README documentation,
* release notes,
* migration guides,
* changelogs where appropriate.

A deprecation notice should explain both:

1. what is changing,
2. what consumers should use instead.

---

## Applications vs. Libraries

Applications and libraries have different dependency relationships.

### Application

```text
Application
    │
    ▼
Exact Dependency Tree
```

The application team controls deployment.

Reproducibility is therefore extremely valuable.

Committing:

```text
package-lock.json
```

helps ensure environments install the same dependency tree.

### Library

```text
Library
    │
    ▼
Consumer
    │
    ▼
Consumer's Dependency Tree
```

The library does not control the consumer's final installation.

For that reason, many libraries historically did not commit lock files because the consumer ultimately resolves the dependency graph.

However, a lock file can still be useful to library maintainers for reproducible development and CI environments.

The important distinction is:

> A library's lock file does not lock the dependency versions installed by its consumers.

---

## Package Surface Area

Everything publicly exported can become something consumers depend on.

For example:

```javascript
module.exports = {
    parse,
    validate,
    internalHelper,
    temporaryUtility
};
```

Even if `internalHelper` was never intended for public use, consumers can now depend on it.

A smaller public surface provides:

* fewer compatibility obligations,
* easier documentation,
* easier testing,
* greater freedom to refactor.

Expose intentionally.

---

## Publishing

A typical publishing workflow may look like:

```text
Develop
   │
   ▼
Test
   │
   ▼
Choose Version
   │
   ▼
Update Changelog
   │
   ▼
npm version
   │
   ▼
Publish
   │
   ▼
Communicate Changes
```

Publishing is not simply:

```bash
npm publish
```

The command uploads the package.

The engineering work is ensuring consumers can safely use what was uploaded.

---

## Key Commands

### View current package version

```bash
npm pkg get version
```

### Increment patch

```bash
npm version patch
```

### Increment minor

```bash
npm version minor
```

### Increment major

```bash
npm version major
```

### Inspect what would be published

```bash
npm pack --dry-run
```

### Create package archive

```bash
npm pack
```

### Publish

```bash
npm publish
```

---

## Best Practices

* Treat public APIs as contracts.
* Keep the public package surface intentionally small.
* Follow Semantic Versioning consistently.
* Deprecate before removing widely used functionality when practical.
* Document migration paths for breaking changes.
* Communicate meaningful changes through release notes or changelogs.
* Test the package from a consumer's perspective.
* Inspect package contents before publishing.
* Automate repeatable release steps where appropriate.
* Consider the downstream impact before changing public behavior.

---

## Common Mistakes

❌ Making breaking changes in patch or minor releases.

❌ Removing APIs immediately when a migration period is practical.

❌ Exporting internal implementation details unnecessarily.

❌ Assuming consumers use the package exactly as intended.

❌ Treating documentation as optional after changing public behavior.

❌ Publishing without inspecting package contents.

❌ Assuming a library's lock file controls consumer dependency resolution.

❌ Treating `npm publish` as the entire release process.

---

## Engineering Takeaways

* APIs create obligations once other systems depend on them.
* Compatibility is an engineering feature.
* Breaking-change cost increases with the number of consumers.
* Good deprecation strategies trade temporary maintenance complexity for reduced consumer disruption.
* Documentation is part of a public interface.
* Release processes should communicate intent, not merely distribute code.
* Ownership includes considering the consequences your decisions impose on others.

---

## Interview Questions

**What does Semantic Versioning represent?**

Semantic Versioning uses `MAJOR.MINOR.PATCH` to communicate compatibility: major versions contain breaking changes, minor versions add backward-compatible functionality, and patch versions contain backward-compatible fixes.

---

**When should you increment the major version?**

When a change breaks compatibility with the existing public API or documented behavior.

---

**Why deprecate an API instead of immediately removing it?**

Deprecation allows consumers to migrate on their own schedule while clearly communicating that the old API will eventually be removed.

---

**What responsibilities come with maintaining a public package?**

Maintainers are responsible for managing compatibility, communicating changes, addressing security and maintenance issues, documenting public behavior, and minimizing unnecessary disruption to consumers.

---

**Does committing `package-lock.json` in a library force consumers to use those exact dependency versions?**

No. The consumer's dependency resolution determines the final installed dependency tree. A library lock file primarily affects the library's own development and CI environment.

---

**Why should a package minimize its public API?**

Every public API can become a compatibility obligation. A smaller surface reduces maintenance burden and preserves freedom to change internal implementation.

---

## Related Lessons

* [Lesson 2 — npm, package.json, and Dependency Resolution](./lesson-02-npm-and-dependencies.md)
* [Lesson 8 — Environment Variables, Configuration, and Secrets](./lesson-08-configuration.md)
* [Lesson 13 — Dependencies, Technical Debt, and Build vs Buy](./lesson-13-dependencies.md)
* [Lesson 14 — Testing as an Engineering Discipline](./lesson-14-testing.md)

---

## Remember

> Once other developers depend on your code, compatibility becomes part of your responsibility.

---

## Jason's Notes

The central insight from this lesson was that maintaining a library is fundamentally different from maintaining an application.

With an application, I control the code and can coordinate changes with its deployment. With a published library, changes affect consumers whose code, release schedules, and constraints I do not control.

That made the answer to the deprecation exercise straightforward: introduce the replacement, mark the old API as deprecated, explain why it is changing, document the migration path, and wait until a major release to remove it.

Another useful discovery was that npm provides built-in version commands. Knowing that earlier would have simplified release versioning in CI/CD pipelines I'd worked with.

The broader lesson was that publishing code changes the definition of ownership. Maintaining the implementation is no longer enough; the maintainer also owns the impact that changes have on consumers.
