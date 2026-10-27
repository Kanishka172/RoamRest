const mysql=require("mysql2/promise");

const pool=mysql.createPool({
    host:process.env.DB_HOST || "127.0.0.1",
    port:Number(process.env.DB_PORT) || 3306,
    user:process.env.DB_USER || "root",
    password:process.env.DB_PASSWORD || "",
    database:process.env.DB_NAME || "roamrest",
    waitForConnections:true,
    connectionLimit:10,
    decimalNumbers:true,
    ssl:process.env.DB_SSL === "true" ? {rejectUnauthorized:true} : undefined,
});

module.exports=pool;
