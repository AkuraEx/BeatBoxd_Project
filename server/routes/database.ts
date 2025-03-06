import mysql, { RowDataPacket, ResultSetHeader } from 'mysql2'
import dotenv from "dotenv"

dotenv.config()

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE 
}).promise()


export async function getAlbums() {
    const [rows] = await pool.query("SELECT * FROM ALBUM")
    return rows;
}

export async function getReviews(AlId) {
    const [reviews] = await pool.query(`
        SELECT * FROM REVIEW
        WHERE AlId = ?
        ORDER BY RvId DESC
        `, [AlId]);
    return reviews;
}

export async function getAlbum(slug) {
    const [rows] = await pool.query(`
        SELECT * FROM ALBUM
        WHERE slug = ?
        `, [slug]);
        return rows[0];
}

export async function getArtist(AId) {
    const [rows] = await pool.query(`
        SELECT * FROM ARTIST
        WHERE AId = ?
        `, [AId]);
        return rows[0];
}

export async function createReview(AlId, Body, Rate) {
    const [result] = await pool.query<ResultSetHeader>(`
        INSERT INTO Review (AlId, Body, Rate)  
        VALUES (?, ?, ?)
        `, [AlId, Body, Rate]);
        const Id = result.insertId;
        return getReviews(Id);
}

/*
export async function createNote(title, contents) {
    const [result] = await pool.query<ResultSetHeader>(`
        INSERT INTO notes (title, contents)
        VALUES (?, ?)
        `, [title, contents])
        const id = result.insertId
        return getNote(id)
}
        */

