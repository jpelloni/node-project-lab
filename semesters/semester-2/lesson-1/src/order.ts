export type PendingOrder = {
  id: string;
  status: "pending";
};

export type PaidOrder = {
  id: string;
  status: "paid";
  paymentId?: string;
};

export type ShippedOrder = {
  id: string;
  status: "shipped";
  paymentId?: string;
  shippedAt?: Date;
};

export type CancelledOrder = {
  id: string;
  status: "cancelled";
  cancelledAt: Date;
};

export type Order = PendingOrder | PaidOrder | ShippedOrder | CancelledOrder;

export function processOrder(order: Order): void {
  switch (order.status) {
    case "pending":
      break;

    case "paid":
      break;

    case "shipped":
      break;

    case "cancelled":
      break;

    default:
      assertNever(order);
  }
}

export function parseInput(input: unknown): boolean {
  const statusType = ["paid", "pending", "shipped", "cancelled"];

  if (typeof input !== "object" || input === null) {
    throw new Error("Order must be an object");
  }

  if (!("status" in input)) {
    throw new Error("Missing status");
  }

  if (typeof input.status !== "string") {
    throw new Error("Status must be a string");
  }

  if (!statusType.includes(input.status)) {
    throw new Error(`Invalid status: ${input.status}`);
  }

  return true;
}

function assertNever(value: never): never {
  throw new Error(`Unhandled case: ${value}`);
}

function cancel(order: PendingOrder | PaidOrder): CancelledOrder {
  return {
    id: order.id,
    status: "cancelled",
    cancelledAt: new Date(),
  };
}
