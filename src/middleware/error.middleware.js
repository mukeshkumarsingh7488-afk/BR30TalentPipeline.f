const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  let statusCode = Number.isInteger(err.statusCode) && err.statusCode >= 400 && err.statusCode <= 599 ? err.statusCode : 500;
  let message = err.message || "Something went wrong";

  if (err.name === "MulterError") {
    statusCode = 400;
    if (err.code === "LIMIT_FILE_SIZE") message = "Uploaded file exceeds the allowed size limit.";
    else if (err.code === "LIMIT_FILE_COUNT") message = "Too many files uploaded.";
    else if (err.code === "LIMIT_UNEXPECTED_FILE") message = "Unexpected upload field.";
    else message = "Invalid file upload request.";
  } else if (err.name === "ValidationError" || err.name === "CastError" || err.name === "BSONError") {
    statusCode = 400;
    message = err.name === "ValidationError" ? "Submitted data failed validation." : "Invalid identifier or data format.";
  } else if (err.code === 11000) {
    statusCode = 409;
    message = "A record with the same unique value already exists.";
  }

  const isProduction = process.env.NODE_ENV === "production";
  if (statusCode >= 500 && isProduction) message = "Internal server error";

  const response = { success: false, message };
  if (!isProduction && err.stack) response.stack = err.stack;

  console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${statusCode}: ${err.message || "Unknown error"}`);
  res.status(statusCode).json(response);
};

module.exports = errorHandler;
