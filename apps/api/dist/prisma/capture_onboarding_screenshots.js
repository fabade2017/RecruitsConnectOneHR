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
const path = __importStar(require("path"));
const ROLES = [
    { role: 'hr_admin', email: 'hr@recruitconnect.ng', pass: 'Test@123', expectedUrl: '/hr', name: 'hr' },
    { role: 'manager', email: 'manager@recruitconnect.ng', pass: 'Test@123', expectedUrl: '/manager', name: 'manager' },
    { role: 'org_admin', email: 'admin@recruitconnect.ng', pass: 'Admin@123', expectedUrl: '/hr', name: 'admin' },
    { role: 'employee', email: 'employee@recruitconnect.ng', pass: 'Test@123', expectedUrl: '/employee', name: 'employee' },
];
async function capture() {
    let playwright;
    try {
        playwright = require('/Users/mac/m15/ProjectA/node_modules/playwright');
    }
    catch {
        try {
            playwright = require('playwright');
        }
        catch {
            try {
                playwright = require('@playwright/test');
            }
            catch (e) {
                console.error('Playwright not found. Install: npm i -D playwright && npx playwright install chromium');
                console.error('Falling back to placeholder generation...');
                return false;
            }
        }
    }
    const { chromium } = playwright;
    const browser = await chromium.launch({ headless: true });
    const outDir = '/tmp';
    for (const r of ROLES) {
        const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
        const page = await context.newPage();
        console.log(`\n[${r.role}] ${r.email} -> ${r.expectedUrl}`);
        await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
        await page.screenshot({ path: path.join(outDir, `login-${r.name}.png`), fullPage: false });
        console.log(`  saved /tmp/login-${r.name}.png`);
        // Fill login
        await page.fill('input[placeholder="Email"]', r.email);
        await page.fill('input[placeholder="Password"]', r.pass);
        await page.click('button:has-text("Sign in")');
        try {
            await page.waitForURL(`**${r.expectedUrl}*`, { timeout: 8000 });
            console.log(`  landed ${r.expectedUrl}`);
        }
        catch {
            // Employee goes to /attendance via popup, wait a bit
            await page.waitForTimeout(2000);
            console.log(`  no navigation to ${r.expectedUrl}, current ${page.url()}`);
        }
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(outDir, `dashboard-${r.name}.png`), fullPage: true });
        console.log(`  saved /tmp/dashboard-${r.name}.png`);
        // Go to onboarding
        await page.goto('http://localhost:3000/onboarding', { waitUntil: 'networkidle' });
        await page.waitForTimeout(1500);
        await page.screenshot({ path: path.join(outDir, `onboarding-${r.name}.png`), fullPage: true });
        console.log(`  saved /tmp/onboarding-${r.name}.png`);
        // Verify audit endpoints
        const token = await page.evaluate(() => localStorage.getItem('onehr_token'));
        console.log(`  token ${token ? 'present' : 'missing'} ${token?.slice(0, 20) || ''}`);
        await context.close();
    }
    await browser.close();
    console.log('\nAll screenshots saved to /tmp/*.png');
    return true;
}
capture().then(ok => {
    if (!ok) {
        // Generate placeholders via pdfkit rectangles instead
        console.log('Placeholders will be used in PDF - run npx playwright install chromium and retry for real captures');
    }
}).catch(e => { console.error(e); process.exit(1); });
