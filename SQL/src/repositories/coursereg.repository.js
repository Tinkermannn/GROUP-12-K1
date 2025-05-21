const db = require('../database/pg.database');

exports.createCourseRegistration = async (registration) => {
    const { student_id, course_id, academic_year, semester, status = 'registered' } = registration;

    const result = await db.query(
        `INSERT INTO course_registrations 
         (student_id, course_id, academic_year, semester, status) 
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [student_id, course_id, academic_year, semester, status]
    );

    return exports.getCourseRegistrationById(result.rows[0].id);
};

exports.getAllCourseRegistrations = async () => {
    const result = await db.query(
        `SELECT cr.*, 
                s.nim, s.name as student_name, s.major, s.semester as student_semester,
                c.course_code, c.name as course_name, c.credits, c.semester as course_semester
         FROM course_registrations cr
         JOIN students s ON cr.student_id = s.id
         JOIN courses c ON cr.course_id = c.id
         ORDER BY cr.created_at DESC`
    );

    return result.rows;
};

exports.getCourseRegistrationById = async (id) => {
    const result = await db.query(
        `SELECT cr.*, 
                s.nim, s.name as student_name, s.major, s.semester as student_semester,
                c.course_code, c.name as course_name, c.credits, c.semester as course_semester
         FROM course_registrations cr
         JOIN students s ON cr.student_id = s.id
         JOIN courses c ON cr.course_id = c.id
         WHERE cr.id = $1`,
        [id]
    );

    return result.rows[0] || null;
};

exports.updateCourseRegistration = async (registration) => {
    const { id, student_id, course_id, academic_year, semester, status } = registration;

    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (student_id !== undefined) {
        fields.push(`student_id = $${paramIndex++}`);
        values.push(student_id);
    }

    if (course_id !== undefined) {
        fields.push(`course_id = $${paramIndex++}`);
        values.push(course_id);
    }

    if (academic_year !== undefined) {
        fields.push(`academic_year = $${paramIndex++}`);
        values.push(academic_year);
    }

    if (semester !== undefined) {
        fields.push(`semester = $${paramIndex++}`);
        values.push(semester);
    }

    if (status !== undefined) {
        fields.push(`status = $${paramIndex++}`);
        values.push(status);
    }

    if (fields.length === 0) {
        return exports.getCourseRegistrationById(id);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    await db.query(
        `UPDATE course_registrations 
         SET ${fields.join(', ')}
         WHERE id = $${paramIndex}`,
        values
    );

    return exports.getCourseRegistrationById(id);
};

exports.deleteCourseRegistration = async (id) => {
    const registration = await exports.getCourseRegistrationById(id);

    if (!registration) {
        return null;
    }

    await db.query(
        `DELETE FROM course_registrations WHERE id = $1`,
        [id]
    );

    return registration;
};

exports.findApprovedCoursesByStudentId = async (studentId) => {
    const result = await db.query(
        `SELECT cr.course_id
         FROM course_registrations cr
         WHERE cr.student_id = $1 AND cr.status = 'approved'`,
        [studentId]
    );

    return result.rows.map(course => course.course_id);
};

exports.getPrerequisitesForCourse = async (courseId) => {
    const result = await db.query(
        `SELECT c.*
         FROM courses c
         JOIN course_prerequisites cp ON c.id = cp.prerequisite_course_id
         WHERE cp.course_id = $1`,
        [courseId]
    );

    return result.rows;
};

exports.studentExists = async (studentId) => {
    const result = await db.query(
        `SELECT 1 FROM students WHERE id = $1`,
        [studentId]
    );

    return result.rows.length > 0;
};

exports.courseExists = async (courseId) => {
    const result = await db.query(
        `SELECT 1 FROM courses WHERE id = $1`,
        [courseId]
    );

    return result.rows.length > 0;
};
