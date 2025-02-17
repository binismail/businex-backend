const { transports, format, createLogger } = require("winston");

const { combine, timestamp, printf } = format;

/** Custom format */
const myFormat = printf(({ level, message, timestamp: ts }) => {
  return `${ts} [${level}]: ${message}`;
});

/** Custom winston logger */
const logger = createLogger({
  level: "info",
  format: combine(timestamp(), myFormat),
  transports: [
    /** Write all logs with level `error` and below to error folder */
    new transports.File({
      dirname: "logs",
      filename: "error.log",
      level: "error",
      format: format.json(),
    }),
    /** Write all logs with level `info` and below to combined folder */
    new transports.File({
      dirname: "logs",
      filename: "combined.log",
      format: format.json(),
    }),
    /** Log to console */
    new transports.Console({
      format: combine(format.colorize(), myFormat),
      handleExceptions: true,
    }),
  ],
  /** Handle uncaught exceptions */
  exceptionHandlers: [
    new transports.File({
      dirname: "logs",
      filename: "exceptions.log",
    }),
  ],
  /** Handle promise rejections */
  rejectionHandlers: [
    new transports.File({
      dirname: "logs",
      filename: "rejections.log",
    }),
  ],
});

module.exports = logger;
