import express from 'express'

const app = express();

app.get('/', (req, res) => {
    res.json({ message: 'Hello Server' })
});

app.get('/health', (req, res) => {
    res.json({ status: "Ok" })
})

app.listen(3002, () => {
    console.log('Server is running on port 3002')
})