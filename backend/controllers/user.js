const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const EmailVerficationToken = require("../models/emailVerificationToken");
const { generateToken, generateTransport } = require("../utils/mail");
const { isValidObjectId } = require("mongoose");
const { sendError, generateRandomByte } = require("../utils/error");
const PasswordResetToken = require("../models/passwordResetToken");

exports.create = async (req, res) => {
  const { name, email, password } = req.body;

  const userExists = await User.findOne({ email });

  if (userExists)
    return res.status(401).json({ err: "Email already exsits! " });

  const newUser = await User({ name, email, password });
  await newUser.save();

  const OTP = generateToken();

  const emailVerificationToken = new EmailVerficationToken({
    owner: newUser._id,
    token: OTP,
  });

  await emailVerificationToken.save();

  var transport = generateTransport();

  transport.sendMail({
    from: "verification@reviewapp.com",
    to: newUser.email,
    subject: "Email Verfication",
    html: `
      <p>Your verification OTP</p>
      <h1>Your OTP ${OTP}</h1>
    `,
  });

  return res.status(201).json({
    user: {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
    },
  });
};

exports.verifyEmail = async (req, res) => {
  const { userId, OTP } = req.body;
  if (!isValidObjectId(userId)) {
    return res.status(401).json({ error: "Invalid user!" });
  }
  const user = await User.findById(userId);
  if (!user) return res.status(401).json({ error: "User not found!" });

  if (user.isVerified) {
    return res.status(401).json({ erro: "User already verified" });
  }

  const token = await EmailVerficationToken.findOne({ owner: userId });
  if (!token) {
    return res.status(401).json({ error: "Token not found!" });
  }

  const isMatched = await token.compareToken(OTP);
  if (!isMatched) {
    return res.status(401).json({ error: "Please submit a valid OTP" });
  }

  user.isVerified = true;
  await user.save();

  await EmailVerficationToken.findByIdAndDelete(token._id);

  var transport = generateTransport();

  transport.sendMail({
    from: "verification@reviewapp.com",
    to: user.email,
    subject: "Welcome to our app",
    html: `
      <h1>Thank you for using our app</h1>
    `,
  });

  return res.status(200).json({ message: "Your account has been verified!" });
};

exports.resendEmailVerificationToken = async (req, res) => {
  const { userId } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    return res.status(401).json({ error: "User not found" });
  }

  if (user.isVerified) {
    return res.status(401).json({ error: "User already verified" });
  }

  const token = await EmailVerficationToken.findOne({ owner: userId });
  if (token) {
    return res
      .status(401)
      .json({ error: "You can only request token after 1 hour" });
  }

  const OTP = generateToken();

  var transport = nodemailer.createTransport({
    host: "smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "f18a01a8bc67e2",
      pass: "d430dc85bf7565",
    },
  });

  transport.sendMail({
    from: "verification@reviewapp.com",
    to: user.email,
    subject: "Resend Email Verfication",
    html: `
      <p>Your verification OTP</p>
      <h1>Your OTP ${OTP}</h1>
    `,
  });

  return res.status(201).json({ message: "Token has been sent to your email" });
};

exports.forgetPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) return sendError(res, "Email is missing!");

  const user = await User.findOne({ email });
  if (!user) {
    return sendError(res, "User not found!", 404);
  }

  const alreadyHasToken = await PasswordResetToken.findOne({ owner: user._id });
  if (alreadyHasToken) {
    return sendError(
      res,
      "Only after 1 hour can you request for another token"
    );
  }

  const token = await generateRandomByte();
  const newPasswordResetToken = await PasswordResetToken({
    owner: user._id,
    token,
  });
  await newPasswordResetToken.save();

  const resetPasswordUrl = `http://localhost:3000/reset-password/?token=${token}&id=${user._id}`;

  var transport = generateTransport();
  transport.sendMail({
    from: "security@reviewapp.com",
    to: user.email,
    subject: "Reset password link",
    html: `
      <p>Click here to reset password</p>
      <a href=${resetPasswordUrl}>Change password</a>
    `,
  });

  res.status(201).json({ mesage: "Link has been sent to your email" });
};

exports.sendResetPasswordTokenStatus = async (req, res) => {};

exports.resetPassword = async (req, res) => {
  const { newPassword, userId } = req.body;
  const user = await User.findById(userId);

  const isMatched = await user.comparePassword(newPassword);

  if (isMatched) {
    return sendError(res, "New password must be different from the old one");
  }
  user.password = newPassword;

  await user.save();

  await PasswordResetToken.findByIdAndDelete(req.resetPassword._id);

  const transport = generateTransport();
  transport.sendMail({
    from: "security@reviewapp.com",
    to: user.email,
    subject: "Password reset successfully",
    html: `
      <h1>Password Reset Successfully</h1>
      <p>Now you can use new password</p>
    `,
  });

  res.status(201).json({
    messag: "Password reset successfully, now you can use new password",
  });
};

exports.signIn = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return sendError(res, "Could not find this user!");
    }

    const isMatched = await user.comparePassword(password);

    if (!isMatched) {
      return sendError(res, "Incorrect password!");
    }

    const { _id, name } = user;

    const jwtToken = jwt.sign({ userId: _id }, process.env.JSON_SECRET);

    res.status(200).json({ user: { id: _id, name, email, token: jwtToken } });
  } catch (error) {
    next(error.message);
  }
};
