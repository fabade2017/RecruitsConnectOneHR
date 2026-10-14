"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailProviderName = emailProviderName;
exports.sendEmail = sendEmail;
exports.getLeaveStatusTemplate = getLeaveStatusTemplate;
exports.getPayrollTemplate = getPayrollTemplate;
exports.getWelcomeTemplate = getWelcomeTemplate;
exports.getStaffInviteTemplate = getStaffInviteTemplate;
// @ts-ignore - nodemailer types optional for build
const nodemailer = __importStar(require("nodemailer"));
// Email delivery. Render (and many PaaS) block outbound SMTP ports 25/465/587,
// so in production we send over HTTPS via a provider API (Resend or SendGrid).
// SMTP is kept as a fallback for local/dev environments that can reach an SMTP host.
function emailConfig() {
    const port = parseInt(process.env.SMTP_PORT || '587');
    const requested = (process.env.EMAIL_PROVIDER || '').toLowerCase();
    const resendKey = process.env.RESEND_API_KEY || '';
    const sendgridKey = process.env.SENDGRID_API_KEY || '';
    let provider = 'smtp';
    if (requested === 'resend' || (!requested && resendKey))
        provider = 'resend';
    else if (requested === 'sendgrid' || (!requested && sendgridKey))
        provider = 'sendgrid';
    return {
        provider,
        resendKey,
        sendgridKey,
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port,
        secure: port === 465,
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
        fromEmail: process.env.FROM_EMAIL || 'supports@rconehr.com',
        fromName: process.env.FROM_NAME || 'RecruitConnect OneHR',
    };
}
function emailProviderName() {
    return emailConfig().provider;
}
function http() {
    // Node 18+ global fetch; cast to any so no DOM lib types are required.
    const f = globalThis.fetch;
    if (typeof f !== 'function')
        throw new Error('global fetch unavailable — requires Node 18+');
    return f;
}
async function sendEmail({ to, subject, html, text }) {
    const cfg = emailConfig();
    const plain = text || html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const from = `"${cfg.fromName}" <${cfg.fromEmail}>`;
    if (cfg.provider === 'resend') {
        if (!cfg.resendKey)
            return notConfigured(to, subject);
        try {
            const res = await http()('https://api.resend.com/emails', {
                method: 'POST',
                headers: { Authorization: `Bearer ${cfg.resendKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ from, to: [to], subject, html, text: plain }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok)
                throw new Error(data?.message || data?.error?.message || `Resend HTTP ${res.status}`);
            console.log('Email sent via Resend:', data?.id);
            return { messageId: data?.id || null, success: true };
        }
        catch (error) {
            console.error('Resend send error:', error);
            return { messageId: null, success: false, error };
        }
    }
    if (cfg.provider === 'sendgrid') {
        if (!cfg.sendgridKey)
            return notConfigured(to, subject);
        try {
            const res = await http()('https://api.sendgrid.com/v3/mail/send', {
                method: 'POST',
                headers: { Authorization: `Bearer ${cfg.sendgridKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    personalizations: [{ to: [{ email: to }] }],
                    from: { email: cfg.fromEmail, name: cfg.fromName },
                    subject,
                    content: [{ type: 'text/html', value: html }],
                }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data?.errors?.[0]?.message || `SendGrid HTTP ${res.status}`);
            }
            const messageId = (res.headers && res.headers.get && res.headers.get('x-message-id')) || null;
            console.log('Email sent via SendGrid:', messageId);
            return { messageId, success: true };
        }
        catch (error) {
            console.error('SendGrid send error:', error);
            return { messageId: null, success: false, error };
        }
    }
    // SMTP fallback (local/dev only — blocked on Render)
    if (!cfg.user || !cfg.pass)
        return notConfigured(to, subject);
    try {
        const transporter = nodemailer.createTransport({
            host: cfg.host,
            port: cfg.port,
            secure: cfg.secure,
            auth: { user: cfg.user, pass: cfg.pass },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 15000,
        });
        const info = await transporter.sendMail({ from, to, subject, html, text: plain });
        console.log('Email sent via SMTP:', info.messageId);
        return { messageId: info.messageId, success: true };
    }
    catch (error) {
        console.error('Email send error (SMTP):', error);
        return { messageId: null, success: false, error };
    }
}
function notConfigured(to, subject) {
    console.error('[EMAIL NOT SENT] No email provider configured — set RESEND_API_KEY (recommended on Render) or SENDGRID_API_KEY, or SMTP_USER/SMTP_PASS. To:', to, 'Subject:', subject);
    return { messageId: null, success: false, notConfigured: true, error: new Error('Email not configured (set RESEND_API_KEY or SENDGRID_API_KEY; SMTP is blocked on Render)') };
}
function getLeaveStatusTemplate(employeeName, leaveType, status, startDate, endDate) {
    const color = status === 'APPROVED' ? '#16a34a' : '#dc2626';
    return `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><h2 style="color: #2563eb;">Leave Request ${status}</h2><p>Hello ${employeeName},</p><p>Your <strong>${leaveType}</strong> leave from <strong>${startDate}</strong> to <strong>${endDate}</strong> has been <strong style="color: ${color};">${status}</strong>.</p></div>`;
}
function getPayrollTemplate(employeeName, month, year, netPay) {
    return `<div><h2>Payroll Processed</h2><p>Hello ${employeeName},</p><p>Salary for <strong>${month} ${year}</strong>: <strong>NGN ${netPay.toLocaleString()}</strong></p></div>`;
}
function getWelcomeTemplate(employeeName, companyName) {
    return `<div><h2>Welcome to ${companyName}</h2><p>Hello ${employeeName},</p><p>Welcome to the team!</p></div>`;
}
function getStaffInviteTemplate(companyName, inviteUrl, role, expiresAt) {
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
