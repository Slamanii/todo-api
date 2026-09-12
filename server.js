require('dotenv').config();

if (typeof globalThis.WebSocket === 'undefined') {
    globalThis.WebSocket = require('ws');
}

const { createClient } = require('@supabase/supabase-js');


const express = require('express');
const Database = require('better-sqlite3');
const repository = require('./postgresRepository');
const bankNormalizer = require('./src/bank-normalizer/service');
const { getReportData } = require('./src/reports/getReportData');
const { generatePdf } = require('./src/reports/generatePdf');
const reportsRepository = require('./src/reports/reportsRepository');

const db = new Database('tasks.db');

const app = express();

const swaggerUi = require('swagger-ui-express');
const openapiSpec = require('.//openapi.json');

app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));

app.use(express.json());





const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_PUBLISHABLE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false
        }
    }
);

async function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            error: 'Authorization header required'
        });
    }

    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({
            error: 'Invalid Authorization header'
        });
    }

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
        return res.status(401).json({
            error: 'Invalid or expired token'
        });
    }

    req.user = data.user;
    req.token = token;

    next();
}

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


//Supabase authentication endpoints
 app.post('/auth/signup', async (req, res) => {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signUp({
        email,
        password
    });

    if (error) {
        return res.status(400).json({
            error: error.message
        });
    }

    res.status(201).json(data);
});

app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        return res.status(401).json({
            error: error.message
        });
    }

    res.json(data);
});


app.get('/public/info', (req, res) => {
    res.json({
        message: 'This is public information'
    });
});


app.get('/protected/profile', authMiddleware, (req, res) => {
    res.json({
        id: req.user.id,
        email: req.user.email,
        created_at: req.user.created_at
    });
});


app.get('/protected/dashboard', authMiddleware, (req, res) => {
    res.json({
        message: 'Welcome to your dashboard',
        user_id: req.user.id
    });
});


app.post('/auth/logout', authMiddleware, async (req, res) => {
    const { error } = await supabase.auth.signOut({
        scope: 'local'
    });

    if (error) {
        return res.status(400).json({
            error: error.message
        });
    }

    res.status(204).send();
});

app.post('/normalize', async (req, res) => {
    const { error, rawName } = bankNormalizer.validateInput(req.body);

    if (error) {
        return res.status(400).json({ error });
    }

    try {
        const result = await bankNormalizer.normalize(rawName);
        res.status(200).json(result);
    } catch (err) {
        res.status(422).json({ error: 'Could not produce a valid classification' });
    }
});

///endpoints
app.get('/', (req, res) => {
    res.json({ message: 'Hello Server' })
});

app.get('/health', (req, res) => {
    res.json({ status: "Ok" })
})

app.get('/tasks', (req, res) => {
    const tasks = repository.getAll();

    const formattedTasks = tasks.map(task => ({
        ...task,
        done: Boolean(task.done)
    }))
    res.json(formattedTasks);
})

app.get('/tasks/:id', (req, res) => {
    const taskId = Number(req.params.id)

    const task = repository.getById(taskId);

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

    if (!title || title.trim() === '') {
        res.status(400).json({ error: "Title is required" })
    } 
    
    const task = repository.create(title);
                
        res.status(201).json(task);
    
});

app.put('/tasks/:id', (req, res) => {
    const taskId = Number(req.params.id);
    const { title, done } = req.body;

    if (!title || title.trim() === '') {
        return res.status(400).json({ error: 'Title is required' });
    }

    const task = repository.update(taskId, title, done);

    res.json(task);
});


app.delete('tasks/:id', (req, res) => {
    const id = Number(req.params.id);

    const deleted = repository.remove(id);

    if (!deleted) {
        return res.status(404).json({ error: 'Task not found'})
    }

    res.status(204).send();
})

function reportResponse(report) {
    return {
        id: report.id,
        path: report.path,
        created_at: report.created_at,
        file_url: `/reports/${report.id}/file`,
    };
}

app.post('/reports', async (req, res) => {
    const force = Boolean(req.body && req.body.force === true);

    if (!force) {
        const existing = reportsRepository.findTodays();
        if (existing) {
            return res.status(200).json(reportResponse(existing));
        }
    }

    const reportData = getReportData();
    const filePath = await generatePdf(reportData);
    const report = reportsRepository.insert(filePath);

    res.status(201).json(reportResponse(report));
});

app.get('/reports/:id', (req, res) => {
    const report = reportsRepository.findById(Number(req.params.id));

    if (!report) {
        return res.status(404).json({ error: 'Report not found' });
    }

    res.json(report);
});

app.get('/reports/:id/file', (req, res) => {
    const report = reportsRepository.findById(Number(req.params.id));

    if (!report) {
        return res.status(404).json({ error: 'Report not found' });
    }

    res.sendFile(report.path);
});

app.listen(3002, () => {
    console.log('Server is running on port 3002')
})