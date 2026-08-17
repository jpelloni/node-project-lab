# Lesson 13 — Dependencies, Technical Debt, and Build vs. Buy

## Purpose

Understand the engineering cost introduced by dependencies, how transitive dependencies expand a project's effective surface area, and how to make deliberate build-versus-buy decisions based on complexity, maintenance, security, and long-term ownership.

> 📖 **Learning Journal**
>
> See the exercises, reflections, and code reviews for this lesson:
>
> → [Lesson 13 Journal](../../journal/semester-1/lesson-13.md)

---

## Core Concepts

* Every dependency introduces benefits and costs.
* Installing one package may introduce many transitive dependencies.
* Dependency count alone does not determine risk.
* Maintenance quality matters as much as package functionality.
* Popularity is evidence of adoption, not proof of quality.
* Small functionality may be cheaper to own directly than through a dependency.
* Complex, security-sensitive, or well-established functionality is often safer to obtain from a mature package.
* Dependencies create ongoing maintenance obligations.
* Supply-chain security is part of dependency management.
* Build-versus-buy decisions should consider total ownership cost, not merely implementation effort.

---

## Mental Model

Installing a dependency is not simply:

```text id="dg9iwu"
Application
    │
    ▼
Package
```

The actual relationship may look more like:

```text id="i17v3z"
Application
    │
    ▼
Dependency A
    │
    ├── Dependency B
    │      ├── Dependency D
    │      └── Dependency E
    │
    └── Dependency C
           └── Dependency F
```

Each node can introduce:

* code,
* bugs,
* vulnerabilities,
* licenses,
* maintenance risk,
* breaking changes,
* additional dependencies.

Installing a package means accepting part of its dependency graph into your system.

---

## Quick Reference

Before adding a dependency, ask:

```text id="65pb17"
What problem does it solve?
        │
        ▼
How difficult is this to build correctly?
        │
        ▼
How difficult is it to maintain?
        │
        ▼
Is the package healthy?
        │
        ▼
What does it bring with it?
        │
        ▼
Is the trade-off worth it?
```

| Question                   | Concern              |
| -------------------------- | -------------------- |
| Can we build it?           | Implementation cost  |
| Should we build it?        | Ownership cost       |
| Is it maintained?          | Sustainability       |
| What does it depend on?    | Supply-chain surface |
| What is its license?       | Legal compatibility  |
| How stable is its API?     | Upgrade cost         |
| What happens if abandoned? | Operational risk     |

---

## Direct vs. Transitive Dependencies

A direct dependency is explicitly declared by the project.

```json id="94ytbl"
{
    "dependencies": {
        "express": "^5.0.0"
    }
}
```

But Express itself depends on other packages.

Those packages may depend on still more packages.

These are **transitive dependencies**.

Inspect the tree with:

```bash id="uvrxpb"
npm ls
```

The application's effective dependency footprint is therefore larger than the `dependencies` section of `package.json`.

---

## Why Transitive Dependencies Matter

Suppose:

```text id="2d4zkf"
Application
    │
    ▼
Package A
    │
    ▼
Package B
    │
    ▼
Package C
```

A vulnerability in Package C may still affect the application even though the development team never intentionally selected it.

Similarly:

```text id="t2pxtl"
Package C abandoned
        │
        ▼
Package B cannot upgrade
        │
        ▼
Package A cannot upgrade
        │
        ▼
Application blocked
```

Ownership extends through the dependency graph whether the dependency is direct or indirect.

---

## Dependency Cost

A dependency can introduce several kinds of cost.

### Runtime Cost

Potential effects include:

* memory,
* startup time,
* CPU,
* package size.

### Maintenance Cost

The team must monitor:

* releases,
* deprecations,
* breaking changes,
* compatibility.

### Security Cost

Dependencies increase the software supply-chain surface.

### Operational Cost

A dependency may affect:

* application behavior,
* deployment,
* debugging,
* observability,
* failure modes.

### Cognitive Cost

Developers must understand enough about the package to use and troubleshoot it safely.

The package may save code while still increasing system complexity.

---

## Build vs. Buy

Consider a utility such as:

```javascript id="19lm42"
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
```

Installing a large utility package solely for this behavior is difficult to justify.

But consider:

```text id="3hvs0v"
Schema validation
ORM
Cryptography
Authentication protocol
HTTP framework
```

Reimplementing mature functionality introduces substantial:

* development effort,
* edge cases,
* testing burden,
* security risk,
* maintenance cost.

The useful question is not:

> Can I build this?

An experienced developer can build many things.

The better question is:

> Should my team own this implementation for its entire useful life?

---

## Example: Lodash

Lodash provides many utility functions.

If an application requires:

```text id="11zdkd"
one trivial helper
```

writing the behavior locally may be preferable.

If the application relies heavily on a broad collection of Lodash functionality, using the established package may provide more value than recreating and maintaining equivalent utilities.

The decision depends on **how much value the dependency provides relative to the ownership it introduces**.

---

## Evaluating a Package

