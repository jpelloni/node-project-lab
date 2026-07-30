## Reflection

1. **Why is maintaining a library different from maintaining an application?**  
The developer controls the code for an application but the publisher controls the code for a library
1. **Why are breaking changes so costly?**  
They can cause cascading across multiple consumers
1. **When should you increment the major version?**
When the code change contains breaking changes
1. **Why shouldn't libraries usually commit package-lock.json?**  
The consumer should control what packages the application uses
1. **What surprised you most about today's lesson?**  
I didn't kow that npm had version CLI commands, would have made recent releases much easier to version correctly with CI/CD pipelines


## Senior Engineering Challenge

Imagine you create a package called:

`@jpelloni/config`

It becomes unexpectedly popular.

Six months later you realize one function was poorly designed.

You have three options:

1. Remove it immediately.
1. Keep it forever.
1. Deprecate it, introduce a replacement, document the migration, and remove it in the next major version.

**Which would you choose, and why?**  
In this scenerio, option 3 would be ideal as the large user base needs the oppertunity to replace the depracted function

Now think beyond the code:

**How would you communicate the change?**  
An update to the README describing the changes  
**How would you minimize disruption?**  
Leave the original function but flagged as depracted with the reason  
**What responsibility do you have to developers who trusted your package?**  
To not update the package with breaking changes without providing time for consumers to update their codebase
