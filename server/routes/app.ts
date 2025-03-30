import express from 'express'
import cors from 'cors'
import bcrypt from 'bcrypt'
import jwt from "jsonwebtoken";

import { getAlbum, getAlbums, getArtist, getReviews, createReview, createUser, authenticateUser } from './database.ts'

const PORT = 8080 
const app = express()
const secretKey = process.env.SECRET_KEY

app.use(cors());
app.use(express.json())

// Multiple Albums
app.get("/albums", async (req, res)=> {
    const titles = await getAlbums()
    res.json({message: titles})
})


app.get("/reviews", async (req, res)=> {
    const { AlId } = req.query;
    console.log('Received AlId:', AlId);
    const reviews = await getReviews(AlId);
    res.json({message: reviews });
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


app.get("/artist", async (req, res) => {
    const { AId } = req.query;
    console.log('Received Artist Id:', AId);
    
    if (!AId) {
        return res.status(400).json({ error: "Artist is required" });
    }

    const artist = await getArtist(AId);

    if (!artist) {
        return res.status(404).json({ error: "Artist not found" });
    }

    return res.json({ artist });
})

app.post("/user/login", async (req, res) => {
    const { Username, Password } = req.body;
    console.log("askdfjakl", Username, Password)
    try {

        const user = await authenticateUser(Username);

        if(!user) {
            return res.status(400).json({ error: "User not found "});
        }

        const passwordMatch = await bcrypt.compare(Password, user.Password);
        if(!passwordMatch) {
            return res.status(400).json({ error: "Incorrect Password "});
        }

        const token = jwt.sign({ userId: user.UId, username: user.Username}, secretKey, { expiresIn: "2h"});

        res.json({ message: "Login Successful", token});
    } catch (error) {
        console.error(" Error logging in:", error);
        res.status(500).json({ error: "Internal server error "});
    }
})


/*
app.post("/album", async (req, res) => {
    const { slug } = req.body
    const album = await getAlbum(slug)
    res.status (201).send(album)
})
*/

app.post("/review", async (req, res) => {
    const { AlId, Body, Rate } = req.body;
    const review = await createReview( AlId, Body, Rate );
    res.status(201).send(review);
})


app.post("/user/signup", async (req, res) => {
    const { Username, Email, Password } = req.body;
    const user = await createUser( Username, Email, Password );
    res.status(201).send(user);
})

app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).send('Something broke yo!')
})

app.listen(PORT, () => {
    console.log('Server is running on port 8080')
})