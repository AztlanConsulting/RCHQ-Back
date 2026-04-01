/**
const formData = require("form-data");
const Mailgun = require("mailgun.js");
const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: "api",
  key: process.env.MAILGUN_KEY,
});

exports.send = async (destinatary, subject, message) => {
  mg.messages
    .create(process.env.DOMAIN, {
      from: `${process.env.MAIL_SENDER} <${process.env.MAIL_SUFFIX}@${process.env.DOMAIN}>`,
      to: [destinatary],
      html: message,
      subject,
    })
    .then((msg) => console.log(msg)) // logs response data
    .catch((err) => console.error(err)); // logs any error
};
 */