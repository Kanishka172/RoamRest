require("dotenv").config({path:require("path").join(__dirname,"..",".env")});

const crypto=require("crypto");
const fs=require("fs");
const path=require("path");
const mysql=require("mysql2/promise");
const initData=require("./data.js");
const pool=require("../db.js");
const User=require("../models/user.js");
const Listing=require("../models/listing.js");

const DB_NAME=process.env.DB_NAME || "roamrest";
const DEMO_USERNAME="roamrest-demo";

// creates the database if it is missing, then creates the tables from schema.sql
const createSchema = async () => {
    const connection=await mysql.createConnection({
        host:process.env.DB_HOST || "127.0.0.1",
        port:Number(process.env.DB_PORT) || 3306,
        user:process.env.DB_USER || "root",
        password:process.env.DB_PASSWORD || "",
        multipleStatements:true,
        ssl:process.env.DB_SSL === "true" ? {rejectUnauthorized:true} : undefined,
    });
    try{
        const dbName=connection.escapeId(DB_NAME);
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        await connection.query(`USE ${dbName}`);
        await connection.query(fs.readFileSync(path.join(__dirname,"schema.sql"),"utf8"));
    }
    finally{
        await connection.end();
    }
};

const initDB = async () => {
    await createSchema();
    console.log("Tables are ready");

    // every sample listing needs an owner, so seed one demo account
    let [rows]=await pool.execute("SELECT id FROM users WHERE username = ?",[DEMO_USERNAME]);
    let ownerId;
    if(rows.length>0){
        ownerId=rows[0].id;
    }
    else{
        const password=process.env.SEED_PASSWORD || crypto.randomBytes(9).toString("base64url");
        const demoUser=await User.create({username:DEMO_USERNAME,email:"demo@roamrest.example",password});
        ownerId=demoUser.id;
        console.log(`Created demo user "${DEMO_USERNAME}" with password: ${password}`);
    }

    // reviews of the old listings go with them (ON DELETE CASCADE)
    await pool.execute("DELETE FROM listings");
    for(const listing of initData.data){
        await Listing.create({...listing,ownerId});
    }
    console.log(`Data was initialized (${initData.data.length} listings)`);
};

initDB()
    .catch((err)=>{
        console.log(err);
        process.exitCode=1;
    })
    .finally(()=>pool.end());
