const express = require('express');
const Database = require('better-sqlite3');

const db = new Database('tasks.db');

const app = express();

const swaggerUi = require('swagger-ui-express');
const openapiSpec = require('.//openapi.json');

app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));

app.use(express.json());

{ /* const tasks = [
    { id: 1, title: 'Learn Node.js', done: true },
    { id: 2, title: 'Complete Todo App using Express', done: false },
    { id: 3, title: 'Test the Api', done: false }
];
*/
}

db.prepare(` 
    CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    done BOOLEAN NOT NULL DEFAULT 0
)
`).run();

const count = db.prepare(`SELECT COUNT(*) AS count FROM tasks`).get();

if (count.count === 0) {
    const insert = db.prepare(`
        INSERT INTO tasks (title, done)
        VALUES (?, ?)
        `);

    insert.run('Learn Node.js', 1);
    insert.run('Complete Todo App using Express', 0);
    insert.run('Test the API', 0);
}

 


app.get('/', (req, res) => {
    res.json({ message: 'Hello Server' })
});

app.get('/health', (req, res) => {
    res.json({ status: "Ok" })
})

app.get('/tasks', (req, res) => {
    const tasks = db.prepare(`SELECT * FROM tasks`).all();

    const formattedTasks = tasks.map(task => ({
        ...task,
        done: Boolean(task.done)
    }))
    res.json(formattedTasks);
})

app.get('/tasks/:id', (req, res) => {
    const taskId = Number(req.params.id)

    const task = db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(taskId);

    if (!task) {
       return res.status(404).json({ error: "Task not found" });
    }

    res.json({
        ...task,
        done: Boolean(task.done)
    });
});

app.post('/tasks/', (req, res) => {
    const { title } = req.body;

    if (!title) {
        res.status(400).json({ error: "Title is required" })
    } else {
        const newTask = {
            id: tasks.length + 1,
            title,
            done: false,
        }
        tasks.push(newTask);
        
        res.status(201).json(newTask)
    }
})

app.put('/tasks/:id', (req, res) => {
    const taskId = Number(req.params.id);

    const task = tasks.find(t => t.id === taskId);

    if (!task) {
        return res.status(404).json({error: "Task not found" })
    }

    task.done = !task.done;

    res.status(200).json(task)
})

app.delete('/tasks/:id', (req, res) => {
    const taskId = Number(req.params.id);

    const taskPosition = tasks.findIndex(t => t.id === taskId);

    if (taskPosition === -1) {
        return res.status(404).json({error: "Task not found" })
    }

    tasks.splice(taskPosition, 1);

    res.status(204).send();

})


app.listen(3002, () => {
    console.log('Server is running on port 3002')
})