export const SubscriptionTypes = ["personal", "enterprise"];
export const SubscriptionStates = [
  "pending",
  "active",
  "trial",
  "cancelled",
  "past_due",
];
export const SubscriptionBillingCycles = ["monthly", "yearly", "quarterly"];

export type SubscriptionPlan =
  | {
      SubscriptionType: "personal";
      BillingCycle: "monthly" | "yearly";
    }
  | {
      SubscriptionType: "enterprise";
      BillingCycle: "quarterly";
    };

export type TrialSubscriptionPlan = Extract<
  SubscriptionPlan,
  { SubscriptionType: "personal" }
>;

export type BaseSubscription = {
  SubscriptionId: string;
  CustomerId: string;
  PaymentMethodId: string;
};

export type ActiveSubscription = BaseSubscription & {
  SubscriptionState: "active";
  SubscriptionPlan: SubscriptionPlan;
  LastBillingDate: Date | null;
  NextBillingDate: Date;
  LastPaymentDate: Date | null;
};

export type PastDueSubscription = BaseSubscription & {
  SubscriptionState: "past_due";
  LastBillingAttemptDate: Date;
  SubscriptionPlan: SubscriptionPlan;
  LastBillingDate: Date | null;
  NextBillingDate: Date;
  LastPaymentDate: Date | null;
};

export type TrialSubscription = BaseSubscription & {
  SubscriptionState: "trial";
  TrialStartDate: Date;
  TrialEndDate: Date;
  SubscriptionPlan: TrialSubscriptionPlan;
};

export type CancelledSubscription = BaseSubscription & {
  SubscriptionState: "cancelled";
  cancelledAt: Date;
  AccessEndsAt: Date;
};

export type Subscription =
  | ActiveSubscription
  | PastDueSubscription
  | TrialSubscription
  | CancelledSubscription;

export type PendingSubscription = BaseSubscription & {
  SubscriptionState: "pending";
  SubscriptionPlan: SubscriptionPlan;
};

export type PaymentResult =
  | {
      status: "succeeded";
      idempotencyKey: string;
      paymentId: string;
      paidDate: Date;
    }
  | {
      status: "failed";
      idempotencyKey: string;
      reason: string;
      attemptedAt: Date;
    };

export function create_subscription(
  subscription: BaseSubscription,
  subscriptionPlan: SubscriptionPlan,
): PendingSubscription {
  return {
    ...subscription,
    SubscriptionState: "pending",
    SubscriptionPlan: subscriptionPlan,
  };
}

export function start_trial(
  subscription: PendingSubscription & {
    SubscriptionPlan: TrialSubscriptionPlan;
  },
): TrialSubscription {
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

export function start_invoiced_subscription(
  subscription: PendingSubscription & {
    SubscriptionPlan: Extract<
      SubscriptionPlan,
      { SubscriptionType: "enterprise" }
    >;
  },
): ActiveSubscription {
  return {
    ...subscription,
    SubscriptionState: "active",
    LastBillingDate: null,
    LastPaymentDate: null,
    NextBillingDate: calculateNextBillingDate(
      subscription.SubscriptionPlan,
      null,
    ),
    SubscriptionPlan: subscription.SubscriptionPlan,
  };
}

export function start_billing_trial_subscription(
  subscription: TrialSubscription,
  payment: Extract<PaymentResult, { status: "succeeded" }>,
): ActiveSubscription {
  return {
    ...subscription,
    SubscriptionState: "active",
    LastBillingDate: subscription.TrialEndDate,
    LastPaymentDate: payment.paidDate,
    NextBillingDate: calculateNextBillingDate(
      subscription.SubscriptionPlan,
      subscription.TrialEndDate,
    ),
    SubscriptionPlan: subscription.SubscriptionPlan,
  };
}

export function post_payment(
  subscription: ActiveSubscription | PastDueSubscription,
  payment: Extract<PaymentResult, { status: "succeeded" }>,
): ActiveSubscription {
  return {
    CustomerId: subscription.CustomerId,
    PaymentMethodId: subscription.PaymentMethodId,
    SubscriptionId: subscription.SubscriptionId,
    SubscriptionState: "active",
    LastPaymentDate: payment.paidDate,
    LastBillingDate: subscription.NextBillingDate,
    NextBillingDate: calculateNextBillingDate(
      subscription.SubscriptionPlan,
      subscription.NextBillingDate,
    ),
    SubscriptionPlan: subscription.SubscriptionPlan,
  };
}

export function make_past_due(
  subscription: ActiveSubscription | PastDueSubscription,
  payment: Extract<PaymentResult, { status: "failed" }>,
): PastDueSubscription {
  const pastDueSubscription: PastDueSubscription = {
    ...subscription,
    SubscriptionState: "past_due",
    LastBillingAttemptDate: payment.attemptedAt,
  };

  return pastDueSubscription;
}

export function make_trial_past_due(
  subscription: TrialSubscription,
  payment: Extract<PaymentResult, { status: "failed" }>,
): PastDueSubscription {
  const pastDueSubscription: PastDueSubscription = {
    SubscriptionState: "past_due",
    LastBillingAttemptDate: payment.attemptedAt,
    SubscriptionId: subscription.SubscriptionId,
    CustomerId: subscription.CustomerId,
    PaymentMethodId: subscription.PaymentMethodId,
    SubscriptionPlan: subscription.SubscriptionPlan,
    LastBillingDate: subscription.TrialEndDate,
    NextBillingDate: calculateNextBillingDate(
      subscription.SubscriptionPlan,
      subscription.TrialEndDate,
    ),
    LastPaymentDate: null,
  };

  return pastDueSubscription;
}

export function cancel_subscription(
  subscription: ActiveSubscription | PastDueSubscription | TrialSubscription,
): CancelledSubscription {
  const now = new Date();
  const response: CancelledSubscription = {
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

function calculateNextBillingDate(
  subscriptionPlan: SubscriptionPlan,
  lastBillingDate: Date | null,
): Date {
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

function assertNever(value: never): never {
  throw new Error(`Unhandled case: ${value}`);
}

function lookUpTrialPolicy(subscriptionPlan: TrialSubscriptionPlan): {
  trialPeriodDays: number;
} {
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
