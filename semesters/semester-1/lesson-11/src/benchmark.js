function benchmark(name, fn) {
    const start = process.hrtime.bigint();

    try {
        return fn();
    } finally {
        console.info({
            name,
            duration: `${(Number(process.hrtime.bigint() - start) / 1_000_000).toFixed(3)} ms`
        });
    }

    return fnResult;
}

module.exports = benchmark;