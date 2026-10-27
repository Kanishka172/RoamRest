const bcrypt=require("bcryptjs");
const pool=require("../db.js");

module.exports.create=async({username,email,password})=>{
    const passwordHash=await bcrypt.hash(password,10);
    try{
        const [result]=await pool.execute(
            "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
            [username,email,passwordHash]
        );
        return {id:result.insertId,username,email};
    }
    catch(e){
        if(e.code==="ER_DUP_ENTRY"){
            throw new Error("A user with the given username is already registered");
        }
        throw e;
    }
}

module.exports.findById=async(id)=>{
    const [rows]=await pool.execute("SELECT id, username, email FROM users WHERE id = ?",[id]);
    return rows[0] || null;
}

module.exports.authenticate=async(username,password)=>{
    const [rows]=await pool.execute(
        "SELECT id, username, email, password_hash FROM users WHERE username = ?",
        [username]
    );
    const user=rows[0];
    if(!user || !(await bcrypt.compare(password,user.password_hash))){
        return null;
    }
    return {id:user.id,username:user.username,email:user.email};
}
