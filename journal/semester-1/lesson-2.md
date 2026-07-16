## Reflection
1. **Why does npm need both package.json and package-lock.json?** `package.json` is the contract for the node package while `package-lock.json` records the **entire resolved dependency tree**
1. **Why doesn't Node search the entire hard drive for a module?** Once outside the project workspace, there is no way to guarantee the contents and structure of the file structure
1. **Why are Jest and ESLint usually devDependencies?** They are not needed for running in production, they are tools used during the development process
1. **What information in package.json would be most important if you were joining an unfamiliar project?** Ideally it would be the description field but if that is insufficient, reviewing the dependencies and devDependencies
1. **What surprised you most about this lesson?** Honestly, none of the initial info was new to me but learning about why open source libraries don't include `package-lock.json` was very interesting

## Senior Engineer Challenge
If `package-lock.json` guarantees reproducible installs, why do many **open source libraries intentionally avoid committing one**?  
~~From personal experience, they can create conflicts across different developer workspaces~~  
Testing against the broader allowed range helps ensure your library works for the people who consume it.