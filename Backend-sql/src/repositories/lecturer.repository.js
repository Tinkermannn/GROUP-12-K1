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

exports.updateLecturer = async (lecturerData) => {
    const { id, name, nidn, department } = lecturerData;
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (name !== undefined) {
        updateFields.push(`name = $${paramIndex++}`);
        updateValues.push(name);
    }
    if (nidn !== undefined) {
        updateFields.push(`nidn = $${paramIndex++}`);
        updateValues.push(nidn);
    }
    if (department !== undefined) {
        updateFields.push(`department = $${paramIndex++}`);
        updateValues.push(department);
    }

    if (updateFields.length === 0) {
        return exports.getLecturerById(id);
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(id);

    await db.query(
        `UPDATE lecturers
         SET ${updateFields.join(', ')}
         WHERE id = $${paramIndex}`,
        updateValues
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

// NEW COMPLEX QUERY: Get All Lecturers with Course Count
exports.getLecturersWithCourseCount = async () => {
    const query = `
        SELECT
            l.id,
            l.name,
            l.nidn,
            l.department,
            COUNT(c.id) AS course_count
        FROM
            lecturers l
        LEFT JOIN
            courses c ON l.id = c.lecturer_id
        GROUP BY
            l.id, l.name, l.nidn, l.department
        ORDER BY
            l.name;
    `;
    const result = await db.query(query);
    return result.rows;
};
