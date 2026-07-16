## Reflection

1. **Why does Node wrap every CommonJS module in a function?**  
To add global variables
1. **Why is module caching beneficial?**  
Speed up loading and processing
1. **Why does exports = {} behave differently from module.exports = {}?**  
This is basically a byVal vs. byRef situation
1. **Why do circular dependencies sometimes produce partially initialized objects?**  
A race condition is created between the two dependencies
1. **Which module system would you choose for a brand new Node project today, and why?**  
I would use the ESM module system because I find it more readable, but CommonJS require statements can be used to create on-demand loading, which can be very helpful and improve performance by delaying loading for modules that are accessed occasionally