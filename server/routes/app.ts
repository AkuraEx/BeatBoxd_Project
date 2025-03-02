import express from 'express'
import cors from 'cors'

import { getAlbum, getAlbums } from './database.ts'

const PORT = 8080 
const app = express()

app.use(cors());
app.use(express.json())

// Multiple Albums
app.get("/albums", async (req, res)=> {
    const titles = await getAlbums()
    res.json({message: titles})
})


// Single Album

app.get("/album", async (req, res) => {
    const { slug } = req.query;
    console.log('Received slug:', slug);
    
    if (!slug) {
        return res.status(400).json({ error: "Slug is required" });
    }

    const album = await getAlbum(slug as string);

    if (!album) {
        return res.status(404).json({ error: "Album not found" });
    }

    return res.json({ album });
});


/*
app.post("/album", async (req, res) => {
    const { slug } = req.body
    const album = await getAlbum(slug)
    res.status (201).send(album)
})
*/


app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).send('Something broke yo!')
})

app.listen(PORT, () => {
    console.log('Server is running on port 8080')
})