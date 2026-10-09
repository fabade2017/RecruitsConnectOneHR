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
exports.sendEmail = sendEmail;
exports.getLeaveStatusTemplate = getLeaveStatusTemplate;
exports.getPayrollTemplate = getPayrollTemplate;
exports.getWelcomeTemplate = getWelcomeTemplate;
exports.getStaffInviteTemplate = getStaffInviteTemplate;
// @ts-ignore - nodemailer types optional for build
const nodemailer = __importStar(require("nodemailer"));
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const FROM_EMAIL = process.env.FROM_EMAIL || 'supports@rconehr.com';
const FROM_NAME = process.env.FROM_NAME || 'RecruitConnect OneHR';
const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
});
async function sendEmail({ to, subject, html, text }) {
    if (!SMTP_USER || !SMTP_PASS) {
        console.log('[EMAIL MOCK] To:', to, 'Subject:', subject);
        return { messageId: 'mock-' + Date.now(), success: true };
    }
    try {
        const info = await transporter.sendMail({ from: `"${FROM_NAME}" <${FROM_EMAIL}>`, to, subject, html, text: text || html.replace(/<[^>]*>/g, '') });
        console.log('Email sent:', info.messageId);
        return { messageId: info.messageId, success: true };
    }
    catch (error) {
        console.error('Email send error:', error);
        return { messageId: null, success: false, error };
    }
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
