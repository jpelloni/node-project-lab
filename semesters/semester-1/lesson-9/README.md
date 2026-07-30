# Lesson 9: npm Packages, Semantic Versioning, and Publishing

This lesson is a small standalone package that demonstrates the package structure used for npm modules and the relationship between `package.json`, package entry points, and exported functionality.

## Learning Goals

- Understand how a Node package is structured
- Learn how `package.json` defines package metadata, entry points, and versioning
- Explore simple exported utilities in a reusable module
- Practice using a package from its local directory with `require()`

## What’s in this lesson

- `package.json` — package metadata for `@jpelloni/lesson-9`
- `src/index.js` — exported utility functions for the lesson
- `src/exercise-1.js` — placeholder for the first exercise

## Exercise

The package exports three utility functions:

- `capitalize(str)`
- `reverse(str)`
- `truncate(str)`

Your task is to implement these functions inside `semesters/semester-1/lesson-9/src/index.js`.

### Suggested behavior

- `capitalize(str)` should return the same string with the first character converted to uppercase.
- `reverse(str)` should return the string with its characters in reverse order.
- `truncate(str)` should return a shortened version of the string when it is too long.

> Note: The exact truncation behavior is up to you, but a common pattern is to return a substring and append `...` when the input is longer than a target length.

## Usage

From the `semesters/semester-1/lesson-9` directory:

```bash
npm install
node -e "const { capitalize, reverse, truncate } = require('./src'); console.log(capitalize('hello')); console.log(reverse('hello')); console.log(truncate('hello world'));"
```

## Package information

- Package name: `@jpelloni/lesson-9`
- Version: `2.0.0`
- Main entry point: `src/index.js`
- License: `MIT`

## License

This package is released under the MIT License. A full copy of the license text is available in `LICENSE`.

This license lets you use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the software, provided that the original copyright notice and license text are included in all copies or substantial portions of the software.

## Project structure

```
lesson-9/
  package.json
  README.md
  src/
    index.js
    exercise-1.js
```

## Reflection

When you finish the exercises, think about how this package could be published to npm and how semantic versioning would help communicate changes to users.
