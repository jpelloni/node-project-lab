export function processOrder(order) {
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
export function parseInput(input) {
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
function assertNever(value) {
    throw new Error(`Unhandled case: ${value}`);
}
