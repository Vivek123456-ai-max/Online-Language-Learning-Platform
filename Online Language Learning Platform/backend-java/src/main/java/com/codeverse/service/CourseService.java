package com.codeverse.service;

import com.codeverse.dao.CourseDAOImpl;
import com.codeverse.dao.EnrollmentDAOImpl;
import com.codeverse.dao.ICourseDAO;
import com.codeverse.dao.IEnrollmentDAO;
import com.codeverse.exception.DatabaseException;
import com.codeverse.model.Course;
import com.codeverse.model.Enrollment;

import java.util.List;
import java.util.Optional;

/**
 * Service Layer for Course Management and Student Enrollment.
 */
public class CourseService {

    private final ICourseDAO courseDAO;
    private final IEnrollmentDAO enrollmentDAO;

    public CourseService() {
        this.courseDAO = new CourseDAOImpl();
        this.enrollmentDAO = new EnrollmentDAOImpl();
    }

    public CourseService(ICourseDAO courseDAO, IEnrollmentDAO enrollmentDAO) {
        this.courseDAO = courseDAO;
        this.enrollmentDAO = enrollmentDAO;
    }

    public List<Course> getPublishedCourses() throws DatabaseException {
        return courseDAO.findPublishedCourses();
    }

    public Optional<Course> getCourseById(String id) throws DatabaseException {
        return courseDAO.findById(id);
    }

    public List<Course> searchCourses(String query) throws DatabaseException {
        return courseDAO.searchCourses(query);
    }

    public Enrollment enrollUserInCourse(String userId, String courseId) throws DatabaseException {
        Optional<Enrollment> existing = enrollmentDAO.findByUserAndCourse(userId, courseId);
        if (existing.isPresent()) {
            return existing.get();
        }

        Enrollment enrollment = new Enrollment();
        enrollment.setUserId(userId);
        enrollment.setCourseId(courseId);
        enrollment.setProgressPercentage(0);
        enrollment.setStatus("active");

        return enrollmentDAO.save(enrollment);
    }

    public List<Enrollment> getUserEnrollments(String userId) throws DatabaseException {
        return enrollmentDAO.findByUserId(userId);
    }

    public boolean updateLessonProgress(String enrollmentId, int progress, int completedLessons) throws DatabaseException {
        return enrollmentDAO.updateProgress(enrollmentId, progress, completedLessons);
    }
}
