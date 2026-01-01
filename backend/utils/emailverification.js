import nodemailer from "nodemailer";
import { htmlContent } from "../htmlbody.js";
import dns from "dns/promises";
import dotenv from "dotenv";
dotenv.config();
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmail = async (email, verifytoken) => {
  try {
    const to = email;
    await transporter.verify();
    console.log("SMTP Server is ready to send messages");
    const link = `http://localhost:5173/verifyemail/${verifytoken}`;
    const mailOptions = {
      from: process.env.SMTP_USER,
      to,
      subject: "Email Verification",
      text: "Please verify your email by clicking the link below.",
      html: htmlContent(link),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");
    return { success: true, info };
  } catch (error) {
    console.error(error);
    return { success: false, error };
  }
};
export { sendEmail };
