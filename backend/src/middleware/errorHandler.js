const notFound = (req, res) =>
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });

const errorHandler = (err, req, res, next) => {
  console.error(err.message);
  let status = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  let message = err.message || "Server error";

  if (err.code === 11000) {
    status = 400;
    message = "Email already registered";
  }
  if (err.name === "ValidationError") status = 400;
  if (err.name === "CastError") {
    status = 400;
    message = "Invalid id";
  }
  if (err.name === "MulterError" || /allowed/.test(message)) status = 400;

  res.status(status).json({ success: false, message });
};

module.exports = { notFound, errorHandler };
