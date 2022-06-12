const { isValidObjectId } = require("mongoose");
const PasswordResetToken = require("../models/passwordResetToken");
const { sendError } = require("../utils/error");

exports.isValidResetToken = async (req, res, next) => {
  const { token, userId } = req.body;

  if (!token || !isValidObjectId(userId)) {
    return sendError(res, "Invalid request!");
  }

  const resetToken = await PasswordResetToken.findOne({ owner: userId });
  if (!resetToken) {
    return sendError(res, "Unauthorized access, invalid request!");
  }

  const isMatched = await resetToken.compare(token);

  if (!isMatched) {
    return sendError(res, "Unauthorized access, invalid request!");
  }

  req.resetToken = resetToken;
  next();
};
