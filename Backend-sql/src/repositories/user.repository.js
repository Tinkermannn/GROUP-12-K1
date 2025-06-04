const db = require('../database/pg.database');
const bcrypt = require('bcrypt');

exports.createUser = async (userData) => {
    const { username, email, password, role } = userData;

    // Check if username already exists
    const usernameExists = await exports.findByUsername(username);
    if (usernameExists) {
        const error = new Error('Username sudah terdaftar');
        error.statusCode = 400; // Custom property to carry status code
        throw error;
    }

    // Check if email already exists
    const emailExists = await exports.findByEmail(email);
    if (emailExists) {
        const error = new Error('Email sudah terdaftar');
        error.statusCode = 400; // Custom property to carry status code
        throw error;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const query = `
        INSERT INTO users (username, email, password, role)
        VALUES ($1, $2, $3, $4)
        RETURNING id, username, email, role, created_at, updated_at
    `;
    const values = [username, email, hashedPassword, role];

    try {
        const { rows } = await db.query(query, values);
        return rows[0];
    } catch (err) {
        // This catch is for other potential database errors, less likely with pre-checks
        console.error("Database error during user creation:", err);
        const error = new Error('Gagal membuat user karena kesalahan database.');
        error.statusCode = 500;
        throw error;
    }
};

exports.getAllUsers = async () => {
    const query = `
        SELECT id, username, email, role, created_at, updated_at
        FROM users
        ORDER BY created_at DESC
    `;
    const { rows } = await db.query(query);
    return rows;
};

exports.getUserById = async (id) => {
    const query = `
        SELECT id, username, email, role, created_at, updated_at
        FROM users
        WHERE id = $1
    `;
    const { rows } = await db.query(query, [id]);
    return rows.length > 0 ? rows[0] : null;
};

exports.findByUsername = async (username) => {
    const query = `
        SELECT id, username, email, role, created_at, updated_at
        FROM users
        WHERE username = $1
    `;
    const { rows } = await db.query(query, [username]);
    return rows.length > 0 ? rows[0] : null;
};

// ADDED: findByEmail function
exports.findByEmail = async (email) => {
    const query = `
        SELECT id, username, email, role, created_at, updated_at
        FROM users
        WHERE email = $1
    `;
    const { rows } = await db.query(query, [email]);
    return rows.length > 0 ? rows[0] : null;
};

// NEW FUNCTION: findUserByEmailWithPassword for login
exports.findUserByEmailWithPassword = async (email) => {
    const query = `
        SELECT id, username, email, password, role, created_at, updated_at
        FROM users
        WHERE email = $1
    `;
    const { rows } = await db.query(query, [email]);
    return rows.length > 0 ? rows[0] : null;
};


exports.updateUser = async (id, userData) => {
    const { username, email, password, role } = userData;
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (username !== undefined) {
        updateFields.push(`username = $${paramIndex++}`);
        updateValues.push(username);
    }

    if (email !== undefined) {
        updateFields.push(`email = $${paramIndex++}`);
        updateValues.push(email);
    }

    if (role !== undefined) {
        updateFields.push(`role = $${paramIndex++}`);
        updateValues.push(role);
    }

    if (password !== undefined) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        updateFields.push(`password = $${paramIndex++}`);
        updateValues.push(hashedPassword);
    }

    if (updateFields.length === 0) {
        return exports.getUserById(id);
    }

    // Always update the 'updated_at' timestamp
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    
    // The ID for the WHERE clause is the last parameter
    const query = `
        UPDATE users
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
    `;
    updateValues.push(id); 

    try {
        await db.query(query, updateValues);
        return exports.getUserById(id);
    } catch (err) {
        console.error("Database error during user update:", err);
        const error = new Error('Gagal mengupdate user karena kesalahan database.');
        error.statusCode = 500;
        throw error;
    }
};

exports.deleteUser = async (id) => {
    const user = await exports.getUserById(id);
    if (!user) return null;

    await db.query('DELETE FROM users WHERE id = $1', [id]);
    return user; // Return the deleted user's data
};
