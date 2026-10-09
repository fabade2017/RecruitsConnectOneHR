'use client'

import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export interface PayslipPayrollData {
  id: string
  month: number
  year: number
  basicSalary: number | string
  allowances: number | string
  deductions: number | string
  tax: number | string
  netPay: number | string
  status: string
  paidAt?: string | null
  currency?: string
  grossPay?: number | string
  housingAllowance?: number | string
  transportAllowance?: number | string
  otherTaxable?: number | string
  nonTaxable?: number | string
  employeePension?: number | string
  employerPension?: number | string
  nhf?: number | string
  nhisEmployee?: number | string
  nhisEmployer?: number | string
  nsitf?: number | string
  itf?: number | string
  rentRelief?: number | string
  chargeableIncome?: number | string
  loanRepayment?: number | string
  groupLifeCover?: number | string
  employerCost?: number | string
  employee?: {
    firstName?: string | null
    lastName?: string | null
    name?: string | null
    employeeCode?: string | null
    employeeId?: string | null
    email?: string | null
    jobTitle?: string | null
    department?: { name?: string | null } | null
  } | null
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const n = (v: number | string | undefined | null) => {
  const parsed = typeof v === 'string' ? parseFloat(v) : Number(v)
  return Number.isFinite(parsed) ? parsed : 0
}
const money = (currency: string, v: number | string | undefined | null) => `${currency} ${n(v).toLocaleString()}`

export function generatePayslipPDF(payroll: PayslipPayrollData) {
  const doc = new jsPDF()
  const emp = payroll.employee || {}
  const currency = payroll.currency || 'NGN'
  const monthYear = `${MONTHS[payroll.month - 1]} ${payroll.year}`
  const fullName = [emp.firstName, emp.lastName].filter(Boolean).join(' ') || emp.name || emp.employeeCode || 'Employee'
  const employeeCode = emp.employeeCode || emp.employeeId || 'N/A'
  const hasNigeriaData = payroll.grossPay !== undefined && payroll.grossPay !== null

  // Header
  doc.setFillColor(37, 99, 235)
  doc.rect(0, 0, 210, 40, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.text('RECRUITCONNECT ONEHR', 105, 20, { align: 'center' })
  doc.setFontSize(12)
  doc.text('PAYSLIP', 105, 32, { align: 'center' })

  // Employee info
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(11)
  doc.text('Employee Information', 14, 55)
  doc.setFontSize(10)
  doc.text(`Name: ${fullName}`, 14, 65)
  doc.text(`Employee ID: ${employeeCode}`, 14, 72)
  doc.text(`Job Title: ${emp.jobTitle || 'N/A'}`, 14, 79)
  doc.text(`Department: ${emp.department?.name || 'N/A'}`, 14, 86)
  doc.text(`Email: ${emp.email || 'N/A'}`, 14, 93)

  // Period
  doc.setFontSize(11)
  doc.text('Pay Period', 140, 55)
  doc.setFontSize(10)
  doc.text(`${monthYear}`, 140, 65)
  doc.text(`Status: ${payroll.status}`, 140, 72)
  if (payroll.paidAt) {
    doc.text(`Paid: ${new Date(payroll.paidAt).toLocaleDateString('en-NG')}`, 140, 79)
  }

  // Earnings table
  const earnings: string[][] = hasNigeriaData
    ? [
        ['Basic Salary', n(payroll.basicSalary).toLocaleString()],
        ['Housing Allowance', n(payroll.housingAllowance).toLocaleString()],
        ['Transport Allowance', n(payroll.transportAllowance).toLocaleString()],
        ['Other Taxable Allowances', n(payroll.otherTaxable).toLocaleString()],
        ['Non-Taxable Allowances', n(payroll.nonTaxable).toLocaleString()],
        ['', ''],
        ['Total Gross Pay', n(payroll.grossPay).toLocaleString()],
      ]
    : [
        ['Basic Salary', n(payroll.basicSalary).toLocaleString()],
        ['Allowances', n(payroll.allowances).toLocaleString()],
        ['', ''],
        ['Gross Pay', (n(payroll.basicSalary) + n(payroll.allowances)).toLocaleString()],
      ]

  autoTable(doc, {
    startY: 105,
    head: [[`Earnings (${currency})`, 'Amount']],
    body: earnings,
    headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255] },
    columnStyles: { 1: { halign: 'right' } },
    theme: 'striped',
  })

  const deductions: string[][] = hasNigeriaData
    ? [
        ['PAYE (Monthly)', n(payroll.tax).toLocaleString()],
        ['Employee Pension', n(payroll.employeePension).toLocaleString()],
        ['NHF', n(payroll.nhf).toLocaleString()],
        ['NHIS (Employee)', n(payroll.nhisEmployee).toLocaleString()],
        ['Loan Repayment', n(payroll.loanRepayment).toLocaleString()],
        ['', ''],
        ['Total Deductions', (n(payroll.tax) + n(payroll.employeePension) + n(payroll.nhf) + n(payroll.nhisEmployee) + n(payroll.loanRepayment)).toLocaleString()],
      ]
    : [
        ['Tax (PAYE)', n(payroll.tax).toLocaleString()],
        ['Other Deductions', n(payroll.deductions).toLocaleString()],
        ['', ''],
        ['Total Deductions', (n(payroll.tax) + n(payroll.deductions)).toLocaleString()],
      ]

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 10,
    head: [[`Deductions (${currency})`, 'Amount']],
    body: deductions,
    headStyles: { fillColor: [220, 38, 38], textColor: [255, 255, 255] },
    columnStyles: { 1: { halign: 'right' } },
    theme: 'striped',
  })

  // Net pay
  const netPayY = (doc as any).lastAutoTable.finalY + 15
  doc.setFillColor(22, 163, 74)
  doc.rect(14, netPayY - 8, 182, 20, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.text('NET PAY', 20, netPayY + 4)
  doc.text(money(currency, payroll.netPay), 190, netPayY + 4, { align: 'right' })

  // Employer statutory summary (Nigeria)
  if (hasNigeriaData) {
    autoTable(doc, {
      startY: netPayY + 20,
      head: [['Employer Statutory Costs', `Amount (${currency})`]],
      body: [
        ['Employer Pension', n(payroll.employerPension).toLocaleString()],
        ['NHIS (Employer)', n(payroll.nhisEmployer).toLocaleString()],
        ['NSITF (1%)', n(payroll.nsitf).toLocaleString()],
        ['ITF (1%)', n(payroll.itf).toLocaleString()],
        ['Rent Relief Applied', n(payroll.rentRelief).toLocaleString()],
        ['Group Life Minimum Cover', n(payroll.groupLifeCover).toLocaleString()],
        ['', ''],
        ['Total Employer Cost', n(payroll.employerCost).toLocaleString()],
      ],
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
      columnStyles: { 1: { halign: 'right' } },
      theme: 'striped',
    })
  }

  // Footer
  doc.setTextColor(100, 100, 100)
  doc.setFontSize(9)
  doc.text('This is a computer-generated payslip and does not require a signature.', 105, 280, { align: 'center' })
  doc.text('For queries, contact HR at hr@recruitconnect.ng', 105, 286, { align: 'center' })

  doc.save(`payslip-${employeeCode}-${monthYear.replace(' ', '-')}.pdf`)
}
