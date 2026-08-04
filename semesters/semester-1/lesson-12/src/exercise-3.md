## Exercise 3

Take one production issue you've encountered in the past.

Without changing the code...

write down:

 - Symptoms
 - Hypothesis
 - Evidence
 - Missing evidence

Next experiment
Don't solve it.
Just structure your thinking.

**Issue:** Getting user's feed timeouts intermittingly  
**Hypothesis:** Lambda function is running out of memory
**Evidence:**  
- More likely to occur during heavy usage
- The more users the user is following increases likelyhood
- Logs show random spikes in memory and cpu usage for lambda functions involved
**Missing Evidence:** 
- No errors in cache logs
- No errors in DynamoDB read calls
**Experiment:**
1. In development environment, lower memory and cpu thresholds
1. Load test against the new thresholds
1. Observe any changes in error frequency
1. Isolate lambda function where most errors occur
1. Profile the lambda function to find possible chokepoints