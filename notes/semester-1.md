## Key Notes and Takeaways
1. `process.cwd()` reports **where the Node process was started**, not where `index.js` lives.
1. `npm explain <npm package>` lists package dependecies and peer requirements
1. Does npm download your `package-lock.json` and use it to install your library's dependencies?
    The answer is no.
    When someone installs a library from the npm registry, npm uses the library's `package.json`, not its `package-lock.json`, to resolve dependencies.
    <u>That means your lock file doesn't control what your users receive.</u>

## `package.json` vs `package-lock.json`
`package.json` describes acceptable dependency versions.  
`package-lock.json` records the exact resolved dependency tree for reproducible installs.  
Applications benefit greatly from committing `package-lock.json`.  
<u>Libraries are often tested across version ranges rather than a single locked dependency tree.</u>