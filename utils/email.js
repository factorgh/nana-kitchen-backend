// fervid - gain - aspire - abound;
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  service: "gmail",
  port: 587,
  secure: false,
  debug: true,
  auth: {
    user: "burchellsbale@gmail.com",
    pass: "omcj ypcb qapd cvtq", // Your app password
  },
});

// Function to send an email
export const sendEmail = async (emailData) => {
  try {
    await transporter.sendMail(emailData);

    console.log("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
};
