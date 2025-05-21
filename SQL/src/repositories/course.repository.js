const db = require('../database/pg.database');

exports.createCourse = async (course) => {
    // Insert the course
    const insertCourseQuery = `
        INSERT INTO courses (course_code, name, credits, semester, lecturer_id) 
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
    `;
    const courseResult = await db.query(insertCourseQuery, [
        course.course_code,
        course.name,
        course.credits,
        course.semester,
        course.lecturer_id
    ]);

    const courseId = courseResult.rows[0].id;

    // Insert prerequisites if any
    if (course.prerequisites && course.prerequisites.length > 0) {
        const values = course.prerequisites
            .map((_, idx) => `($1, $${idx + 2})`)
            .join(', ');

        await db.query(
            `INSERT INTO course_prerequisites (course_id, prerequisite_course_id) VALUES ${values}`,
            [courseId, ...course.prerequisites]
        );
    }

    return exports.getCourseById(courseId);
};

exports.getAllCourses = async () => {
    const result = await db.query(`
        SELECT c.*, l.name AS lecturer_name, l.nidn, l.department
        FROM courses c
        JOIN lecturers l ON c.lecturer_id = l.id
        ORDER BY c.updated_at DESC
    `);
    const courses = result.rows;

    for (const course of courses) {
        const prerequisitesResult = await db.query(
            `SELECT c.* 
             FROM courses c
             JOIN course_prerequisites cp ON c.id = cp.prerequisite_course_id
             WHERE cp.course_id = $1`,
            [course.id]
        );
        course.prerequisites = prerequisitesResult.rows;
    }

    return courses;
};

exports.getCourseById = async (id) => {
    const courseResult = await db.query(
        `SELECT c.*, l.name AS lecturer_name, l.nidn, l.department
         FROM courses c
         JOIN lecturers l ON c.lecturer_id = l.id
         WHERE c.id = $1`,
        [id]
    );

    if (courseResult.rows.length === 0) return null;

    const course = courseResult.rows[0];

    const prerequisitesResult = await db.query(
        `SELECT c.*
         FROM courses c
         JOIN course_prerequisites cp ON c.id = cp.prerequisite_course_id
         WHERE cp.course_id = $1`,
        [id]
    );

    course.prerequisites = prerequisitesResult.rows;

    return course;
};

exports.updateCourse = async (course) => {
    await db.query(
        `UPDATE courses 
         SET course_code = $1, name = $2, credits = $3, semester = $4, lecturer_id = $5, updated_at = CURRENT_TIMESTAMP
         WHERE id = $6`,
        [
            course.course_code,
            course.name,
            course.credits,
            course.semester,
            course.lecturer_id,
            course.id
        ]
    );

    if (course.prerequisites !== undefined) {
        await db.query(`DELETE FROM course_prerequisites WHERE course_id = $1`, [course.id]);

        if (course.prerequisites.length > 0) {
            const values = course.prerequisites
                .map((_, idx) => `($1, $${idx + 2})`)
                .join(', ');

            await db.query(
                `INSERT INTO course_prerequisites (course_id, prerequisite_course_id) VALUES ${values}`,
                [course.id, ...course.prerequisites]
            );
        }
    }

    return exports.getCourseById(course.id);
};

exports.deleteCourse = async (id) => {
    const course = await exports.getCourseById(id);
    if (!course) return null;

    await db.query(
        `DELETE FROM course_prerequisites WHERE course_id = $1 OR prerequisite_course_id = $1`,
        [id]
    );

    await db.query(`DELETE FROM courses WHERE id = $1`, [id]);

    return course;
};

exports.findByCourseIds = async (courseIds) => {
    if (courseIds.length === 0) return [];

    const placeholders = courseIds.map((_, i) => `$${i + 1}`).join(', ');

    const result = await db.query(
        `SELECT * FROM courses WHERE id IN (${placeholders})`,
        courseIds
    );

    return result.rows;
};
