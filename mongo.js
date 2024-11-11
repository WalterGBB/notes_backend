const mongoose = require('mongoose')

if (process.argv.length < 3) {
    console.log('give password as argument')
    process.exit(1)
}

const password = process.argv[2]

const url = `mongodb+srv://waztercraft:${password}@cluster0.wsmtr.mongodb.net/noteApp?retryWrites=true&w=majority&appName=Cluster0`

mongoose.set('strictQuery', false)

const noteSchema = new mongoose.Schema({
    content: String,
    important: Boolean,
})

const Note = mongoose.model('Note', noteSchema)

mongoose.connect(url)
    .then(() => {
        console.log('Connected to MongoDB')

        if (process.argv.length === 3) {
            // Si solo hay 3 argumentos, listar todas las notas
            Note.find({}).then(result => {
                result.forEach(note => {
                    console.log(note)
                })
                mongoose.connection.close()
            })
        } else if (process.argv.length === 5) {
            // Si hay más de 3 argumentos, guardar una nueva nota
            const note = new Note({
                content: process.argv[3],
                important: process.argv[4] === 'true', // convierte el valor a booleano
            })

            note.save().then(() => {
                console.log('note saved!')
                mongoose.connection.close()
            })
        }
    })
    .catch(error => {
        console.error('Error connecting to MongoDB:', error)
    })
