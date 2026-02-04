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
export { sendEmail };
