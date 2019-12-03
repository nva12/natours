const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Shut down the application on uncaught exceptions
process.on('uncaughtException', err => {
  console.log('Uncaught exception! Application shutting down...');
  console.log(err.name, err.message);
  // code '1' indicates a failure, '0' by default is for success
  process.exit(1);
});

// Load environment variables to make them available anywhere
// Must be loaded before requiring the app
dotenv.config({ path: './config.env' });

// Require the App
const app = require('./app');

// Connect to the MongoDB database using environment variables
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(() => console.log('Successfully connected to the database.'));

// Launch the server
const port = process.env.PORT || 3000;
const mode = process.env.NODE_ENV;
const server = app.listen(port, () => {
  console.log(
    `Server listening on port ${port}. App running in ${mode} mode...`
  );
});

// Shut down the application on unhandled rejections
process.on('unhandledRejection', err => {
  console.log('Unhandled rejection! Application shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
