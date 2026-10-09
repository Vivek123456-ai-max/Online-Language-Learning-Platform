package com.codeverse.dao;

import com.codeverse.exception.DatabaseException;
import com.codeverse.model.Course;
import java.util.List;
import java.util.Optional;

/**
 * Course Data Access Interface defining course-related database operations.
 */
public interface ICourseDAO extends GenericDAO<Course, String> {

    Optional<Course> findBySlug(String slug) throws DatabaseException;

    List<Course> findByLanguage(String languageId) throws DatabaseException;

    List<Course> findPublishedCourses() throws DatabaseException;

    List<Course> searchCourses(String keyword) throws DatabaseException;
}
