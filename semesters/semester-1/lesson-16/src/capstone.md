## Capstone
Design your investigation.

### 1. Immediate Response
**What do you do first?**  
Ask more questions i.e. do the suspect transactions having in common besides the speed?
After obtaining key information, i.e. transaction id, begin gathering evidence 

**What do you not do?**  
Guess and write random, and likely unproductive, code

### 2. Evidence

**What logs would you inspect?**  
Trace logs  starting from where the transaction entered the system and follow it through each step in the workflow. Checking logs and metrics to find where the possible chokepoint is

**What metrics matter?**  
CPU and Memory usage are vital, especially for areas that quickly accumulate processing resources, to see if there is any preceding incident.  
The response for each step would also be important.  Look for sudden spikes in the response time for each component.  

**What traces would help?**  
The trace logs for the transactions in question but also for one just before and after the suspect transaction.

### 3. Hypotheses

List at least five plausible causes.
Rank them.
Explain why.

The nature of this issue implies that everything is working but something is cause a bottleneck

**1.Stale Redis cache / delayed cache invalidation**  
The strongest fit for “wrong temporarily, then correct.” The database may be correct immediately while the read path serves the old cached balance until TTL expiry or delayed invalidation.  
**2.Event consumer lag**  
If balances or projections are updated asynchronously through RabbitMQ, heavy load could create a queue backlog. Thirty seconds of incorrect state fits eventual consistency very well.  
**3.Race condition / out-of-order event processing**  
Two balance-affecting operations may complete or be consumed in an unexpected order under load.  
**4.Database connection pool exhaustion or slow query/transaction completion**  
Plausible if the balance update itself is delayed rather than merely hidden behind stale state.  
**5. Read/write path inconsistency**  
Writes go to the primary database while reads hit a replica, cache, projection table, or separately maintained balance snapshot that lags behind.  

### 4. Reproduction and debugging strategy

**How would you reproduce this?**  
This becomes a small challenge, since it was established it only happened in production, recreating it in a lower env may not provide any meaningful data. The evidence that it only occurs under heavy load is important. The most important part of reproducing is producing sufficient load on the debugging env. In addition, I would try to isolate the components for testing in a vacuum to see how each component is behaving without regard to the other parts.

**What would you simulate?**  
There are many tools that can be used to simulate heavy loads to an endpoint. If there are no similarities between the suspect transactions, including heavy edge-case tests should be considered.

**What tooling would you use?**  
For this situation, metrics and monitoring are key to finding when the reproduced error starts to show.

### 6. Testing

**Once you believe you've fixed it:**

**What tests would you add?**

```text
Unit?

Integration?

End-to-end?

Load testing?

Chaos testing?
```

Well this greatly depends on the root cause.  
If each unit of working is behaving correctly, then adding more unit tests would provide very little benefit.
Adding E2E testing would also provide very little benefit help as the workflow clearly works.
If the tests were developed correctly, more chaos testing shouldn't be necessary. Side note: I always try to include this without knowing it had a name; it just made sense to test.

Working on the assumption it's a process flow issue, Integration and load testing are key to verifying the fix.

### 7. Production Rollout

**How would you deploy safely?**

**Would you:**
```text
feature flag?
canary?
blue/green?
gradual rollout?
```

Why?

I prefer doing a blue/green rollout.  
As for the other rollout options, this again depends on where the root cause lies.
Canary and feature flag rollouts wouldn't help with a network issue as the root cause or a pushback bottleneck, since they would prevent the system from experiencing the issue until after the rollout finished.

### 8. Postmortem

Assume you found the bug.  
The fix worked.  
Now what?  
What documentation changes?  
What monitoring changes?  
What process changes?  

While in the real world, the actual answer be nothing, time to move onto the next issue.  
That being said a RCA needs to be created, as well as any architectual documents need to reflect what changes were made.

Monitoring and associated alarms should be added for the newly discovered pain point if they weren't already in place.  
I would add or improve load tests performed during the deployment pipeline