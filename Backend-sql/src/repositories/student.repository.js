const db = require('../database/pg.database');

exports.createStudent = async (studentData) => {
    const { user_id, nim, name, major, semester } = studentData;

    const result = await db.query(
        `INSERT INTO students (user_id, nim, name, major, semester) 
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [user_id, nim, name, major, semester]
    );

    return exports.getStudentById(result.rows[0].id);
};

exports.getAllStudents = async () => {
    const result = await db.query(
        `SELECT s.*, u.username, u.email, u.role
         FROM students s
         JOIN users u ON s.user_id = u.id
         ORDER BY s.updated_at DESC`
    );

    return result.rows;
};

exports.getStudentById = async (id) => {
    const result = await db.query(
        `SELECT s.*, u.username, u.email, u.role
         FROM students s
         JOIN users u ON s.user_id = u.id
         WHERE s.id = $1`,
        [id]
    );

    return result.rows[0] || null;
};

exports.findByNim = async (nim) => {
    const result = await db.query(
        `SELECT * FROM students WHERE nim = $1`,
        [nim]
    );

    return result.rows[0] || null;
};

exports.updateStudent = async (studentData) => {
    const { id, user_id, nim, name, major, semester } = studentData;

    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (user_id !== undefined) {
        updateFields.push(`user_id = $${paramIndex++}`);
        updateValues.push(user_id);
    }
    if (nim !== undefined) {
        updateFields.push(`nim = $${paramIndex++}`);
        updateValues.push(nim);
    }
    if (name !== undefined) {
        updateFields.push(`name = $${paramIndex++}`);
        updateValues.push(name);
    }
    if (major !== undefined) {
        updateFields.push(`major = $${paramIndex++}`);
        updateValues.push(major);
    }
    if (semester !== undefined) {
        updateFields.push(`semester = $${paramIndex++}`);
        updateValues.push(semester);
    }

    if (updateFields.length === 0) {
        return exports.getStudentById(id);
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(id);

    await db.query(
        `UPDATE students 
         SET ${updateFields.join(', ')}
         WHERE id = $${paramIndex}`,
        updateValues
    );

    return exports.getStudentById(id);
};

exports.deleteStudent = async (id) => {
    const student = await exports.getStudentById(id);

    if (!student) {
        return null;
    }

    await db.query(
        `DELETE FROM students WHERE id = $1`,
        [id]
    );

    return student;
};

exports.checkUserExists = async (userId) => {
    const result = await db.query(
        `SELECT 1 FROM users WHERE id = $1`,
        [userId]
    );

    return result.rows.length > 0;
};
