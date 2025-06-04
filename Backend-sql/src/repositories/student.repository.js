const db = require('../database/pg.database');

exports.createStudent = async (studentData) => {
    const { user_id, nim, name, major, semester, student_status } = studentData; // Added student_status

    const result = await db.query(
        `INSERT INTO students (user_id, nim, name, major, semester, student_status)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [user_id, nim, name, major, semester, student_status] // Added student_status
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
    const { id, user_id, nim, name, major, semester, student_status } = studentData; // Added student_status
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
    if (student_status !== undefined) { // Added student_status update
        updateFields.push(`student_status = $${paramIndex++}`);
        updateValues.push(student_status);
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

// Get All Students with Full User Details and their Registered Courses (existing complex query)
exports.getStudentsWithDetailsAndCourses = async () => {
    const query = `
        SELECT
            s.id AS student_id,
            s.nim,
            s.name AS student_name,
            s.major,
            s.semester,
            s.student_status, -- Added student_status
            u.username,
            u.email,
            COALESCE(
                json_agg(
                    json_build_object(
                        'registration_id', cr.id,
                        'course_id', c.id,
                        'course_code', c.course_code,
                        'course_name', c.name,
                        'credits', c.credits,
                        'academic_year', cr.academic_year,
                        'registration_semester', cr.semester,
                        'status', cr.status
                    )
                ) FILTER (WHERE cr.id IS NOT NULL),
                '[]'
            ) AS registered_courses
        FROM
            students s
        JOIN
            users u ON s.user_id = u.id
        LEFT JOIN
            course_registrations cr ON s.id = cr.student_id
        LEFT JOIN
            courses c ON cr.course_id = c.id
        GROUP BY
            s.id, s.nim, s.name, s.major, s.semester, s.student_status, u.username, u.email -- Added student_status to GROUP BY
        ORDER BY
            s.name;
    `;
    const result = await db.query(query);
    return result.rows;
};
