const AppError = require('./../utils/appError');

// Handle incorrect format for ObjectId
const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

// Handle duplicate value errors in the database
const handleDuplicateFieldsDB = err => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];

  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

// Handle data validation errors
const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);

  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

// Handle invalid token
const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', 401);

// Handle expired token
const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again.', 401);

// Define information about the error to send to the client in Development
const sendErrorDev = (err, req, res) => {
  // API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  }
  // Rendered website
  console.error('ERROR', err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong...',
    msg: err.message
  });
};

// Define information about the error to send to the client in Production
const sendErrorProd = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
      // Programming or other unknown error: don't leak error details
    }
    console.error('ERROR', err);
    return res.status(500).json({
      status: 'error',
      message: 'Something went wrong...'
    });
  }
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong...',
      msg: err.message
    });
    // Programming or other unknown error: don't leak error details
  }
  console.error('ERROR', err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong...',
    msg: 'Please try again later.'
  });
};

// Global error controller
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;

    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, req, res);
  }
};
