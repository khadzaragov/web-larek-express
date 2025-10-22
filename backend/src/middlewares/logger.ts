import path from 'path';
import winston from 'winston';
import expressWinston from 'express-winston';

const logsDirectory = path.join(__dirname, '../../');

const requestLogger = expressWinston.logger({
  transports: [
    new winston.transports.File({ filename: path.join(logsDirectory, 'request.log') }),
  ],
  format: winston.format.json(),
  meta: true,
  msg: '{{req.method}} {{req.url}}',
});

const errorLogger = expressWinston.errorLogger({
  transports: [
    new winston.transports.File({ filename: path.join(logsDirectory, 'error.log') }),
  ],
  format: winston.format.json(),
});

export { requestLogger, errorLogger };
