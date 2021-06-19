require('dotenv').config()

const express = require('express')
const morgan = require('morgan')
const cors = require('cors')

const app = express()

morgan.token('body', (req, res) => JSON.stringify(req.body))

app.use(cors())
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :body'))
app.use(express.json())
app.use(express.static('build'))

let phonebook = [
    {
        id: 1,
        name: 'Arto Hellas',
        number: '040-123456'
    },
    {
        id: 2,
        name: 'Ada Lovelace',
        number: '39-44-5323523'
    },
    {
        id: 3,
        name: 'Dan Abramov',
        number: '12-43-234345'
    },
    {
        id: 4,
        name: 'Mary Poppendick',
        number: '39-23-6423122'
    }
]

const Person = require('./models/person')

app.get('/', (req, res) => {
    res.send('<h1>Hello World!</h1>')
})

app.get('/api/persons', (req, res, next) => {
    Person.find({})
    .then(result => res.json(result))
    .catch(error => next(error))
})

app.get('/info', async (req, res) => {
    const numbers = await Person.find({}) || []
    const numberOfNumbers = numbers.length
    const date = new Date()
    res.send(`Phonebook has info for ${numberOfNumbers} people\n\n${date}`)
})

app.get('/api/persons/:id', (request, response, next) => {
    const id = request.params.id
    Person.findById(id)
    .then(person => {
        if (person) {
            response.json(person)
        } else {
            response.status(404).end()
        }
    })
    .catch(error => {
        next(error)
    })
})

app.delete('/api/persons/:id', (request, response, next) => {
    const id = request.params.id

    Person.findByIdAndRemove(id)
    .then(result => {
        response.status(204).end()
    })
    .catch(error => next(error))
})

app.post('/api/persons', async (request, response, next) => {
    const body = request.body

    if (!body.name || !body.number) {
        return response.status(400).json({
            error: 'name and/or number missing'
        })
    }

    const exists = (await Person.findOne({name: body.name})) !== null

    if (exists) {
        return response.status(409).json({
            error: 'name must be unique'
        })
    }

    const person = new Person({
        name: body.name,
        number: body.number
    })

    person.save()
    .then(savedPerson => {
        response.json(savedPerson)
    })
    .catch(error => next(error))
})

app.put('/api/persons/:id', (request, response, next) => {
    const id = request.params.id
    const body = request.body

    const person = {
        name: body.name,
        number: body.number
    }

    Person.findByIdAndUpdate(id, person, { new: true })
    .then(updatedPerson => {
        response.json(updatedPerson)
    })
    .catch(error => next(error))
})

const unknownEndpoint = (request, response) => {
    response.status(404).send({ error: 'unknown endpoint' })
}

app.use(unknownEndpoint)

const errorHandler = (error, request, response, next) => {
    console.error(error.message)

    if (error.name === 'CastError') {
      return response.status(400).send({ error: 'malformatted id' })
    }

    next(error)
}

app.use(errorHandler)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})