const sgMail = require("@sendgrid/mail");

class HttpError extends Error {
  constructor(message) {
    super(message);
    this.name = "HttpError";
    this.message = message;
  }
}

function tryCatchWrapper(enpointFn) {
  return async (req, res, next) => {
    try {
      await enpointFn(req, res, next);
    } catch (error) {
      return next(error);
    }
  };
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async ({ to, subject, html }) => {
  const email = {
    to,
    from: "jkz8686@gmail.com",
    subject,
    html,
  };
  try {
    sgMail.send(email);
    return true;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  HttpError,
  tryCatchWrapper,
  sendEmail,
};
