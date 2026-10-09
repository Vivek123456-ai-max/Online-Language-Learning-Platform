package com.codeverse.dao;

import com.codeverse.exception.DatabaseException;
import com.codeverse.model.Enrollment;
import java.util.List;
import java.util.Optional;

/**
 * Enrollment Data Access Interface for student course progress tracking.
 */
public interface IEnrollmentDAO extends GenericDAO<Enrollment, String> {

    List<Enrollment> findByUserId(String userId) throws DatabaseException;

    Optional<Enrollment> findByUserAndCourse(String userId, String courseId) throws DatabaseException;

    boolean updateProgress(String enrollmentId, int progressPercentage, int completedLessons) throws DatabaseException;
}
