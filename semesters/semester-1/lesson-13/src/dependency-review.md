## Build Challenge

Choose three dependencies from a real Node project you've built.

For each, answer:

Why does the project need it?
Could you reasonably write it yourself?
Would you?
What risks does it introduce?
Would you choose it again today?

Don't just list facts—make an engineering judgment.

1. `zod`
    - **Why does the project need it?**  
    Provides simplified request validation for REST APIs
    - **Could you reasonably write it yourself?**  
    Not really
    - **Would you?**  
    I couldn't make a version as tested and stable as the package, so no
    - **What risks does it introduce?**  
    Its `package.json` does contain references to known compromised dependencies that could introduce vulnerabilities outside my control
    - **Would you choose it again today?**  
    Yes, it's an incredibly useful package that greatly improves development time

1. `nestjs`
    - **Why does the project need it?**  
    Provides the base framework for rapidly building REST APIs
    - **Could you reasonably write it yourself?**  
    No
    - **Would you?**  
    I couldn't make a version as tested and stable as the package, so no
    - **What risks does it introduce?**  
    While it's very aggressively maintained, new exploits are found that could require breaking changes to fix
    - **Would you choose it again today?**  
    Yes, I have used numerous Node frameworks for REST APIs and have found NestJS to be one of the most versatile and easy-to-use frameworks

1. `typeorm`
    - **Why does the project need it?**  
    Provides ORM for TypeScript projects that is db agnostic
    - **Could you reasonably write it yourself?**  
    No
    - **Would you?**  
    I couldn't make a version as tested and stable as the package, so no
    - **What risks does it introduce?**  
    Careful implementation of TypeORM models is required, as data vulnerabilities are easy to introduce that TypeORM couldn't catch
    - **Would you choose it again today?**  
    Yes, it's a powerful package that makes DAL development faster, stable, and easy to read