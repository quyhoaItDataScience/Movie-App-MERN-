const nodemailer = require("nodemailer");

exports.generateToken = (length = 6) => {
  let OTP = "";
  for (let i = 0; i < length; i++) {
    const temp = Math.floor(Math.random() * 9);
    OTP += temp;
  }
  return OTP;
};

exports.generateTransport = () => {
  var transport = nodemailer.createTransport({
    host: "smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "f18a01a8bc67e2",
      pass: "d430dc85bf7565",
    },
  });
  return transport;
};
