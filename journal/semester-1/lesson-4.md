## Reflection

1. **Why can Node handle thousands of network connections with one JavaScript thread?** Node can manage thousands of network connections because JavaScript never blocks waiting on them. The operating system notifies libuv when work is ready, and the Event Loop processes those events one at a time.
1. **What is the difference between concurrency and parallelism?** Parallesism is multiple tasks execute simultaneously. while concurrency is multiple tasks make progress during the same time period, even if only one is actively executing at any instant.
1. **Why is blocking the Event Loop harmful?** It delays **all** requests
1. **Why does process.nextTick() execute before Promise callbacks?** `nextTick` are intended to handle high priority operations such as resource cleaning
1. **What surprised you most about today's lesson?**  I was unaware of `nextTick` and I can already see how it could have improved the performance of some of my older applications. i.e. clearing all resources before closing the loop proceeses instead of having to ensure they are cleaned before doing post processing events 

## Senior Engineering Challenge

A request handler does this:
```
const users = await db.getUsers();

const reports = await storage.getReports();

const permissions = await graphApi.getPermissions();
```

**Question:**

Should these operations run sequentially?

Or:
```
const [users, reports, permissions] = await Promise.all([
    db.getUsers(),
    storage.getReports(),
    graphApi.getPermissions()
]);
```
**When is `Promise.all()` the right tool?**  
If the results of one step are not required for another one of the process

**When is it the wrong tool?**  
When completion order is vital.  
*i.e. getting a users permissions before getting the report data*