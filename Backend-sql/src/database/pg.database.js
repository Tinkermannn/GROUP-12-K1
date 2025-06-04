require("dotenv").config();

const { Pool } = require("pg");

const pool = new Pool({
    connectionString: process.env.PG_CONNECTION_STRING,
    max: 100,                
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    //ssl: { rejectUnauthorized: false },
});

// Removed connect() and its call. Let the pool handle connections.

const query = async (text, params) => {
    try {
        const res = await pool.query(text, params);
        return res;
    } catch (error) {
        console.error("Error executing query", error);
        throw error; // Let the caller handle the error
    }
}

module.exports = {
    query,
};