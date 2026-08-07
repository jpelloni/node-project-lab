const test = require('node:test');
const assert = require('node:assert');

const logger = require('../../lesson-10/src/logger');

// Good Test
test('logger.info writes an INFO payload to console.info', () => {
  const originalInfo = console.info;
  const calls = [];
  console.info = (value) => calls.push(value);

  try {
    logger.setLogLevel('trace');
    logger.info('This is an info message', { userId: 123 });

    assert.equal(calls.length, 1);

    const payload = calls[0];
    assert.equal(payload.level, 'INFO');
    assert.equal(payload.message, 'This is an info message');
    assert.equal(payload.userId, 123);
    assert.match(payload.timestamp, /^\d{4}-\d{2}-\d{2}T/);
  } finally {
    console.info = originalInfo;
  }
});

// Brittle Test
test('logger.info calls console.info with exact payload object', () => {
  const originalInfo = console.info;
  const calls = [];
  console.info = (value) => calls.push(value);

  try {
    logger.setLogLevel('trace');
    logger.info('This is an info message');

    assert.deepStrictEqual(calls[0], {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message: 'This is an info message'
    });
  } finally {
    console.info = originalInfo;
  }
});