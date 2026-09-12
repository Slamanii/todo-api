const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { renderHtml } = require('./renderHtml');

const REPORTS_DIR = path.join(__dirname, '..', '..', 'reports');

async function generatePdf(reportData) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });

    const filename = `report-${Date.now()}.pdf`;
    const filePath = path.join(REPORTS_DIR, filename);

    const html = renderHtml(reportData);

    const browser = await chromium.launch();
    try {
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'load' });
        await page.pdf({ path: filePath, format: 'A4', printBackground: true });
    } finally {
        await browser.close();
    }

    return filePath;
}

module.exports = { generatePdf, REPORTS_DIR };
