const pool=require("../db.js");

module.exports.create=async({listingId,authorId,rating,comment})=>{
    const [result]=await pool.execute(
        "INSERT INTO reviews (listing_id, author_id, rating, comment) VALUES (?, ?, ?, ?)",
        [listingId,authorId,rating,comment]
    );
    return result.insertId;
}

module.exports.findById=async(id)=>{
    const [rows]=await pool.execute("SELECT * FROM reviews WHERE id = ?",[id]);
    const row=rows[0];
    if(!row){
        return null;
    }
    return {id:row.id,listingId:row.listing_id,authorId:row.author_id,rating:row.rating,comment:row.comment};
}

module.exports.findByListingId=async(listingId)=>{
    const [rows]=await pool.execute(
        `SELECT r.id, r.rating, r.comment, r.created_at, r.author_id, u.username AS author_username
         FROM reviews r
         LEFT JOIN users u ON u.id = r.author_id
         WHERE r.listing_id = ?
         ORDER BY r.id`,
        [listingId]
    );
    return rows.map((row)=>({
        id:row.id,
        rating:row.rating,
        comment:row.comment,
        createdAt:row.created_at,
        author:row.author_id===null ? null : {id:row.author_id,username:row.author_username},
    }));
}

module.exports.destroy=async(id,listingId)=>{
    await pool.execute("DELETE FROM reviews WHERE id = ? AND listing_id = ?",[id,listingId]);
}
