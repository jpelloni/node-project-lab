let shuttingDown = false;

function registerShutdown(cleanup) {
    if (typeof cleanup !== "function") {
        throw new TypeError("cleanup must be a function");
    }

    async function shutdown(signal) {
        if (shuttingDown) {
            return;
        }

        shuttingDown = true;

        console.info(`Received ${signal}. Shutting down...`);

        try {
            await cleanup();
        } catch (error) {
            console.error("Shutdown cleanup failed:", error);
        }

        process.exit(0);
    }

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
}

module.exports = registerShutdown;
