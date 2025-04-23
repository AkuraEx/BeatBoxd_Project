import express from 'express'
import cors from 'cors'
import dotenv from "dotenv"
import bcrypt from 'bcrypt'
import jwt from "jsonwebtoken"
import cookieParser from "cookie-parser"

import { getAlbum, getAlbums, createAlbum, getArtist, getArtists, createArtist, getReviews, findSavedAlbums, 
    createReview, createUser, findUser, authenticateUser, createSavedAlbum, getArtistsAlbums } from './database.ts'

const PORT = 8080 
const app = express()
app.use(cookieParser());
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


app.get("/artists", async (req, res)=> {
    const artists = await getArtists()
    res.json({message: artists})
})

app.get("/artists/albums", async (req, res) => {
    const { AId } = req.query;
    console.log('Received AId:', AId);
    const albums = await getArtistsAlbums(AId);
    res.json({message: albums });
})
// Single Album

app.get("/album", async (req, res) => {
    const { field, value } = req.query;
    
    if (!value) {
        return res.status(400).json({ error: "Slug is required" });
    }

    const album = await getAlbum(field, value);

    if (!album) {
        return res.status(404).json({ error: "Album not found" });
    }

    return res.json({ album });
});

app.get("/user/album", async (req, res) => {
    const { UId } = req.query;
    console.log("received", UId);
    const albums = await findSavedAlbums( UId );
    res.json({message: albums});
})


app.get("/artist", async (req, res) => {
    const { value, field } = req.query;
    if (!value) {
        return res.status(400).json({ error: "Artist is required" });
    }

    const artist = await getArtist(field,value);

    if (!artist) {
        return res.status(404).json({ error: "Artist not found" });
    }

    return res.json({ artist });
})

app.post("/user/login", async (req, res) => {
    const { Username, Password } = req.body;
    const user = await authenticateUser(Username);
    if(user) {

        const passwordMatch = await bcrypt.compare(Password, user.Password);
        if(!passwordMatch) {
            return res.status(400).json({ error: "Incorrect Password "});
        }

        const token = jwt.sign({ userId: user.UId, username: user.Username}, secretKey, { expiresIn: "2h"});

        res.json({ auth: true, token: token});

    } else {
        res.json({ auth: false, message: "No such user exists "});
    }
});




const authenticateToken = (req, res, next) => {
    const token = req.headers["x-access-token"];

    if (!token) {
        res.status(401).json({ auth: false, message: "Token required "});
    }

    jwt.verify(token, secretKey, (err, decoded) => {

    if (err) {
        res.json({ auth: false, message: "U failed to auth"});
    } else {
    req.user = decoded;
    next();
    }
    });
};


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

app.post("/album/create", async (req, res) => {
    const { AId, ALId, Title, Body, IMG_URL, slug} = req.body;
    const album = await createAlbum( AId, ALId, Title, Body, IMG_URL, slug);
    res.status(201).send(album);
})

app.post("/artist/create", async (req, res) => {
    const { AId, Artist_Name, Body, IMG_URL, slug } = req.body;
    const artist = await createArtist(AId, Artist_Name, Body, IMG_URL, slug);
    res.status(201).send(artist);
})

app.get("/user/find", async (req, res) => {
    const { Username } = req.query;
    const User = await findUser( Username );
    res.send({ User });
})


app.post("/user/signup", async (req, res) => {
    const { Username, Email, Password } = req.body;
    const user = await createUser( Username, Email, Password );
    res.status(201).send(user);
})

app.get("/user/session", authenticateToken, async (req, res) => {
    res.send({message: "Yo, u are authenticated", user: req.user, auth: true});
})

app.post("/album/save", async (req, res) => {
    const { UId, AlId } = req.body;
    const save = await createSavedAlbum( UId, AlId );
    res.status(201).send(save);
})


app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).send('Something broke yo!')
})

app.listen(PORT, () => {
    console.log('Server is running on port 8080')
})