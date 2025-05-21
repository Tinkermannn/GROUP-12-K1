const db = require('../database/pg.database');
const bcrypt = require('bcrypt');

exports.createUser = async (userData) => {
    const { username, email, password, role } = userData;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const query = `
        INSERT INTO users (username, email, password, role)
        VALUES ($1, $2, $3, $4)
        RETURNING id, username, email, role, created_at, updated_at
    `;
    const values = [username, email, hashedPassword, role];

    const { rows } = await db.query(query, values);
    return rows[0];
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
    const { rows } = await db.query(
        `SELECT id FROM users WHERE username = $1`,
        [username]
    );
    return rows.length > 0;
};

exports.findByEmail = async (email) => {
    const { rows } = await db.query(
        `SELECT id FROM users WHERE email = $1`,
        [email]
    );
    return rows.length > 0;
};

exports.updateUser = async (userData) => {
    const { id, username, email, password, role } = userData;

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

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(id);

    const query = `
        UPDATE users
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
    `;
    await db.query(query, updateValues);

    return exports.getUserById(id);
};

exports.deleteUser = async (id) => {
    const user = await exports.getUserById(id);
    if (!user) return null;

    await db.query(`DELETE FROM users WHERE id = $1`, [id]);
    return user;
};

exports.findUserByEmailWithPassword = async (email) => {
    const { rows } = await db.query(
        `SELECT * FROM users WHERE email = $1`,
        [email]
    );
    return rows.length > 0 ? rows[0] : null;
};
