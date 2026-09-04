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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
exports.getLeaveStatusTemplate = getLeaveStatusTemplate;
exports.getPayrollTemplate = getPayrollTemplate;
exports.getWelcomeTemplate = getWelcomeTemplate;
// @ts-ignore - nodemailer types optional for build
const nodemailer = __importStar(require("nodemailer"));
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@recruitconnect.ng';
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
