/* Handles the .catch() block of any asynchronous function.
This clarifies the code and keeps functions focused.
Wrap an asynchronous function in catchAsync() */
module.exports = fn => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};
