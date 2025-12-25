import nodemailer from 'nodemailer';
import htmlContent from '../htmlbody.js'
import dns from "dns/promises";
import dotenv from 'dotenv'
dotenv.config();
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.USER,
        pass: process.env.PASS,
    }
 })


 const sendEmail = async (email) => {
    try {
        const domain = email.split('@')[1];
        await dns.resolveMx(domain);
        const to = email;
        const mailOptions = {
            from: process.env.USER,
            to,
            subject: 'Email Verification',
            text: 'Please verify your email by clicking the link below.',
            html: htmlContent,
    };

    
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
        return {success: true, info};
    } catch (error) {
        console.error('Error sending email:', error);
        return {success: false, error};
    }
}
export {sendEmail};