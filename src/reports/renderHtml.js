function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function bookRow(book) {
    return `
        <tr>
            <td>${escapeHtml(book.title)}</td>
            <td>${book.price.toFixed(2)}</td>
            <td>${book.rating}</td>
        </tr>`;
}

function renderHtml(reportData) {
    const generatedAt = new Date().toISOString();

    return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
    body { font-family: Helvetica, Arial, sans-serif; color: #1a1a1a; }
    h1 { margin-bottom: 0; }
    .meta { color: #666; margin-top: 4px; margin-bottom: 24px; }
    .totals { display: flex; gap: 32px; margin-bottom: 24px; }
    .totals div { border: 1px solid #ddd; border-radius: 6px; padding: 12px 16px; }
    .totals .label { color: #666; font-size: 12px; text-transform: uppercase; }
    .totals .value { font-size: 20px; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; font-size: 12px; }
    th { background: #f4f4f4; }
    tr { break-inside: avoid; }
    h2 { margin-top: 32px; }
</style>
</head>
<body>
    <h1>Bookstore Report</h1>
    <div class="meta">Generated ${escapeHtml(generatedAt)}</div>

    <div class="totals">
        <div>
            <div class="label">Total books</div>
            <div class="value">${reportData.total}</div>
        </div>
        <div>
            <div class="label">Average price</div>
            <div class="value">£${reportData.average_price.toFixed(2)}</div>
        </div>
    </div>

    <h2>Top 5 most expensive</h2>
    <table>
        <thead>
            <tr><th>Title</th><th>Price (£)</th><th>Rating</th></tr>
        </thead>
        <tbody>
            ${reportData.top_five.map(bookRow).join('')}
        </tbody>
    </table>

    <h2>All books (${reportData.books.length})</h2>
    <table>
        <thead>
            <tr><th>Title</th><th>Price (£)</th><th>Rating</th></tr>
        </thead>
        <tbody>
            ${reportData.books.map(bookRow).join('')}
        </tbody>
    </table>
</body>
</html>`;
}

module.exports = { renderHtml };
