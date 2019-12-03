const path = require('path');
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// MIDDLEWARE
// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Set security HTTP headers
// use as early as possible in the middleware stack
app.use(helmet());

// Logging middleware for development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit number of requests coming from same IP address
const limiter = rateLimit({
  // maximum number to be adapted depending on the use cases of the API
  max: 100,
  // window in ms: x minutes * 60 seconds * 1000 ms
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// Read data from the body into req.body
// note: in recent versions of express, no need to require and use body-parser package
// limits the volume to 10kb for security
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Sanitize data against NoSQL query injection
/* Removes '$' and '.' from req.body, req.query, req.params
 which are keys reserved in mongo for operations.
  There is also an option to replace these characters.
  Place this middleware between the body-parser and the routes. */
app.use(mongoSanitize());

// Sanitize data against XSS attacks
/* Will sanitize any data in req.body, req.query, and req.params.
Use before any route.*/
app.use(xss());

// Prevent parameter pollution
// Avoid bad requests where a parameter is passed twice, whitelist some parameters.
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price'
    ]
  })
);

// ROUTES

/* specify version of API, this way if the API is updated, users can continue
to use older version without breaking, and you just need to add new routes for v2. */
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

// Catch all other routes to return a 404 error
app.all('*', (req, res, next) => {
  next(new AppError(`Could not find ${req.originalUrl} on this server!`, 404));
});

// This middleware handles common errors according to their code, status, or name
app.use(globalErrorHandler);

// Export App so it can be required in server.js
module.exports = app;
