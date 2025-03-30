import mysql, { RowDataPacket, ResultSetHeader } from 'mysql2'
import dotenv from "dotenv"
import bcrypt from "bcrypt";

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

export async function createUser(Username, Email, Password) {
    const hashedPassword = await bcrypt.hash(Password, 10)
    const [result] = await pool.query<ResultSetHeader>(`
        INSERT INTO User (Username, Email, Password)
        VALUES (?, ?, ?) 
        `, [Username, Email, hashedPassword]);
        const Id = result.insertId;
        return getUser(Id);
} 

export async function getUser(UId) {
    const [result] = await pool.query(`
       SELECT * FROM User
       WHERE UId = ?     
      `, [UId]);
        return result[0];
}

export async function authenticateUser(Username) {
        const [rows] = await pool.query(`
            SELECT * FROM User
            WHERE Username = ? 
            `, [Username]);
            return rows[0];
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

