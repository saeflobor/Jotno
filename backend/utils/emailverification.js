import nodemailer from "nodemailer";
import { htmlContent } from "../htmlbody.js";
import dns from "dns/promises";

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
};

const sendEmail = async (email, verifytoken, isEmailChange = false) => {
  try {
    const to = email;
    const transport = getTransporter();
    await transport.verify();
    console.log("SMTP Server is ready to send messages");
    const link = isEmailChange 
      ? `http://localhost:5173/verify-email-change/${verifytoken}`
      : `http://localhost:5173/verifyemail/${verifytoken}`;
    const subject = isEmailChange ? "Verify Email Change" : "Email Verification";
    const text = isEmailChange 
      ? "Please verify your new email by clicking the link below."
      : "Please verify your email by clicking the link below.";
    const mailOptions = {
      from: process.env.SMTP_USER,
      to,
      subject,
      text,
      html: htmlContent(link),
    };

    const info = await transport.sendMail(mailOptions);
    console.log("Email sent successfully");
    return { success: true, info };
  } catch (error) {
    console.error(error);
    return { success: false, error };
  }
};

const sendPasswordResetEmail = async (email, resetLink) => {
  try {
    const transport = getTransporter();
    await transport.verify();

    const htmlBody = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>Password Reset</title>
    <style>
      body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
      .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
      h1 { color: #333333; }
      p { color: #555555; line-height: 1.5; }
      a.button { display: inline-block; padding: 12px 24px; margin-top: 20px; background-color: rgb(211,46,149); color: white; text-decoration: none; border-radius: 5px; font-weight: bold; }
      a.button:hover { opacity: 0.9; }
      .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #eee; color: #999; font-size: 12px; }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Password Reset Request</h1>
      <p>We received a request to reset your password for your যত্ন : Jotno account.</p>
      <p>Click the button below to set a new password. This link will expire in <strong>10 minutes</strong>.</p>
      <a href="${resetLink}" class="button">Reset Password</a>
      <p>If you did not request a password reset, please ignore this email. Your password will remain unchanged.</p>
      <div class="footer">
        <p>Regards,<br>Team Jotno</p>
      </div>
    </div>
  </body>
</html>`;

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: "Password Reset - যত্ন : Jotno",
      text: "You requested a password reset. Use the link in this email to set a new password.",
      html: htmlBody,
    };

    const info = await transport.sendMail(mailOptions);
    console.log("Password reset email sent successfully");
    return { success: true, info };
  } catch (error) {
    console.error("Password reset email error:", error);
    return { success: false, error };
  }
};

export { sendEmail, sendPasswordResetEmail };
