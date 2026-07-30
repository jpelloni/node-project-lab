const levels = ["trace", "debug", "info", "warn", "error", "fatal"];

let minimumLevelIndex = 0;

function setLogLevel(level) {
    if (typeof level !== "string") {
        console.warn("Log level must be a string");
        return;
    }

    const normalizedLevel = level.toLowerCase();
    const index = levels.indexOf(normalizedLevel);

    if (index === -1) {
        console.warn(
            `Invalid log level: ${level}. Valid levels are: ${levels.join(", ")}`
        );
        return;
    }

    minimumLevelIndex = index;
}

function trace(message, metadata) {
    writeLog("trace", message, metadata);
}

function debug(message, metadata) {
    writeLog("debug", message, metadata);
}

function info(message, metadata) {
    writeLog("info", message, metadata);
}

function warn(message, metadata) {
    writeLog("warn", message, metadata);
}

function error(message, metadata) {
    writeLog("error", message, metadata);
}

function fatal(message, metadata) {
    writeLog("fatal", message, metadata);
}

function writeLog(level, message, metadata = {}) {
    const levelIndex = levels.indexOf(level);

    if (levelIndex < minimumLevelIndex) {
        return;
    }

    const payload = {
        ...metadata,
        timestamp: new Date().toISOString(),
        level: level.toUpperCase(),
        message
    };

    if (level === "trace") {
        payload.stack = new Error().stack;
        console.debug(payload);
        return;
    }

    const consoleMethod = level !== "fatal" ? level : "error";
    console[consoleMethod](payload);
}

module.exports = {
    setLogLevel,
    trace,
    debug,
    info,
    warn,
    error,
    fatal
};