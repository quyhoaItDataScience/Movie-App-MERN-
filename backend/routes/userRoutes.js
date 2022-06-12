const express = require("express");
const {
  create,
  verifyEmail,
  resendEmailVerificationToken,
  forgetPassword,
  resetPassword,
  sendResetPasswordTokenStatus,
  signIn,
} = require("../controllers/user");
const { isValidResetToken } = require("../middlewares/user");
const {
  userValidator,
  validate,
  validatePassword,
  signInValidator,
} = require("../middlewares/validator");
const router = express.Router();

router.post("/signup", userValidator, validate, create);
router.post("/signin", signInValidator, validate, signIn);
router.post("/verify-email", verifyEmail);
router.post("/resend-email-verification-token", resendEmailVerificationToken);
router.post("/forget-password", forgetPassword);
router.post(
  "/verify-pass-reset-token",
  isValidResetToken,
  sendResetPasswordTokenStatus
);
router.post(
  "/reset-password",
  validatePassword,
  validate,
  isValidResetToken,
  resetPassword
);

module.exports = router;
