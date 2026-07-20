## Reflection

1. **Why is it important to distinguish operational errors from programmer errors?**  
Operational errors are **expected as a category**, not because we *want* them to happen, but because they're an unavoidable part of running software.  Programmer errors, on the other hand, indicate that our assumptions or code are wrong.
1. **Why can't `try/catch` intercept every asynchronous error?**  
The asynchronous callback executes in a later turn of the Event Loop after the original `try` block has already completed.
1. **Why does `await` allow `try/catch` to work with asynchronous operations?**  
When execution reaches the await:  
    - the async function is suspended,
    - the Event Loop continues processing other work,
    - when the Promise settles, the async function resumes,
    - and if the Promise rejected, that rejection is re-thrown at the await expression, where the surrounding try/catch is still logically active.
1. **When should you create a custom Error class instead of using `Error` directly?**  
A custom error should be used when the type of error caught determines what should happen next
1. **What surprised you most about today's lesson?**  
I hadn't realized that `try/catch` can be running on a diffrent event loop instance from the actual `throw` event and that will likely cause the `catch` to not actually catch the error