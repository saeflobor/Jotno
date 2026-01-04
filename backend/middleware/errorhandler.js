const errorHandler = (err, req, res, next) => {
  console.error("💥Error:", err);

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  console.log(err);

  res.status(statusCode).json({
    status: err.status || "error",
    message
  });
};

export default errorHandler;
