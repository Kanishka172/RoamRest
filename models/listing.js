const pool=require("../db.js");

// rows use snake_case columns; the rest of the app sees the same shape the old Mongoose documents had
const toListing=(row)=>({
    id:row.id,
    title:row.title,
    description:row.description,
    price:row.price,
    location:row.location,
    country:row.country,
    image:{url:row.image_url,filename:row.image_filename},
    geometry:row.latitude!==null && row.longitude!==null
        ? {type:"Point",coordinates:[row.longitude,row.latitude]}
        : null,
    ownerId:row.owner_id,
});

const orNull=(values)=>values.map((v)=>v===undefined ? null : v);

module.exports.findPage=async(limit,offset)=>{
    // query() instead of execute(): MySQL 8 rejects numeric LIMIT/OFFSET placeholders in prepared statements
    const [rows]=await pool.query("SELECT * FROM listings ORDER BY id LIMIT ? OFFSET ?",[limit,offset]);
    return rows.map(toListing);
}

module.exports.count=async()=>{
    const [rows]=await pool.execute("SELECT COUNT(*) AS total FROM listings");
    return rows[0].total;
}

module.exports.findById=async(id)=>{
    const [rows]=await pool.execute("SELECT * FROM listings WHERE id = ?",[id]);
    return rows[0] ? toListing(rows[0]) : null;
}

module.exports.findByIdWithOwner=async(id)=>{
    const [rows]=await pool.execute(
        `SELECT l.*, u.username AS owner_username
         FROM listings l
         JOIN users u ON u.id = l.owner_id
         WHERE l.id = ?`,
        [id]
    );
    if(!rows[0]){
        return null;
    }
    const listing=toListing(rows[0]);
    listing.owner={id:rows[0].owner_id,username:rows[0].owner_username};
    return listing;
}

module.exports.create=async({title,description,price,location,country,image,geometry,ownerId})=>{
    // geometry is GeoJSON, so coordinates are [longitude, latitude]
    const [longitude,latitude]=geometry ? geometry.coordinates : [null,null];
    const [result]=await pool.execute(
        `INSERT INTO listings
            (title, description, price, location, country, image_url, image_filename, latitude, longitude, owner_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        orNull([
            title,description,price,location,country,
            image.url,image.filename || "listingimage",
            latitude,longitude,
            ownerId,
        ])
    );
    return result.insertId;
}

// only these columns can ever be updated, whatever the form posts; fields left undefined stay as they are
module.exports.update=async(id,{title,description,price,location,country,image})=>{
    const fields={title,description,price,location,country};
    if(image){
        fields.image_url=image.url;
        fields.image_filename=image.filename;
    }
    const columns=Object.keys(fields).filter((c)=>fields[c]!==undefined);
    if(columns.length===0){
        return;
    }
    await pool.execute(
        `UPDATE listings SET ${columns.map((c)=>`${c} = ?`).join(", ")} WHERE id = ?`,
        [...columns.map((c)=>fields[c]),id]
    );
}

// reviews go with the listing through ON DELETE CASCADE
module.exports.destroy=async(id)=>{
    await pool.execute("DELETE FROM listings WHERE id = ?",[id]);
}
