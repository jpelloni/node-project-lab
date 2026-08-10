# Lesson 2 — npm, package.json, and Dependency Resolution

## Purpose

Understand how Node.js projects are structured, how npm manages dependencies, and why reproducible builds are essential for developing and maintaining reliable software.

> 📖 **Learning Journal**
>
> See the exercises, reflections, and code reviews for this lesson:
>
> → [Lesson 2 Journal](../../journal/semester-1/lesson-2.md)

---

## Core Concepts

- `package.json` defines a project's metadata, scripts, and dependency requirements.
- `package-lock.json` records the exact dependency tree to produce reproducible installs.
- `node_modules` contains the installed dependency graph.
- npm resolves dependencies using semantic versioning (SemVer).
- Applications and libraries have different dependency management strategies.

---

## Mental Model

Think of npm as a package manager responsible for creating reproducible environments.

```
package.json
      │
      ▼
Dependency Resolution
      │
      ▼
package-lock.json
      │
      ▼
node_modules
```

- **package.json** defines *what is needed*.
- **package-lock.json** defines *exactly what was installed*.
- **node_modules** contains the installed packages.

---

## Quick Reference

| File | Purpose |
|------|---------|
| `package.json` | Project metadata and dependency definitions |
| `package-lock.json` | Exact dependency versions |
| `node_modules/` | Installed dependency tree |

### Common Commands

```bash
npm install
npm ci
npm update
npm ls
npm outdated
npm doctor
npm audit
```

---

## Key APIs / Commands

Initialize a project

```bash
npm init
```

Install a dependency

```bash
npm install express
```

Install a development dependency

```bash
npm install --save-dev jest
```

Perform a clean install

```bash
npm ci
```

List installed packages

```bash
npm ls
```

Check project health

```bash
npm doctor
```

Audit dependencies

```bash
npm audit
```

---

## Best Practices

- Commit `package-lock.json` for applications.
- Use `npm ci` in CI/CD pipelines.
- Keep dependencies intentionally minimal.
- Distinguish between runtime dependencies and development tools.
- Audit dependencies regularly.

---

## Common Mistakes

❌ Treating `package.json` as a lock file.

❌ Committing `node_modules`.

❌ Using broad version ranges without understanding their impact.

❌ Adding dependencies for trivial functionality.

❌ Forgetting that transitive dependencies also become part of your application.

---

## Engineering Takeaways

- Reproducible environments reduce deployment risk.
- Dependency management is part of software engineering.
- Every dependency introduces long-term maintenance costs.
- Deterministic builds improve reliability.
- Applications and libraries have different consumers and therefore different responsibilities.

---

## Interview Questions

**Why do npm projects have both `package.json` and `package-lock.json`?**

`package.json` describes the dependency requirements, while `package-lock.json` records the exact dependency tree to guarantee reproducible installations.

---

**Why is `npm ci` preferred in CI/CD pipelines?**

It performs a clean, deterministic installation based on the lock file, ensuring every build uses identical dependency versions.

---

**Why don't most libraries commit `package-lock.json`?**

Applications benefit from reproducible environments. Libraries are consumed by other projects, so locking transitive dependency versions provides little value to downstream consumers.

---

**What is the difference between `dependencies` and `devDependencies`?**

`dependencies` are required at runtime.

`devDependencies` are only needed during development, testing, or building.

---

## Related Lessons

- [Lesson 9 — npm Packages, Semantic Versioning, and Publishing](./lesson-09-package-publishing.md)
- [Lesson 13 — Dependencies, Technical Debt, and Build vs Buy](./lesson-13-dependencies.md)

---

## Remember

> Reproducible builds are a feature, not a convenience.

---

## Jason's Notes

The biggest insight from this lesson wasn't learning how npm works—it was understanding *why* open-source libraries often avoid committing `package-lock.json`. That distinction between building an application and publishing a library changed how I think about dependency management and reinforced that different types of software have different responsibilities.