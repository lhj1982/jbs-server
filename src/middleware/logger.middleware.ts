const loggerMiddleware = (req, res, next) => {
  next();
};

export { loggerMiddleware };
