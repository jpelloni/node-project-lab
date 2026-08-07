## Reflection
1. **Why is high test coverage not the same as high quality?**  
It only shows the code ran, not if it did things correctly
1. **Why should tests verify behavior instead of implementation?**  
The implentation can change without requiring any changes to the actual test
1. **When is mocking helpful, and when does it become harmful?**  
Use mocking for unit tests that test behavior and not integration. Mocking becomes harmful when mocking is multilayer deep
1. **Why does good architecture often lead to easier testing?**  
The tests are less brittle and can adapt to code changes with minimal test changes
1. **What surprised you most about today's lesson?**  
I never thought about if unit tests are behaving correctly, I just used code coverage as the metric of quality.  This actually helped me get a clearer understanding of TDD