import { createLogger, format, transports } from 'winston';
import config from '../config';
const DailyRotateFile = require('winston-daily-rotate-file');
// const { label, combine, timestamp, prettyPrint } = format;
// const env = process.env.NODE_ENV || 'development';

const logger = createLogger({
  // format: combine(timestamp(), prettyPrint()),
  format: format.combine(
    format.colorize(),
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
  ),
  transports: [
    new transports.Console({ level: 'debug' }),
    new transports.File({
      filename: `${config.logDir}/error.log`,
      level: 'error'
    }),
    new transports.File({
      filename: `${config.logDir}/access.log`,
      level: 'info'
    }),
    new DailyRotateFile({
      filename: `${config.logDir}/%DATE%-results.log`,
      datePattern: 'YYYY-MM-DD'
    })
  ],
  exitOnError: false
});

export default logger;
