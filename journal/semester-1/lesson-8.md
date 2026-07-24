## Reflection

**Why should configuration live outside source code?**  
So updates to things like connection strings or env variables can be updated without potentially complex code changes
**Why is process.env treated as strings?**  
JavScript stores everything a strings by default
**Why validate configuration at startup instead of when it's first used?**  
You want the app to hard stop at start if any of the configuration data is missing or wrong
**What advantages does a configuration object provide?**  
It creates a single point of truth throughout the entire app
**What surprised you most about today's lesson?**  
You are correct, I would have started with an overly complex class instead of following KISS design 