export const SubscriptionTypes = ["personal", "enterprise"];
export const SubscriptionStates = [
    "pending",
    "active",
    "trial",
    "cancelled",
    "past_due",
];
export const SubscriptionBillingCycles = ["monthly", "yearly", "quarterly"];
export function create_subscription(subscription, subscriptionPlan) {
    return {
        ...subscription,
        SubscriptionState: "pending",
        SubscriptionPlan: subscriptionPlan,
    };
}
export function start_trial(subscription) {
    const { trialPeriodDays } = lookUpTrialPolicy(subscription.SubscriptionPlan);
    const now = new Date();
    const trialEndDate = new Date(now);
    trialEndDate.setDate(now.getDate() + trialPeriodDays);
    return {
        ...subscription,
        SubscriptionState: "trial",
        TrialStartDate: now,
        TrialEndDate: trialEndDate,
        SubscriptionPlan: subscription.SubscriptionPlan,
    };
}
export function start_invoiced_subscription(subscription) {
    return {
        ...subscription,
        SubscriptionState: "active",
        LastBillingDate: null,
        LastPaymentDate: null,
        NextBillingDate: calculateNextBillingDate(subscription.SubscriptionPlan, null),
        SubscriptionPlan: subscription.SubscriptionPlan,
    };
}
export function start_billing_trial_subscription(subscription, payment) {
    return {
        ...subscription,
        SubscriptionState: "active",
        LastBillingDate: subscription.TrialEndDate,
        LastPaymentDate: payment.paidDate,
        NextBillingDate: calculateNextBillingDate(subscription.SubscriptionPlan, subscription.TrialEndDate),
        SubscriptionPlan: subscription.SubscriptionPlan,
    };
}
export function post_payment(subscription, payment) {
    return {
        CustomerId: subscription.CustomerId,
        PaymentMethodId: subscription.PaymentMethodId,
        SubscriptionId: subscription.SubscriptionId,
        SubscriptionState: "active",
        LastPaymentDate: payment.paidDate,
        LastBillingDate: subscription.NextBillingDate,
        NextBillingDate: calculateNextBillingDate(subscription.SubscriptionPlan, subscription.NextBillingDate),
        SubscriptionPlan: subscription.SubscriptionPlan,
    };
}
export function make_past_due(subscription, payment) {
    const pastDueSubscription = {
        ...subscription,
        SubscriptionState: "past_due",
        LastBillingAttemptDate: payment.attemptedAt,
    };
    return pastDueSubscription;
}
export function make_trial_past_due(subscription, payment) {
    const pastDueSubscription = {
        SubscriptionState: "past_due",
        LastBillingAttemptDate: payment.attemptedAt,
        SubscriptionId: subscription.SubscriptionId,
        CustomerId: subscription.CustomerId,
        PaymentMethodId: subscription.PaymentMethodId,
        SubscriptionPlan: subscription.SubscriptionPlan,
        LastBillingDate: subscription.TrialEndDate,
        NextBillingDate: calculateNextBillingDate(subscription.SubscriptionPlan, subscription.TrialEndDate),
        LastPaymentDate: null,
    };
    return pastDueSubscription;
}
export function cancel_subscription(subscription) {
    const now = new Date();
    const response = {
        SubscriptionId: subscription.SubscriptionId,
        CustomerId: subscription.CustomerId,
        PaymentMethodId: subscription.PaymentMethodId,
        SubscriptionState: "cancelled",
        cancelledAt: now,
        AccessEndsAt: now,
    };
    switch (subscription.SubscriptionState) {
        case "active":
            response.AccessEndsAt = subscription.NextBillingDate;
            break;
        case "past_due":
            break;
        case "trial":
            response.AccessEndsAt = subscription.TrialEndDate;
            break;
        default:
            assertNever(subscription);
    }
    return response;
}
function calculateNextBillingDate(subscriptionPlan, lastBillingDate) {
    const nextBillingDate = lastBillingDate
        ? new Date(lastBillingDate)
        : new Date();
    switch (subscriptionPlan.BillingCycle) {
        case "monthly":
            nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
            break;
        case "yearly":
            nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
            break;
        case "quarterly":
            nextBillingDate.setMonth(nextBillingDate.getMonth() + 3);
            break;
        default:
            assertNever(subscriptionPlan);
    }
    return nextBillingDate;
}
function assertNever(value) {
    throw new Error(`Unhandled case: ${value}`);
}
function lookUpTrialPolicy(subscriptionPlan) {
    // Example implementation, replace with actual logic as needed
    switch (subscriptionPlan.BillingCycle) {
        case "monthly":
            return { trialPeriodDays: 30 };
        case "yearly":
            return { trialPeriodDays: 14 };
        default:
            assertNever(subscriptionPlan.BillingCycle);
    }
}
