## Reflection

1. **Why does Node use Buffers instead of strings for I/O?**  
JavaScript uses Unicode for for text but Node requires data to be stored in a lower level format and a Buufer stores bytes and are format agnostic
1. **Why are streams more memory-efficient than readFile()?**  
`readFile()` locks the Event stack until completed while a `stream` allows the event stack to continue and notify when complete
1. **What problem does backpressure solve?**  
Backpressure tells the producer to slow down it's write to allow the consumer to read in the data by it's throttled limit
1. **When would you choose pipe() over manually handling "data" events?**  
When the intermediary steps are not required for the program
1. **What surprised you most about today's lesson?**  
I didn't know about Backpressure and wish I had as it would have resolved a lot of bugs in previous code