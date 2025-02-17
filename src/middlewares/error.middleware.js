/* eslint-disable no-unused-vars */
const logger = require('../shared/utils/customLogger');

/** Global error handler */
const globalErrorHandler = (err, req, res, next) => {
  /* Bad JSON request body */
  if (err.type === 'entity.parse.failed') {
    return res.status(400).send({
      status: 'error',
      statusCode: 400,
      message: 'Bad JSON request body',
    });
  }

  /* Mongoose bad ObjectID */
  if (err.name === 'CastError') {
    return res.status(400).send({
      status: 'error',
      statusCode: 400,
      message: 'Invalid resource ID',
    });
  }

  /* Mongoose duplicate key value */
  if (err.code === 11000) {
    const keyVal = Object.keys(err.keyValue)[0];
    const message = `${keyVal} already exists`;
    return res.status(400).send({
      status: 'error',
      statusCode: 400,
      message,
    });
  }

  /* Mongoose validation error */
  if (err.name === 'ValidationError') {
    console.log(err.name);
    const messageArr = Object.values(err.errors).map((value) => value.message);
    const message = `Invalid input data: ${messageArr.join(', ')}`;
    return res.status(400).send({
      status: 'error',
      statusCode: 400,
      message,
    });
  }

  /* Jwt invalid token error */
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).send({
      status: 'error',
      statusCode: 401,
      message: 'Invalid token. Please log in again!',
    });
  }

  /* Jwt expired token error */
  if (err.name === 'TokenExpiredError') {
    return res.status(401).send({
      status: 'error',
      statusCode: 401,
      message: 'Your token has expired! Please log in again.',
    });
  }

  /* Incorrect upload field name error */
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).send({
      status: 'error',
      statusCode: 400,
      message: 'Please specify the correct upload field name',
    });
  }

  /* Incorrect upload profile image file type */
  if (err.message === 'NOT JPEG/PNG') {
    return res.status(400).send({
      status: 'error',
      statusCode: 400,
      message: 'Invalid file type, only JPEG and PNG is allowed!',
    });
  }

  /* Log the errors we didn't handle */
  logger.error(`[GlobalErrorHandler]: ${err.message}`);

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  const message = `${statusCode}`.startsWith('4') ? err.message : 'Something went wrong!';

  return res.status(statusCode).send({
    status: 'error',
    statusCode,
    message,
  });
};

/** Handles request to routes that are not available on the server */
const unhandledRoutes = (req, res, next) => {
  const error = new Error(
    `${req.method} request to: ${req.originalUrl} not available on this server!`
  );
  res.status(404);
  next(error);
};

module.exports = { globalErrorHandler, unhandledRoutes };