Before adopting a package, inspect more than its download count.

Useful signals include:

### Release Activity

```text id="tzp6wg"
When was the last release?
```

An old release is not automatically bad.

A stable package may simply be finished.

But inactivity combined with unresolved issues may indicate abandonment.

### Maintainers

```text id="s4ut18"
How many people can maintain the project?
```

A critical package maintained by one person has a different risk profile from one supported by an active organization or community.

### Dependencies

```text id="3o7bmu"
How much additional code enters the project?
```

### Issues and Pull Requests

Look for:

* unresolved defects,
* maintenance responsiveness,
* upgrade problems,
* recurring regressions.

### License

Verify that the license is compatible with the project and organization.

### API Stability

Frequent breaking releases can create significant maintenance work.

### Security History

Review known vulnerabilities and how maintainers respond to them.

---

## Popularity Is Not Quality

High download counts can indicate:

* broad adoption,
* community familiarity,
* ecosystem integration.

They do not guarantee:

* secure implementation,
* active maintenance,
* good architecture,
* appropriate functionality,
* future support.

Likewise, a small focused package is not automatically unsafe because it is less popular.

Popularity is one signal among many.

---

## Supply-Chain Risk

Dependencies introduce code written and distributed by other people.

Potential risks include:

```text id="3u8trg"
Compromised maintainer
Malicious release
Compromised dependency
Typosquatting
Dependency confusion
Abandoned package
Vulnerable transitive dependency
```

This means package installation is partly a trust decision.

---

## Typosquatting

Typosquatting uses package names intentionally similar to legitimate packages.

For example:

```text id="4pryhh"
legitimate-package
legitmate-package
```

A developer mistypes:

```bash id="x1wtj0"
npm install legitmate-package
```

and unknowingly installs malicious code.

Defenses include:

* verify package names,
* inspect package metadata,
* use lock files,
* use vulnerability scanning,
* review unexpected dependency changes,
* avoid blindly copying installation commands.

Small typing errors can become supply-chain incidents.

---

## Dependency Auditing

npm provides:

```bash id="jtk4k5"
npm audit
```

This checks the installed dependency graph against known vulnerability information.

Useful companion commands include:

```bash id="rv6r17"
npm ls
npm outdated
npm explain <package>
```

### `npm explain`

For example:

```bash id="dznvdv"
npm explain minimist
```

can answer:

> Why is this package installed?

That is especially useful when investigating unexpected transitive dependencies.

---

## Vulnerability Scanning Is Not Enough

Automated scanning is valuable but incomplete.

It detects:

```text id="kkkhcp"
Known vulnerability
        │
        ▼
Database contains advisory
        │
        ▼
Scanner identifies installed version
```

It cannot guarantee detection of:

* unknown vulnerabilities,
* newly compromised releases,
* malicious behavior without an advisory,
* architectural misuse,
* inappropriate package selection.

Scanning is a control.

It is not a substitute for dependency judgment.

---

## Dependency Removal

Dependencies should occasionally be reevaluated.

Ask:

```text id="ewd8v1"
Do we still use it?
Does Node now provide this functionality?
Has the requirement disappeared?
Has the package become unmaintained?
Is there a simpler alternative?
```

The best-maintained dependency is sometimes the one you no longer need.

Removing unnecessary dependencies reduces:

* attack surface,
* upgrade work,
* installation time,
* cognitive load.

---

## Technical Debt

Technical debt is not simply:

> Code I dislike.

It is a trade-off where a decision creates future cost.

A dependency can become technical debt when:

```text id="4dzk2n"
Package selected quickly
        │
        ▼
Application becomes coupled
        │
        ▼
Package becomes obsolete
        │
        ▼
Replacement becomes expensive
```

But choosing to build everything internally can create even more debt.

Both decisions create ownership.

The question is which ownership is preferable.

---

## Example Engineering Judgment

### Zod

**Need**

Provides robust schema validation.

**Could we write it?**

A simplistic validator could be written.

A mature replacement with comparable features, edge-case handling, type integration, and testing would be expensive.

**Would we?**

Generally no.

**Risk**

Introduces dependency and supply-chain exposure and requires version maintenance.

**Decision**

The value provided substantially exceeds the ownership cost.

---

### NestJS

**Need**

Provides an application framework and architectural conventions for building Node services.

**Could we write it?**

Individual framework features could be recreated.

Reimplementing the complete framework reliably would be unreasonable for most application teams.

**Would we?**

No, unless the organization's requirements genuinely justified owning a custom framework.

**Risk**

Framework coupling, upgrade work, vulnerabilities, and architectural constraints.

**Decision**

Use when its structure and capabilities match the application's needs.

---

### TypeORM

**Need**

Provides database mapping, query abstractions, migrations, and multi-database support.

**Could we write it?**

A small data-access layer is feasible.

A general-purpose ORM is a very different undertaking.

**Would we?**

Usually no.

**Risk**

ORM behavior can hide database costs, introduce upgrade complexity, and create security or correctness problems when models and queries are poorly designed.

