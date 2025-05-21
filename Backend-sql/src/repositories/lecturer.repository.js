const db = require('../database/pg.database');

exports.createLecturer = async (lecturerData) => {
    const { name, nidn, department } = lecturerData;

    const result = await db.query(
        `INSERT INTO lecturers (name, nidn, department) 
         VALUES ($1, $2, $3)
         RETURNING id`,
        [name, nidn, department]
    );

    return exports.getLecturerById(result.rows[0].id);
};

exports.getAllLecturers = async () => {
    const result = await db.query(
        `SELECT * FROM lecturers ORDER BY updated_at DESC`
    );

    return result.rows;
};

exports.getLecturerById = async (id) => {
    const result = await db.query(
        `SELECT * FROM lecturers WHERE id = $1`,
        [id]
    );

    return result.rows[0] || null;
};

exports.findByNidn = async (nidn) => {
    const result = await db.query(
        `SELECT * FROM lecturers WHERE nidn = $1`,
        [nidn]
    );

    return result.rows[0] || null;
};

exports.updateLecturer = async (lecturerData) => {
    const { id, name, nidn, department } = lecturerData;

    await db.query(
        `UPDATE lecturers 
         SET name = $1, nidn = $2, department = $3, updated_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [name, nidn, department, id]
    );

    return exports.getLecturerById(id);
};

exports.deleteLecturer = async (id) => {
    const lecturer = await exports.getLecturerById(id);

    if (!lecturer) {
        return null;
    }

    await db.query(
        `DELETE FROM lecturers WHERE id = $1`,
        [id]
    );

    return lecturer;
};
