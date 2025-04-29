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
    const [rows] = await pool.query("SELECT * FROM ALBUM ORDER BY Title ASC")
    return rows;
}

export async function fetchFriendsAlbums(UId) {
    const [rows] = await pool.query(`SELECT 
    ALBUM.AlId, ALBUM.Title, ALBUM.slug, ALBUM.IMG_URL, USER.Username
    AS Saved_By, MAX(SAVED_ALBUM.Created_On) AS Created_On FROM FOLLOW
    JOIN SAVED_ALBUM ON FOLLOW.Followee_Id = SAVED_ALBUM.UId
    JOIN ALBUM ON SAVED_ALBUM.AlId = ALBUM.AlId
    JOIN USER ON SAVED_ALBUM.UId = USER.UId
    WHERE FOLLOW.Follower_Id = ?
    GROUP BY ALBUM.AlId, USER.UId, ALBUM.Title, USER.Username
    ORDER BY Created_On DESC
    LIMIT 10`, [UId])
    return rows;
}

export async function fetchFriendsReviews(UId) {
    const [rows] = await pool.query(`SELECT 
    ALBUM.AlId, ALBUM.Title, ALBUM.slug, ALBUM.IMG_URL,
    USER.Username, REVIEW.RvId, REVIEW.Body, REVIEW.Rate,
    MAX(REVIEW.Created_On) AS Created_On FROM FOLLOW
    JOIN REVIEW ON FOLLOW.Followee_Id = REVIEW.UId
    JOIN ALBUM ON REVIEW.AlId = ALBUM.AlId
    JOIN USER ON REVIEW.UId = USER.UId
    WHERE FOLLOW.Follower_Id = ?
    GROUP BY ALBUM.AlId, ALBUM.Title, ALBUM.slug, ALBUM.IMG_URL, USER.UId, USER.Username, REVIEW.RvId, REVIEW.Body, REVIEW.Rate
    ORDER BY Created_On DESC
    LIMIT 5`, [UId])
    return rows;
}

export async function searchArtists(query) {
    const likeQuery = `${query}%`
    const [rows] = await pool.query(`
        SELECT * FROM ARTIST WHERE
        Artist_Name like ?`, [likeQuery])
        return rows;
}

export async function searchAlbums(query) {
    const likeQuery = `${query}%`
    const [rows] = await pool.query(`
        SELECT * FROM ALBUM WHERE
        Title like ?`, [likeQuery])
        return rows;
}


export async function getArtistsAlbums(AId) {
    const [rows] = await pool.query(`
        SELECT * FROM ALBUM
        WHERE AId = ?
        ORDER BY Title DESC
        `, [AId])
    return rows;
}

export async function getArtists() {
    const [rows] = await pool.query("SELECT * FROM ARTIST ORDER BY Artist_Name ASC")
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

export async function getAlbum(field, value) {
    const allowedFields = ['slug', 'ALId']
    if (!allowedFields.includes(field)) {
        throw new Error('Invalid field name');
    }


    const [rows] = await pool.query(`
        SELECT * FROM ALBUM
        WHERE ${field} = ?
        `, [value]);
        return rows[0];
}

export async function getArtist(field, value) {
    const allowedFields = ['AId', 'slug', 'Artist_Name']
    if (!allowedFields.includes(field)) {
        throw new Error('Invalid field name');
    }

    const [rows] = await pool.query(`
        SELECT * FROM ARTIST
        WHERE ${field} = ?
        `, [value]);

        return rows[0];
}

export async function createReview(UId, Username, AlId, Body, Rate) {
    const [result] = await pool.query<ResultSetHeader>(`
        INSERT INTO Review (UId, Username, AlId, Body, Rate)  
        VALUES (?, ?, ?, ?, ?)
        `, [UId, Username, AlId, Body, Rate]);
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

export async function createAlbum(AId, ALId, Title, Body, IMG_URL, slug) {
    const [result] = await pool.query<ResultSetHeader>(`
        INSERT INTO Album (AId, ALId, Title, Body, IMG_URL, slug)
        VALUES (?, ?, ?, ?, ?, ?)
        `, [AId, ALId, Title, Body, IMG_URL, slug]);
        return getAlbum("slug", slug); 
}

export async function createArtist(AId, Artist_Name, Body, IMG_URL, slug) {
    const [result] = await pool.query<ResultSetHeader>(`
        INSERT INTO Artist (AId, Artist_Name, Body, IMG_URL, slug)
        VALUES (?, ?, ?, ?, ?)
        `, [AId, Artist_Name, Body, IMG_URL, slug]);
        return getArtist("slug", slug); 
}

export async function createSavedAlbum(UId, AlId) {
    const [result] = await pool.query<ResultSetHeader>(`
        INSERT INTO SAVED_ALBUM (UId, AlId)
        VALUES (?, ?)
        `, [UId, AlId]);
        return result[0];
}

export async function followUser(Follower_Id, Followee_Id) {
    const [result] = await pool.query<ResultSetHeader>(`
        INSERT INTO FOLLOW (Follower_Id, Followee_Id)
        VALUES (?, ?)
        `, [Follower_Id, Followee_Id]);
        return result[0];
}


export async function findSavedAlbums(UId) {
    const [ result ] = await pool.query<ResultSetHeader>(`
        SELECT * FROM ALBUM 
        WHERE AlId = any (SELECT AlID FROM SAVED_ALBUM WHERE UId = ?)
        `, [UId]);
         return result
}

export async function findFollowing(UId) {
    const [ result ] = await pool.query<ResultSetHeader>(`
        SELECT * FROM USER 
        WHERE UId = any (SELECT Followee_Id FROM FOLLOW WHERE Follower_Id = ?)
        `, [UId]);
        return result;
}

export async function getUser(UId) {
    const [result] = await pool.query(`
       SELECT * FROM User
       WHERE UId = ?     
      `, [UId]);
        return result[0];
}

export async function findUser(Username) {
    const [result] = await pool.query(`
        SELECT * FROM User
        WHERE Username = ?
        `, [Username]);
          return result;
}

export async function authenticateUser(Username) {
        const [rows] = await pool.query(`
            SELECT * FROM User
            WHERE Username = ? 
            `, [Username]);
            return rows[0];
}
