require("dotenv").config();

const { Pool } = require("pg");

const pool = new Pool({
    connectionString: process.env.PG_CONNECTION_STRING,
    max: 100,                
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    ssl: { rejectUnauthorized: false },
});

const connect = async () => {
    try {
        await pool.connect();
        console.log("Connected to database")
    } catch (error) {
        console.error("Error connecting to database", error);
    }   
}

connect();
    
const query = async (text, params) => {
    try {
        const res = await pool.query(text, params);
        return res;
    } catch (error) {
        console.error("Error executing query", error);
    }
}

module.exports = {
    query,
};