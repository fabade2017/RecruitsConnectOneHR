"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDate = formatDate;
exports.formatCurrency = formatCurrency;
exports.formatNumber = formatNumber;
function formatDate(date) {
    return new Date(date).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' });
}
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
}
function formatNumber(num) {
    return new Intl.NumberFormat('en-NG').format(num);
}
