## Reflection
 1. <u>If V8 executes JavaScript, why can't V8 read files by itself?</u>
 V8 is the engine for node and it only runs javaScript
 1. <u>What role does Node play between your code and the operating system?</u> Node creates the runtime environmwnt for the hosting OS
 1. <u>Why does Node use libuv instead of talking directly to Windows, Linux, or macOS APIs?</u> Node uses libuv so it can handle input/output and system features in one consistent way, instead of building separate versions for Windows, Linux, and macOS.
 1. <u>What are examples of APIs that exist because Node provides them, not because JavaScript defines them?</u> process, console, Buffer, http
 1. <u>What information from process do you think would be most useful in a production application, and why?</u>
    - argv so you can see what was passed to Node. 
    - pid, to monitor the process from the OS task manager. 
    - cwd(), to see where Node is loading the code file from