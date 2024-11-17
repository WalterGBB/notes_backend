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

// let notes = [
//     {
//         id: 1,
//         content: "HTML is easy",
//         important: true
//     },
//     {
//         id: 2,
//         content: "Browser can execute only JavaScript",
//         important: false
//     },
//     {
//         id: 3,
//         content: "GET and POST are the most important methods of HTTP protocol",
//         important: true
//     }
// ]

// app.get('/', (request, response) => {
//     response.send('<h1>Hello World!</h1>')
// })

app.get('/api/notes', (request, response) => {
    Note.find({}).then(notes => {
        response.json(notes)
    })
})

app.get('/api/notes/:id', (request, response, next) => {
    const { id } = request.params
    Note.findById(id)
        .then(note => {
            if (note) {
                response.json(note)
            } else {
                response.status(404).end()
            }
        })
        .catch(error => next(error))
})

// const generateId = () => {
//     const maxId = notes.length > 0
//         ? Math.max(...notes.map(n => n.id))
//         : 0
//     return maxId + 1
// }

app.post('/api/notes', (request, response, next) => {
    const body = request.body

    if (body.content === undefined || body.content.length === 0) {
        return response.status(400).json({
            error: 'content missing'
        })
    }

    const note = new Note({
        content: body.content,
        important: Boolean(body.important)
    })

    note.save()
        .then(savedNote => {
            response.status(201).json({
                message: 'Successfully created',
                id: savedNote.id,
                content: savedNote.content,
                important: savedNote.important
            })
        })
        .catch(error => next(error))
})

app.delete('/api/notes/:id', (request, response, next) => {
    const { id } = request.params
    Note.findByIdAndDelete(id)
        .then(() => {
            response.status(204).end()  // 204 indica que la eliminación fue exitosa y no hay contenido que devolver
        })
        .catch(error => next(error))
})

app.put('/api/notes/:id', (request, response, next) => {
    const { id } = request.params
    const { content, important } = request.body

    Note.findByIdAndUpdate(
        id,
        { content, important },
        /*runValidators: true fuerza a que Mongoose valide los datos antes de 
        actualizarlos en la base de datos */
        /*Se especifica el contexto 'query', que es necesario para que ciertas 
        validaciones (como validaciones personalizadas o dependientes de otras 
        propiedades) funcionen durante una actualización con findByIdAndUpdate. */
        { new: true, runValidators: true, context: 'query' }
    )
        .then(updatedNote => {
            response.json(updatedNote)
        })
        .catch(error => next(error))
})

// Todas las rutas deben ser registrada antes que esto:
const unknownEndpoint = (request, response) => {
    response.status(404).send({ error: 'unknown endpoint' })
}

// controlador de solicitudes con endpoint desconocido
app.use(unknownEndpoint)

// controlador de errores
const errorHandler = (error, request, response, next) => {
    console.error(error.message)

    if (error.name === 'CastError') {
        return response.status(400).send({ error: 'malformatted id' })
    } else if (error.name === 'ValidationError') {
        return response.status(400).json({ error: error.message })
    }

    next(error)
}

// Este debe ser el último middleware cargado, ¡también todas las rutas deben ser registrada antes que esto!
app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})