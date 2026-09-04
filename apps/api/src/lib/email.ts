// @ts-ignore - nodemailer types optional for build
import * as nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@recruitconnect.ng';
const FROM_NAME = process.env.FROM_NAME || 'RecruitConnect OneHR';

const transporter = (nodemailer as any).createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
});

interface EmailOptions { to: string; subject: string; html: string; text?: string; }

export async function sendEmail({ to, subject, html, text }: EmailOptions) {
  if (!SMTP_USER || !SMTP_PASS) {
    console.log('[EMAIL MOCK] To:', to, 'Subject:', subject);
    return { messageId: 'mock-' + Date.now(), success: true };
  }
  try {
    const info = await transporter.sendMail({ from: `"${FROM_NAME}" <${FROM_EMAIL}>`, to, subject, html, text: text || html.replace(/<[^>]*>/g, '') });
    console.log('Email sent:', info.messageId);
    return { messageId: info.messageId, success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return { messageId: null, success: false, error };
  }
}

export function getLeaveStatusTemplate(employeeName: string, leaveType: string, status: string, startDate: string, endDate: string) {
  const color = status === 'APPROVED' ? '#16a34a' : '#dc2626';
  return `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><h2 style="color: #2563eb;">Leave Request ${status}</h2><p>Hello ${employeeName},</p><p>Your <strong>${leaveType}</strong> leave from <strong>${startDate}</strong> to <strong>${endDate}</strong> has been <strong style="color: ${color};">${status}</strong>.</p></div>`;
}
export function getPayrollTemplate(employeeName: string, month: string, year: number, netPay: number) {
  return `<div><h2>Payroll Processed</h2><p>Hello ${employeeName},</p><p>Salary for <strong>${month} ${year}</strong>: <strong>NGN ${netPay.toLocaleString()}</strong></p></div>`;
}
export function getWelcomeTemplate(employeeName: string, companyName: string) {
  return `<div><h2>Welcome to ${companyName}</h2><p>Hello ${employeeName},</p><p>Welcome to the team!</p></div>`;
}
