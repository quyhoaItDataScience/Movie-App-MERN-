exports.errorHandler = (err, res, req, next) => {
  res.status(500).json({ error: err.message || err });
};
