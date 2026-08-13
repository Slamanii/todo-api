const express = require('express');

const app = express();

const swaggerUi = require('swagger-ui-express');
const openapiSpec = require('.//openapi.json');

app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));

app.use(express.json());

const tasks = [
    { id: 1, title: 'Learn Node.js', done: true },
    { id: 2, title: 'Complete Todo App using Express', done: false },
    { id: 3, title: 'Test the Api', done: false }
];

app.get('/', (req, res) => {
    res.json({ message: 'Hello Server' })
});

app.get('/health', (req, res) => {
    res.json({ status: "Ok" })
})

app.get('/tasks', (req, res) => {
    res.json({ tasks })
})

app.get('/tasks/:id', (req, res) => {
    const taskId = Number(req.params.id)

    const task = tasks.find(t => t.id === taskId);

    if (!task) {
       return res.status(404).json({ error: "Task not found" });
    }

    res.json(task);
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