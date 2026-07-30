const logger = require('./logger');

// logger.setLogLevel('fatal'); // Set the minimum log level to 'warn'
logger.trace('This is a trace message.', { userId: 42, email: 'user@example.com' });
//logger.debug('This is a debug message.', { userId: 42, email: 'user@example.com' });
// logger.info('Hello, World!', { userId: 42, email: 'user@example.com' });
// logger.warn('This is a warning message.', { userId: 42, email: 'user@example.com' });
// logger.error('This is an error message.', { userId: 42, email: 'user@example.com' });
// logger.fatal('This is a fatal message.', { userId: 42, email: 'user@example.com' });