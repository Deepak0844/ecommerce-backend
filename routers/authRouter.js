import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { genPassword, Email } from "../helper.js";

const router = express.Router();

//signup
router.route("/signup").post(async (request, response) => {
  const { email, userName, password } = request.body;
  if (!email) {
    response.status(401).send({ message: "email should be provided" });
    return;
  }
  const emailFromDB = await User.findOne({ email: email.toLowerCase() });
  const userNameFromDB = await User.findOne({ userName });

  if (userNameFromDB) {
    //if user name already exist
    response.status(401).send({ message: "User Name already exists " });
    return;
  }

  if (emailFromDB) {
    //if email already exist
    response.status(401).send({ message: "email already exists " });
    return;
  }

  if (!userName) {
    response.status(401).send({ message: "User Name should be provided" });
    return;
  }
  if (!password) {
    response.status(401).send({ message: "password should be provided" });
    return;
  }
  if (password.length < 8) {
    //check if the password length is greater than or equal to 8
    response.status(401).send({ message: "password must be longer" });
    return;
  }
  if (
    !/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@!#%&]).{8,}$/g.test(password)
  ) {
    response.status(401).send({ message: "Password pattern does not match" });
    return;
  }
  const hashedPassword = await genPassword(password);
  const result = await new User({
    email: email.toLowerCase(),
    userName,
    password: hashedPassword,
  });
  //
  const user = await result.save();
  const getData = await User.findOne({ email: email.toLowerCase() });
  const { _id } = getData;
  const token = jwt.sign({ id: _id }, process.env.SECRET_KEY);
  const storeToken = await User.findByIdAndUpdate(
    { _id },
    {
      $set: { token },
    },
    { new: true }
  );

  const link = `https://ecommerce-d5ff7.web.app/account-verification/${token}`;
  console.log("token: ", token);
  const message = `
      <h2>Just one more step...</h2>
      <h3>hi ${userName}</h3>
      <p>Click the link below to activate your account</p>
      <a href=${link}>complete verification</a>
    `;
  const responseMessage = {
    message: "Activation link has been send to your Email",
  };
  const subject = "Account Activation";
  const mail = Email(email, response, message, responseMessage, subject);
});

//account activation
router.route("/account-verification/:token").get(async (request, response) => {
  const { token } = request.params;
  try {
    // const result = jwt.verify(token, process.env.SECRET_KEY);
    const getData = await User.findOne({ token });
    if (getData) {
      const { _id, token } = getData;
      const statusChange = await User.findByIdAndUpdate(
        { _id },
        {
          $set: { isVerified: true },

          $unset: { token },
        },
        { new: true }
      );
      response.send({ message: "Account Activated Successfully" }); ////
    } else {
      response.status(400).send({ message: "Link Expired" });
    }
  } catch (error) {
    response.status(400).send(error);
  }
});

//login user - post
router.route("/signin").post(async (request, response) => {
  const { email, password } = request.body;

  if (!email) {
    response.status(401).send({ message: "email should be provided" });
    return;
  }
  if (!password) {
    response.status(401).send({ message: "password should be provided" });
    return;
  }
  const emailFromDB = await User.findOne({ email: email.toLowerCase() });
  if (!emailFromDB) {
    //if user does not exist
    response.status(401).send({ message: "Invalid credentials" });
    return;
  }

  const storedPassword = emailFromDB.password; //getting user password and compare with a password from body
  console.log("password", storedPassword);

  const isPasswordMatch = await bcrypt.compare(password, storedPassword); //comparing input password with existing password
  console.log("password", isPasswordMatch);
  if (!isPasswordMatch) {
    response.status(401).send({
      message: "Invalid credentials",
    });
    return;
  }
  //if the account is not activated its show error message
  if (!emailFromDB.isVerified) {
    response.status(401).send({
      message:
        "Pending Account. Please activate Your account!, Account activation link has been already sent to your email",
    });
    return;
  }

  //if password match
  if (isPasswordMatch) {
    const authToken = jwt.sign(
      { id: emailFromDB._id, isAdmin: emailFromDB.isAdmin },
      process.env.SECRET_KEY
    ); //,{expiresIn:"3hours"}
    const { password, ...others } = emailFromDB._doc;
    response.send({
      message: "Successfully logged in",
      loginData: others,
      authToken: authToken,
    });
  }
});

//forget password
router.route("/forgot-password").post(async (request, response) => {
  const { email } = request.body;
  const emailFromDB = await User.findOne({ email: email.toLowerCase() });

  if (!emailFromDB) {
    //if user does not exist
    response.status(401).send({ message: "User Not Found" });
    return;
  }

  if (!emailFromDB.isVerified) {
    //if user does not exist
    response.status(401).send({
      message:
        "This account is not yet activated. Activation link has been send to your email already. kindly check it ",
    });
    return;
  }

  // If the user is valid, token  is  generated for the user
  const token = jwt.sign({ id: emailFromDB._id }, process.env.SECRET_KEY);

  //  The generated token will stored in database for later verification
  const replacePassword = await User.findOneAndUpdate(
    { email: email.toLowerCase() },
    { $set: { token } }
  );
  console.log("token:", token);
  // Email

  const link = `https://ecommerce-d5ff7.web.app/reset-password/${token}`;
  const message = `<h3>Hi ${emailFromDB.userName},</h3>
  <p>Forgot your password?</p>
  <p>To reset your password, click on the link below</p>
  <a href=${link}>change password</a>
`;
  // Email(token, email);
  const responseMessage = {
    message:
      "Password reset request was sent successfully. please check your email to reset your password",
  };
  const subject = "Password reset";
  const mail = Email(email, response, message, responseMessage, subject);
  // Using nodemailer the password reset link will be sent to the registered Email id
});

// After clicking the link in the email,which redirects to another page
router.route("/forgot-password/verify").get(async (request, response) => {
  // From the mail link the token was taken and it is placed in the header for further verification
  const token = await request.header("x-auth-token");

  const tokenVerify = await User.findOne({ token });

  // Using the token the user is verified
  if (!tokenVerify) {
    //    If the token does not match
    return response.status(400).send({ message: "Invalid Credentials" });
  }
  response.send({ message: "Matched" });
});

//change password
router.route("/change-password").post(async (request, response) => {
  try {
    // After the verification the new password is taken from the body of the request
    const { password, token } = request.body;

    if (!password) {
      response.status(401).send({ message: "password should be provided" });
      return;
    }
    if (password.length < 8) {
      response.status(401).send({ msg: "Password Must be longer" });
      return;
    }
    if (
      !/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@!#%&]).{8,}$/g.test(password)
    ) {
      response.status(401).send({ message: "Password pattern does not match" });
      return;
    }

    const data = await User.findOne({ token });
    // find the user by token which was stored before
    if (!data) {
      response.status(401).send({
        message: "link has been expired Please go back to forget password page",
      });
      return;
    }
    const { email } = data;

    // after the necessary verification the password is encrypted
    const hashedPassword = await genPassword(password);

    // After the generation of hashed password it will replace the old password
    const passwordUpdate = await User.findOneAndUpdate(
      {
        email: email.toLowerCase(),
      },
      {
        password: hashedPassword,
      }
    );
    response.send({ message: "password changed successfully" });

    const remove_token = await User.updateOne(
      { email: email.toLowerCase() },
      { $unset: { token } }
    ); // after changing the password stored token will be deleted.
  } catch (err) {
    response.send(err);
  }
});
export const authRouter = router;
