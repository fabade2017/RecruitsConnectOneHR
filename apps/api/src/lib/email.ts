// @ts-ignore - nodemailer types optional for build
import * as nodemailer from 'nodemailer';

// Read config at call time (not module load) so late-loaded .env / platform env is honoured.
function smtpConfig() {
  const port = parseInt(process.env.SMTP_PORT || '587');
  return {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure: port === 465,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    fromEmail: process.env.FROM_EMAIL || 'supports@rconehr.com',
    fromName: process.env.FROM_NAME || 'RecruitConnect OneHR',
  };
}

interface EmailOptions { to: string; subject: string; html: string; text?: string; }

export async function sendEmail({ to, subject, html, text }: EmailOptions) {
  const cfg = smtpConfig();
  if (!cfg.user || !cfg.pass) {
    console.error('[EMAIL NOT SENT] SMTP_USER/SMTP_PASS not configured — set them in the deployment environment. To:', to, 'Subject:', subject);
    return { messageId: null, success: false, notConfigured: true, error: new Error('SMTP not configured (SMTP_USER/SMTP_PASS missing)') };
  }
  try {
    const transporter = (nodemailer as any).createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      auth: { user: cfg.user, pass: cfg.pass },
    });
    const info = await transporter.sendMail({ from: `"${cfg.fromName}" <${cfg.fromEmail}>`, to, subject, html, text: text || html.replace(/<[^>]*>/g, '') });
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

export function getStaffInviteTemplate(companyName: string, inviteUrl: string, role: string, expiresAt: string) {
  return `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: #4f46e5; color: #fff; padding: 24px; border-radius: 12px 12px 0 0;">
      <h1 style="margin: 0; font-size: 20px;">You're invited to join ${companyName}</h1>
    </div>
    <div style="border: 1px solid #e2e8f0; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
      <p>Hello,</p>
      <p>You have been invited to join <strong>${companyName}</strong> on RecruitConnect OneHR as <strong>${role}</strong>.</p>
      <p>Click the button below to create your profile and set your password. This link expires on <strong>${expiresAt}</strong>.</p>
      <p style="text-align: center; margin: 28px 0;">
        <a href="${inviteUrl}" style="background: #4f46e5; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: bold;">Create my profile</a>
      </p>
      <p style="color: #64748b; font-size: 12px;">If the button doesn't work, copy and paste this link into your browser:<br>${inviteUrl}</p>
      <p style="color: #64748b; font-size: 12px;">If you weren't expecting this invitation, you can safely ignore this email.</p>
    </div>
  </div>`;
}
