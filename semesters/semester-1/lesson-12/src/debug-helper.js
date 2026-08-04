function debugStep(name, fn) {
  console.info(`▶ ${name}`);
  const start = process.hrtime.bigint();

  try {
    const result = fn();
    console.info(`✔ ${name}`);
    return result;
  } catch (error) {
    console.error(`❌ ${name} failed:`, error);
    throw error;
  } finally {
    console.info(`⏱ Duration: ${(Number(process.hrtime.bigint() - start) / 1_000_000).toFixed(3)} ms`);
  }
}

module.exports = debugStep;

function a() {
    console.log('a');
}

function b() {
    throw new Error('b is not defined');
}

debugStep('Function a', a);
debugStep('Function b', b);