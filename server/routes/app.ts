import express from 'express'
import cors from 'cors'

import { getNote, getNotes, createNote } from './database.ts'

const PORT = 8080 
const app = express()

app.use(cors());
app.use(express.json())

app.get("/notes", async (req, res)=> {
    const notes = await getNotes()
    res.json({message: notes})
})

app.get("/not", async (req, res)=> {
    res.json({ message: "Fuck you"});
})

app.get("/notes/:id", async (req, res)=> {
    const id = req.params.id
    const note = await getNote(id)
    res.send(note)
})

app.post("/notes", async (req, res) => {
    const { title, contents } = req.body
    const note = await createNote(title, contents)
    res.status(201).send(note)
})

app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).send('Something broke yo!')
})

app.listen(PORT, () => {
    console.log('Server is running on port ${PORT}')
})