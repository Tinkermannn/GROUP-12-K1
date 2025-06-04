const db = require('../database/pg.database');

exports.createCourse = async (courseData) => {
    const { course_code, name, credits, semester, lecturer_id, prerequisites } = courseData;

    const result = await db.query(
        `INSERT INTO courses (course_code, name, credits, semester, lecturer_id)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [course_code, name, credits, semester, lecturer_id]
    );

    const courseId = result.rows[0].id;

    // Insert prerequisites if any
    if (prerequisites && prerequisites.length > 0) {
        const prerequisiteValues = prerequisites.map(prereqId => `(${courseId}, ${prereqId})`).join(',');
        await db.query(
            `INSERT INTO course_prerequisites (course_id, prerequisite_course_id)
             VALUES ${prerequisiteValues}`
        );
    }

    return exports.getCourseById(courseId);
};

exports.getAllCourses = async () => {
    const result = await db.query(
        `SELECT c.*, l.name as lecturer_name, l.department as lecturer_department
         FROM courses c
         JOIN lecturers l ON c.lecturer_id = l.id
         ORDER BY c.updated_at DESC`
    );
    return result.rows;
};

exports.getCourseById = async (id) => {
    const result = await db.query(
        `SELECT c.*, l.name as lecturer_name, l.department as lecturer_department
         FROM courses c
         JOIN lecturers l ON c.lecturer_id = l.id
         WHERE c.id = $1`,
        [id]
    );
    const course = result.rows[0] || null;

    if (course) {
        const prereqResult = await db.query(
            `SELECT cp.prerequisite_course_id, c.name as prerequisite_name
             FROM course_prerequisites cp
             JOIN courses c ON cp.prerequisite_course_id = c.id
             WHERE cp.course_id = $1`,
            [id]
        );
        course.prerequisites = prereqResult.rows;
    }
    return course;
};

exports.updateCourse = async (courseData) => {
    const { id, course_code, name, credits, semester, lecturer_id, prerequisites } = courseData;
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (course_code !== undefined) {
        updateFields.push(`course_code = $${paramIndex++}`);
        updateValues.push(course_code);
    }
    if (name !== undefined) {
        updateFields.push(`name = $${paramIndex++}`);
        updateValues.push(name);
    }
    if (credits !== undefined) {
        updateFields.push(`credits = $${paramIndex++}`);
        updateValues.push(credits);
    }
    if (semester !== undefined) {
        updateFields.push(`semester = $${paramIndex++}`);
        updateValues.push(semester);
    }
    if (lecturer_id !== undefined) {
        updateFields.push(`lecturer_id = $${paramIndex++}`);
        updateValues.push(lecturer_id);
    }

    if (updateFields.length === 0 && prerequisites === undefined) {
        return exports.getCourseById(id);
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(id);

    await db.query(
        `UPDATE courses
         SET ${updateFields.join(', ')}
         WHERE id = $${paramIndex}`,
        updateValues
    );

    // Handle prerequisites update (delete existing, insert new)
    if (prerequisites !== undefined) {
        await db.query(`DELETE FROM course_prerequisites WHERE course_id = $1`, [id]);
        if (prerequisites.length > 0) {
            const prerequisiteValues = prerequisites.map(prereqId => `(${id}, ${prereqId})`).join(',');
            await db.query(
                `INSERT INTO course_prerequisites (course_id, prerequisite_course_id)
                 VALUES ${prerequisiteValues}`
            );
        }
    }

    return exports.getCourseById(id);
};

exports.deleteCourse = async (id) => {
    const course = await exports.getCourseById(id);
    if (!course) {
        return null;
    }
    await db.query(
        `DELETE FROM courses WHERE id = $1`,
        [id]
    );
    return course;
};

// NEW COMPLEX QUERY: Get All Courses with Lecturer Details and Prerequisite Course Names
exports.getCoursesWithDetails = async () => {
    const query = `
        SELECT
            c.id,
            c.course_code,
            c.name AS course_name,
            c.credits,
            c.semester,
            l.name AS lecturer_name,
            l.department AS lecturer_department,
            COALESCE(
                json_agg(
                    json_build_object(
                        'id', cp.prerequisite_course_id,
                        'name', pc.name
                    )
                ) FILTER (WHERE pc.id IS NOT NULL),
                '[]'
            ) AS prerequisites
        FROM
            courses c
        JOIN
            lecturers l ON c.lecturer_id = l.id
        LEFT JOIN
            course_prerequisites cp ON c.id = cp.course_id
        LEFT JOIN
            courses pc ON cp.prerequisite_course_id = pc.id
        GROUP BY
            c.id, c.course_code, c.name, c.credits, c.semester, l.name, l.department
        ORDER BY
            c.name;
    `;
    const result = await db.query(query);
    return result.rows;
};
