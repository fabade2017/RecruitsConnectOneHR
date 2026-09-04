'use client'

import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

interface PayrollData {
  id: string
  month: number
  year: number
  basicSalary: number
  allowances: number
  deductions: number
  tax: number
  netPay: number
  status: string
  paidAt: string | null
  employee: {
    firstName: string
    lastName: string
    employeeId: string
    email: string
    jobTitle: string
    department?: { name: string } | null
    joinDate: string
  }
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export function generatePayslipPDF(payroll: PayrollData) {
  const doc = new jsPDF()
  const emp = payroll.employee
  const monthYear = `${MONTHS[payroll.month - 1]} ${payroll.year}`

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
  doc.text(`Name: ${emp.firstName} ${emp.lastName}`, 14, 65)
  doc.text(`Employee ID: ${emp.employeeId}`, 14, 72)
  doc.text(`Job Title: ${emp.jobTitle}`, 14, 79)
  doc.text(`Department: ${emp.department?.name || 'N/A'}`, 14, 86)
  doc.text(`Email: ${emp.email}`, 14, 93)

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
  autoTable(doc, {
    startY: 105,
    head: [['Description', 'Amount (NGN)']],
    body: [
      ['Basic Salary', payroll.basicSalary.toLocaleString()],
      ['Allowances', payroll.allowances.toLocaleString()],
      ['', ''],
      ['Gross Pay', (payroll.basicSalary + payroll.allowances).toLocaleString()],
    ],
    headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255] },
    columnStyles: { 1: { halign: 'right' } },
    theme: 'striped',
  })

  // Deductions table
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 10,
    head: [['Deductions', 'Amount (NGN)']],
    body: [
      ['Tax (PAYE)', payroll.tax.toLocaleString()],
      ['Other Deductions', payroll.deductions.toLocaleString()],
      ['', ''],
      ['Total Deductions', (payroll.tax + payroll.deductions).toLocaleString()],
    ],
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
  doc.text(`NGN ${payroll.netPay.toLocaleString()}`, 190, netPayY + 4, { align: 'right' })

  // Footer
  doc.setTextColor(100, 100, 100)
  doc.setFontSize(9)
  doc.text('This is a computer-generated payslip and does not require a signature.', 105, 280, { align: 'center' })
  doc.text('For queries, contact HR at hr@recruitconnect.ng', 105, 286, { align: 'center' })

  doc.save(`payslip-${emp.employeeId}-${monthYear.replace(' ', '-')}.pdf`)
}
