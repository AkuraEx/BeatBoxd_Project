import dotenv from "dotenv"
import bcrypt from "bcrypt";
import mysql from "mysql2"

dotenv.config()

const pool = mysql.createPool({
    host: '34.57.92.214',
    user: 'root',
    password: '3569',
    database: 'beatboxd' 
}).promise()


export async function getAlbums() {
    const [rows] = await pool.query("SELECT * FROM album ORDER BY Body LIMIT 100")
    return rows;
}

export async function fetchFriendsAlbums(UId) {
    const [rows] = await pool.query(`SELECT 
    album.AlId, album.Title, album.slug, album.IMG_URL, user.username
    AS Saved_By, MAX(saved_album.Created_On) AS Created_On FROM follow
    JOIN saved_album ON follow.followee_Id = saved_album.UId
    JOIN album ON saved_album.AlId = album.AlId
    JOIN user ON saved_album.UId = user.UId
    WHERE follow.follower_Id = ?
    GROUP BY album.AlId, user.UId, album.Title, user.username
    ORDER BY Created_On DESC
    LIMIT 10`, [UId])
    return rows;
}

export async function fetchFriendsReviews(UId) {
    const [rows] = await pool.query(`SELECT 
    album.AlId, album.Title, album.slug, album.IMG_URL,
    user.username, review.RvId, review.Body, review.Rate,
    MAX(review.Created_On) AS Created_On FROM follow
    JOIN review ON follow.followee_Id = review.UId
    JOIN album ON review.AlId = album.AlId
    JOIN user ON review.UId = user.UId
    WHERE follow.follower_Id = ?
    GROUP BY album.AlId, album.Title, album.slug, album.IMG_URL, user.UId, user.username, review.RvId, review.Body, review.Rate
    ORDER BY Created_On DESC
    LIMIT 5`, [UId])
    return rows;
}

export async function searchArtists(query) {
    const likeQuery = `${query}%`
    const [rows] = await pool.query(`
        SELECT * FROM artist WHERE
        artist_Name like ?`, [likeQuery])
        return rows;
}

export async function searchAlbums(query) {
    const likeQuery = `${query}%`
    const [rows] = await pool.query(`
        SELECT * FROM album WHERE
        Title like ?`, [likeQuery])
        return rows;
}


export async function getArtistsAlbums(AId) {
    const [rows] = await pool.query(`
        SELECT * FROM album
        WHERE AId = ?
        ORDER BY Title DESC
        `, [AId])
    return rows;
}

export async function getArtists() {
    const [rows] = await pool.query("SELECT * FROM artist ORDER BY artist_Name ASC")
    return rows;
}

export async function getReviews(AlId) {
    const [reviews] = await pool.query(`
        SELECT * FROM review
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
        SELECT * FROM album
        WHERE ${field} = ?
        `, [value]);
        return rows[0];
}

export async function getArtist(field, value) {
    const allowedFields = ['AId', 'slug', 'artist_Name']
    if (!allowedFields.includes(field)) {
        throw new Error('Invalid field name');
    }

    const [rows] = await pool.query(`
        SELECT * FROM artist
        WHERE ${field} = ?
        `, [value]);

        return rows[0];
}

export async function createReview(UId, username, AlId, Body, Rate) {
    const [result] = await pool.query<ResultSetHeader>(`
        INSERT INTO review (UId, username, AlId, Body, Rate)  
        VALUES (?, ?, ?, ?, ?)
        `, [UId, username, AlId, Body, Rate]);
        const Id = result.insertId;
        return getReviews(Id);
}

export async function createUser(username, Email, Password) {
    const hashedPassword = await bcrypt.hash(Password, 10)
    const [result] = await pool.query<ResultSetHeader>(`
        INSERT INTO user (username, Email, Password)
        VALUES (?, ?, ?) 
        `, [username, Email, hashedPassword]);
        const Id = result.insertId;
        return getUser(Id);
} 

export async function createAlbum(AId, ALId, Title, Body, IMG_URL, slug) {
    const [result] = await pool.query<ResultSetHeader>(`
        INSERT INTO album (AId, ALId, Title, Body, IMG_URL, slug)
        VALUES (?, ?, ?, ?, ?, ?)
        `, [AId, ALId, Title, Body, IMG_URL, slug]);
        return getAlbum("slug", slug); 
}

export async function createArtist(AId, artist_Name, Body, IMG_URL, slug) {
    const [result] = await pool.query<ResultSetHeader>(`
        INSERT INTO artist (AId, artist_Name, Body, IMG_URL, slug)
        VALUES (?, ?, ?, ?, ?)
        `, [AId, artist_Name, Body, IMG_URL, slug]);
        return getArtist("slug", slug); 
}

export async function createSavedAlbum(UId, AlId) {
    const [result] = await pool.query<ResultSetHeader>(`
        INSERT INTO saved_album (UId, AlId)
        VALUES (?, ?)
        `, [UId, AlId]);
        return result[0];
}

export async function followUser(follower_Id, followee_Id) {
    const [result] = await pool.query<ResultSetHeader>(`
        INSERT INTO follow (follower_Id, followee_Id)
        VALUES (?, ?)
        `, [follower_Id, followee_Id]);
        return result[0];
}


export async function findSavedAlbums(UId) {
    const [ result ] = await pool.query<ResultSetHeader>(`
        SELECT * FROM album 
        WHERE AlId = any (SELECT AlID FROM saved_album WHERE UId = ?)
        `, [UId]);
         return result
}

export async function findFollowing(UId) {
    const [ result ] = await pool.query<ResultSetHeader>(`
        SELECT * FROM user 
        WHERE UId = any (SELECT followee_Id FROM follow WHERE follower_Id = ?)
        `, [UId]);
        return result;
}

export async function getUser(UId) {
    const [result] = await pool.query(`
       SELECT * FROM user
       WHERE UId = ?     
      `, [UId]);
        return result[0];
}

export async function findUser(username) {
    const [result] = await pool.query(`
        SELECT * FROM user
        WHERE username = ?
        `, [username]);
          return result;
}

export async function authenticateUser(username) {
        const [rows] = await pool.query(`
            SELECT * FROM user
            WHERE username = ? 
            `, [username]);
            return rows[0];
}
