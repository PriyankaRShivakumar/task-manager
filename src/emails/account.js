const sgMail = require("@sendgrid/mail");

//tell send grid which API Key we are using
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

//Below send method allows us to send individual emails.
//We pass an object to this that contains all the details of the email

const sendWelcomeEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: "priyanka.rs@sap.com",
    subject: "Thanks for Joining in!",
    text: `Welcome to the app, ${name}. Let me know how you get along with the app` //This `` helps to include variable name inside ${}
  });
};

const sendCancellationEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: "priyanka.rs@sap.com",
    subject: "Sorry to see you go!",
    text: `Goodbye, ${name}. I hope to see you again sometime soon` //This `` helps to include variable name inside ${}
  });
};

module.exports = {
  sendWelcomeEmail,
  sendCancellationEmail
};
