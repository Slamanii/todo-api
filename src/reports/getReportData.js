const db = require('./db');

function getReportData() {
    const { total } = db.prepare('SELECT COUNT(*) AS total FROM books').get();

    const { average_price } = db.prepare('SELECT AVG(price) AS average_price FROM books').get();

    const topFive = db
        .prepare('SELECT title, price, rating, url FROM books ORDER BY price DESC LIMIT 5')
        .all();

    const byRating = db
        .prepare('SELECT rating, COUNT(*) AS count FROM books GROUP BY rating ORDER BY rating')
        .all();

    return {
        total,
        average_price,
        top_five: topFive,
        by_rating: byRating,
    };
}

module.exports = { getReportData };
