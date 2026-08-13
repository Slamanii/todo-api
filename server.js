import express from 'express'

const app = express();

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


app.listen(3002, () => {
    console.log('Server is running on port 3002')
})