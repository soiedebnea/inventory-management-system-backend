// Express 4 does not forward rejected promises to the error handler on its own.
// Wrapping every async controller keeps try/catch boilerplate out of each one.
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}