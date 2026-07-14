import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async (to: string, subject: string, html: string) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[email] to: ${to}, subject: ${subject}`);
    return;
  }
  
  return await resend.emails.send({
    from: 'CloudKeeper <no-reply@cloudkeeper.app>',
    to,
    subject,
    html,
  });
};
