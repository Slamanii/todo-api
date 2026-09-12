const db = require('./db');

function insert(filePath) {
    const createdAt = new Date().toISOString();
    const info = db
        .prepare('INSERT INTO reports (path, created_at) VALUES (?, ?)')
        .run(filePath, createdAt);
    return findById(info.lastInsertRowid);
}

function findById(id) {
    return db.prepare('SELECT * FROM reports WHERE id = ?').get(id);
}

// Most recent report created on today's date (UTC), or undefined if none.
function findTodays() {
    const todayPrefix = new Date().toISOString().slice(0, 10);
    return db
        .prepare('SELECT * FROM reports WHERE created_at LIKE ? ORDER BY id DESC LIMIT 1')
        .get(`${todayPrefix}%`);
}

module.exports = { insert, findById, findTodays };
