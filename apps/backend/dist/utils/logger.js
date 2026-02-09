import winston from 'winston';
const colors = {
    error: '\x1b[31m',
    warn: '\x1b[33m',
    info: '\x1b[36m',
    debug: '\x1b[35m',
    reset: '\x1b[0m',
};
const customFormat = winston.format.printf(({ level, message, timestamp, ...meta }) => {
    const color = colors[level] || '';
    const resetColor = colors.reset;
    const timestamp_str = new Date(timestamp).toISOString();
    let metaStr = '';
    if (Object.keys(meta).length > 0 && meta.stack) {
        metaStr = `\n${meta.stack}`;
    }
    else if (Object.keys(meta).length > 0) {
        metaStr = ` ${JSON.stringify(meta)}`;
    }
    return `${color}[${timestamp_str}] ${level.toUpperCase()}${resetColor} - ${message}${metaStr}`;
});
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston.format.errors({ stack: true }), winston.format.splat(), customFormat),
    defaultMeta: { service: 'rezerwacje-api' },
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
        }),
        new winston.transports.File({
            filename: 'logs/combined.log',
            format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
        }),
    ],
});
export default logger;
//# sourceMappingURL=logger.js.map