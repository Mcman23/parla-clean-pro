// backend/middleware/error.js — Global error handler
module.exports = (err, req, res, next) => {
  console.error('❌ Error:', err.message);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Server xətası',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};
