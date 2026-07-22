## Reflection

1. **What responsibilities belong to the operating system versus the Node runtime?**  
The Operating System creates the processes, while Node handles the running and coordinating the application processes 
1. **Why doesn't Node create a new process for every request?**  
Creating a new process is memory intensive and time comsuming
1. **When would you choose a Worker Thread instead of asynchronous I/O?**  
If the operation is very large or time consuming, i.e. resizing a 100 MB image, a Worker Thread would be better
1. **Why are processes more isolated than threads?**  
Processes are completely seperate instances of Node, while Threads share the same parent process
1. **What surprised you most about today's lesson?**  
I had equated Processes and Threads to each other

## Senior Engineer Challenge

Imagine you're building a NestJS service that:
1. Accepts image uploads.
1. Stores them in cloud storage.
1. Generates five resized thumbnails.
1. Returns immediately to the client.

**Where would each step belong?**

**Main Event Loop?** Accepts image uploads. 
**Worker Thread?**    
**Child Process?**  Generates five resized thumbnails.  
**Background queue?**  Stores them in cloud storage.
