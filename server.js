require("dotenv").config();
const app = require("./src/app");
const logger = require("./src/utils/customLogger");
const mongoose = require("mongoose");

const port = process.env.PORT || 5555;

// connect DB
const MONGO_URI = process.env.MONGO_URI.replace(
  "<PASSWORD>",
  process.env.MONGO_PASSWORD
);

mongoose
  .connect(MONGO_URI)
  .then((db) => {
    logger.info(`[MongoDB connected]: ${db.connection.host}`);
  })
  .catch((err) => {
    logger.error(`[Unable to connect to MongoDB]: ${err.message}`);
    process.exit(1);
  });

const server = app.listen(port, () => {
  logger.info(`app started and listening at port ${port}`);
});

process.on("unhandledRejection", (err) => {
  logger.error(`[UnhandledRejection]: ${err}`);
  server.close(() => {
    process.exit(1);
  });
});

/** Listen for termination signal event */
process.on("SIGTERM", () => {
  logger.info("SIGTERM RECEIVED! Shutting down...");
  server.close(() => {
    logger.info("Process terminated!");
  });
});
