## Reflection

1. **Why is benchmarking different from profiling?**  
benchmarking is getting the overall process time while profile is how that time is divided among subproccess 
1. **Why shouldn't optimization begin before measurement?**  
The actual root cause may not actually be where the performance is performing poorly and optimization won't have any real benefit
1. **What makes a memory leak different from simply using a lot of memory?**  
A memory leak is holding onto unused allocated memory
1. **Why is `process.hrtime.bigint()` preferable to `Date.now()` for benchmarking?**  
nanosecond accuracy
1. **What surprised you most about today's lesson?**  
I didn't realize how much time I have wasted in the part trying to optimize by guessing the cause instead of looking for evidence of the root cause until it was pointed out I was doing "the root of all evil"