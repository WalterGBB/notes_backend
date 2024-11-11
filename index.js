require('dotenv').config()

const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const app = express()
const Note = require('./models/note')

app.use(cors())
app.use(morgan(':method :url :status - :res[content-length] - :response-time ms - :body'))
app.use(express.json())
app.use(express.static('dist'))

morgan.token('body', (req, res) => {
    if (req.method === 'POST') return JSON.stringify({ id: res.locals.createdNoteId, ...req.body })
    if (req.method === 'PUT') return res.locals.updatedBody
    return '{}'
})

const mongoose = require('mongoose')
const password = process.argv[2]
const url =
    `mongodb+srv://waztercraft:${password}@cluster0.wsmtr.mongodb.net/noteApp?retryWrites=true&w=majority&appName=Cluster0`

mongoose.set('strictQuery', false)
mongoose.connect(url)

const noteSchema = new mongoose.Schema({
    content: String,
    important: Boolean,
})

noteSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString()
        delete returnedObject._id
        delete returnedObject.__v
    }
})

let notes = [
    {
        id: 1,
        content: "HTML is easy",
        important: true
    },
    {
        id: 2,
        content: "Browser can execute only JavaScript",
        important: false
    },
    {
        id: 3,
        content: "GET and POST are the most important methods of HTTP protocol",
        important: true
    }
]

app.get('/', (request, response) => {
    response.send('<h1>Hello World!</h1>')
})

app.get('/api/notes', (request, response) => {
    Note.find({}).then(notes => {
        response.json(notes)
    })
})

app.get('/api/notes/:id', (request, response) => {
    const id = Number(request.params.id)
    const note = notes.find(note => note.id === id)


    if (note) {
        response.json(note)
    } else {
        response.status(404).end()
    }
})

const generateId = () => {
    const maxId = notes.length > 0
        ? Math.max(...notes.map(n => n.id))
        : 0
    return maxId + 1
}

app.post('/api/notes', (request, response) => {
    const body = request.body

    if (!body.content) {
        return response.status(400).json({
            error: 'content missing'
        })
    }

    const note = {
        id: generateId(),
        content: body.content,
        important: Boolean(body.important)
    }

    notes = notes.concat(note)
    response.locals.createdNoteId = note.id
    response.json(note)
})

app.delete('/api/notes/:id', (request, response) => {
    const id = Number(request.params.id)
    notes = notes.filter(note => note.id !== id)

    response.status(204).end()
})

app.put('/api/notes/:id', (request, response) => {
    const id = Number(request.params.id)
    const note = notes.find(n => n.id === id)
    const updatedNote = { ...note, important: !note.important }

    if (note) {
        notes = notes.map(note => note.id !== id ? note : updatedNote)
        response.locals.updatedBody = JSON.stringify(updatedNote)
        return response.json(updatedNote)
    } else {
        return response.json(updatedNote)
    }
})

const PORT = process.env.PORT
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})