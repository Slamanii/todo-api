const { Pool } = require('pg');

const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL
});

async function getAll() {
    const results = await pool.query(
        'SELECT * FROM tasks ORDER BY id'
    );

    return results.rows;
}

async function getById(id) {
    const results = await pool.query(
        'SELECT * FROM tasks WHERE id = $1',
        [id]
    );

    return results.rows[0];
}
async function create(title) {
    const results = await pool.query(
        `INSERT INTO tasks (title, done) VALUES ($1, FALSE) RETURNING *`,
        [title]
    );
    return results.rows[0];

    async function update(id, title, done) {
        const results = await pool.query(
            `UPDATE tasks
            SET title = $1, done = $2
            WHERE id = $3
            RETURNING *`,
            [title, done, id]
        );
        return results.rows[0];
    }

    async function remove(id) {
        const result = await pool.query(
            'DELETE FROM tasks WHERE id = $1',
            [id]
        );
        return result.rowCount > 0;
    }

module.exports = {
    getAll,
    getById,
    create,
    update,
    remove
};
}
