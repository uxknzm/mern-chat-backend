import nodemailer from 'nodemailer';
// import nodemailerSendgrid from "nodemailer-sendgrid";

// const options = {
//   host: process.env.NODEMAILER_HOST || 'smtp.sendgrid.net',
//   port: Number(process.env.NODEMAILER_PORT) || 587,
//   auth: {
//     user: process.env.NODEMAILER_USER,
//     pass: process.env.NODEMAILER_PASS
//   }
// };

const transport = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,
  auth: {
    user: "apikey",
    pass: "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"
  }
});

export default transport;
