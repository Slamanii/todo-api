const fs = require('fs');
const path = require('path');
const db = require('../src/reports/db');

const booksPath = path.join(__dirname, '..', 'data', 'books.json');
const books = JSON.parse(fs.readFileSync(booksPath, 'utf-8'));

db.prepare('DELETE FROM books').run();

const insert = db.prepare(
    'INSERT INTO books (title, price, rating, url) VALUES (?, ?, ?, ?)'
);

const insertAll = db.transaction((rows) => {
    for (const row of rows) {
        insert.run(row.title, row.price, row.rating, row.product_url);
    }
});

insertAll(books);

const { count } = db.prepare('SELECT COUNT(*) AS count FROM books').get();
console.log(`seeded books table: ${count} rows`);
