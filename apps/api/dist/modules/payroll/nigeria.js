"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_NIGERIA_RATES = exports.DEFAULT_PAYE_BANDS = void 0;
exports.parsePayeBands = parsePayeBands;
exports.annualPaye = annualPaye;
exports.computeNigeriaPayroll = computeNigeriaPayroll;
exports.DEFAULT_PAYE_BANDS = [
    { lower: 0, upper: 800000, rate: 0 },
    { lower: 800000, upper: 3000000, rate: 0.15 },
    { lower: 3000000, upper: 12000000, rate: 0.18 },
    { lower: 12000000, upper: 25000000, rate: 0.21 },
    { lower: 25000000, upper: 50000000, rate: 0.23 },
    { lower: 50000000, upper: null, rate: 0.25 },
];
exports.DEFAULT_NIGERIA_RATES = {
    currency: 'NGN',
    employeePensionRate: 0.08,
    employerPensionRate: 0.1,
    nhfRate: 0.025,
    nhisEmployeeRate: 0.05,
    nhisEmployerRate: 0.1,
    nsitfRate: 0.01,
    itfRate: 0.01,
    rentReliefRate: 0.2,
    rentReliefCap: 500000,
    employerItfLiable: true,
    payeBands: exports.DEFAULT_PAYE_BANDS,
};
const round2 = (n) => Math.round((Number.isFinite(n) ? n : 0) * 100) / 100;
const num = (v) => {
    const n = typeof v === 'string' ? parseFloat(v) : Number(v);
    return Number.isFinite(n) ? n : 0;
};
function parsePayeBands(raw) {
    if (!raw)
        return exports.DEFAULT_PAYE_BANDS;
    if (Array.isArray(raw))
        return raw;
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length)
            return parsed;
    }
    catch {
        /* ignore */
    }
    return exports.DEFAULT_PAYE_BANDS;
}
function annualPaye(chargeableIncome, bands) {
    let remaining = Math.max(0, chargeableIncome);
    let tax = 0;
    const sorted = [...bands].sort((a, b) => a.lower - b.lower);
    for (const band of sorted) {
        if (remaining <= 0)
            break;
        const bandWidth = band.upper == null ? remaining : Math.max(0, band.upper - band.lower);
        const taxable = Math.min(remaining, bandWidth);
        tax += taxable * num(band.rate);
        remaining -= taxable;
    }
    return round2(tax);
}
function computeNigeriaPayroll(rawInput, rawRates = exports.DEFAULT_NIGERIA_RATES) {
    const input = {
        basicSalary: num(rawInput.basicSalary),
        housingAllowance: num(rawInput.housingAllowance),
        transportAllowance: num(rawInput.transportAllowance),
        otherTaxable: num(rawInput.otherTaxable),
        nonTaxable: num(rawInput.nonTaxable),
        annualRentPaid: num(rawInput.annualRentPaid),
        nhisEnrolled: !!rawInput.nhisEnrolled,
        nhfEnrolled: rawInput.nhfEnrolled !== false,
        otherDeductions: num(rawInput.otherDeductions),
        loanRepayment: num(rawInput.loanRepayment),
    };
    const rates = {
        ...exports.DEFAULT_NIGERIA_RATES,
        ...rawRates,
        payeBands: parsePayeBands(rawRates?.payeBands),
    };
    const grossPay = round2(input.basicSalary + input.housingAllowance + input.transportAllowance + input.otherTaxable + input.nonTaxable);
    const pensionBase = round2(input.basicSalary + input.housingAllowance + input.transportAllowance);
    const employeePension = round2(pensionBase * num(rates.employeePensionRate));
    const employerPension = round2(pensionBase * num(rates.employerPensionRate));
    const nhf = input.nhfEnrolled ? round2(input.basicSalary * num(rates.nhfRate)) : 0;
    const nhisEmployee = input.nhisEnrolled ? round2(input.basicSalary * num(rates.nhisEmployeeRate)) : 0;
    const nhisEmployer = input.nhisEnrolled ? round2(input.basicSalary * num(rates.nhisEmployerRate)) : 0;
    const monthlyTaxableGross = round2(input.basicSalary + input.housingAllowance + input.transportAllowance + input.otherTaxable);
    const annualTaxableGross = round2(monthlyTaxableGross * 12);
    const rentRelief = Math.min(round2(input.annualRentPaid * num(rates.rentReliefRate)), round2(num(rates.rentReliefCap)));
    const annualChargeableIncome = Math.max(0, round2(annualTaxableGross - employeePension * 12 - nhf * 12 - nhisEmployee * 12 - rentRelief));
    const annualPayeValue = annualPaye(annualChargeableIncome, rates.payeBands);
    const monthlyPaye = round2(annualPayeValue / 12);
    const totalEmployeeDeductions = round2(employeePension + nhf + nhisEmployee + input.otherDeductions + input.loanRepayment);
    const netPay = round2(grossPay - totalEmployeeDeductions - monthlyPaye);
    const nsitf = round2(grossPay * num(rates.nsitfRate));
    const itf = rates.employerItfLiable ? round2(grossPay * num(rates.itfRate)) : 0;
    const employerCost = round2(grossPay + employerPension + nhisEmployer + nsitf + itf);
    const groupLifeCover = round2(grossPay * 12 * 3);
    const totalStatutoryCost = round2(monthlyPaye + employeePension + nhf + nhisEmployee + employerPension + nhisEmployer + nsitf + itf);
    return {
        basicSalary: round2(input.basicSalary),
        housingAllowance: round2(input.housingAllowance),
        transportAllowance: round2(input.transportAllowance),
        otherTaxable: round2(input.otherTaxable),
        nonTaxable: round2(input.nonTaxable),
        grossPay,
        pensionBase,
        employeePension,
        employerPension,
        nhf,
        nhisEmployee,
        nhisEmployer,
        annualTaxableGross,
        rentRelief,
        annualChargeableIncome,
        monthlyChargeableIncome: round2(annualChargeableIncome / 12),
        annualPaye: annualPayeValue,
        monthlyPaye,
        otherDeductions: round2(input.otherDeductions),
        loanRepayment: round2(input.loanRepayment),
        totalEmployeeDeductions,
        netPay,
        nsitf,
        itf,
        employerCost,
        groupLifeCover,
        totalStatutoryCost,
    };
}
