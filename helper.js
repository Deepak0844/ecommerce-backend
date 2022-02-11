import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

//authentication
//generate hashed password
async function genPassword(password) {
  //used
  const NO_OF_ROUNDS = 10; //difficulties
  const salt = await bcrypt.genSalt(NO_OF_ROUNDS); //random string
  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
}

//send mail for verification
function Email(email, response, message, responseMessage, subject) {
  var transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD,
    },
  });

  var mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: subject,
    html: message,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      response.status(404).send("error");
    } else {
      response.send(responseMessage);
    }
  });
}
export { genPassword, Email };