**Decision**

Use when its productivity and abstraction benefits justify the coupling and when the team understands the database behavior beneath it.

---

## Key Commands

### Inspect dependency tree

```bash id="u2vphf"
npm ls
```

### Explain why a dependency exists

```bash id="6dlt4m"
npm explain <package>
```

### Find outdated packages

```bash id="u0iwvm"
npm outdated
```

### Audit known vulnerabilities

```bash id="7grzfn"
npm audit
```

### Inspect package information

```bash id="f2z36e"
npm view <package>
```

Example:

```bash id="v7kqwu"
npm view express license
npm view express maintainers
npm view express dependencies
```

---

## Best Practices

* Understand why every direct dependency exists.
* Inspect transitive dependencies.
* Evaluate maintenance health before adoption.
* Verify package names before installation.
* Consider license compatibility.
* Run automated vulnerability scanning.
* Keep dependencies current deliberately rather than automatically.
* Remove packages that no longer provide sufficient value.
* Prefer platform functionality when it solves the requirement adequately.
* Evaluate the lifetime ownership cost of building functionality yourself.
* Understand important abstractions beneath the libraries you use.

---

## Common Mistakes

❌ Installing a package for trivial functionality without evaluating alternatives.

❌ Assuming fewer dependencies automatically means better software.

❌ Assuming more popular means safer or better maintained.

❌ Looking only at direct dependencies.

❌ Blindly running `npm install` commands copied from unknown sources.

❌ Treating vulnerability scanning as complete supply-chain protection.

❌ Reimplementing complex, mature functionality solely to avoid a dependency.

❌ Keeping unused dependencies indefinitely.

❌ Using an abstraction without understanding the system beneath it.

---

## Engineering Takeaways

* Every dependency is a maintenance decision.
* Dependencies trade implementation ownership for integration ownership.
* Transitive code is still part of your application's risk surface.
* Build-versus-buy is primarily an ownership decision, not a coding-ability test.
* Popularity is useful evidence but weak proof.
* Security includes the software supply chain.
* Abstractions save effort only when their benefits exceed their costs.
* Understanding the underlying platform makes dependency decisions better.

---

## Interview Questions

**Why does every dependency have a cost?**

Because dependencies introduce code, maintenance requirements, compatibility concerns, supply-chain exposure, potential runtime overhead, and additional knowledge the team may need to operate the application safely.

---

**What is a transitive dependency?**

A dependency required by another dependency rather than directly declared by the application.

---

**Why do transitive dependencies matter?**

They still contribute code, vulnerabilities, maintenance constraints, and compatibility risks to the application's effective dependency graph.

---

**When should you build functionality instead of using a package?**

When the requirement is sufficiently small and stable that owning the implementation costs less than introducing and maintaining an external dependency.

---

**When should you prefer a package?**

When the functionality is complex, mature implementations provide substantial testing or security benefits, and the package's maintenance and risk profile are acceptable.

---

**Why isn't package popularity enough to justify adoption?**

Popularity indicates adoption but does not prove maintenance quality, security, API stability, suitability, or long-term sustainability.

---

**What is typosquatting?**

A supply-chain attack where a malicious package uses a name similar to a legitimate package in hopes that developers install it accidentally.

---

**What does `npm explain` do?**

It shows why a package exists in the installed dependency graph and which dependencies caused it to be installed.

---

## Related Lessons

* [Lesson 2 — npm, package.json, and Dependency Resolution](./lesson-02-npm-and-dependencies.md)
* [Lesson 8 — Environment Variables, Configuration, and Secrets](./lesson-08-configuration.md)
* [Lesson 9 — npm Packages, Semantic Versioning, and Publishing](./lesson-09-package-publishing.md)
* [Lesson 14 — Testing as an Engineering Discipline](./lesson-14-testing.md)
* [Lesson 15 — Production Readiness](./lesson-15-production-readiness.md)

---

## Remember

> A dependency doesn't eliminate ownership. It changes what you own.

---

## Jason's Notes

The build-versus-buy exercise reinforced a distinction that is easy to miss as an experienced developer: being capable of implementing something does not mean implementing it is the responsible engineering decision.

For something like a small Lodash utility, owning a few lines of straightforward code may cost less than introducing a dependency. For Zod, NestJS, or TypeORM, reproducing the mature behavior, testing, ecosystem integration, and long-term maintenance would be a completely different proposition.

Investigating the actual dependency graph also made the scale of transitive dependencies more concrete. A relatively small number of direct dependencies resulted in dozens of additional packages entering the project.

Typosquatting was the biggest new supply-chain concept from the lesson. It highlighted that dependency security begins before vulnerability scanning—the act of selecting and installing the correct package is itself a security boundary.

The broader lesson was:

> Don't ask only whether a dependency saves code. Ask what ownership is being exchanged.

Sometimes the right decision is twenty lines of local code.

Sometimes the right decision is thousands of lines maintained by someone else.

The engineering work is knowing which situation you're in.
