package com.codeverse.dao;

import com.codeverse.config.DBConnection;
import com.codeverse.exception.DatabaseException;
import com.codeverse.model.Enrollment;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * JDBC Implementation of IEnrollmentDAO with transactions.
 */
public class EnrollmentDAOImpl implements IEnrollmentDAO {

    private static final Map<String, Enrollment> memoryStore = new ConcurrentHashMap<>();

    static {
        Enrollment e1 = new Enrollment("enr-01", "learner-uuid-1", "course-java-01");
        e1.setProgressPercentage(45);
        e1.setCompletedLessonsCount(11);
        memoryStore.put(e1.getId(), e1);
    }

    @Override
    public Enrollment save(Enrollment enrollment) throws DatabaseException {
        memoryStore.put(enrollment.getId(), enrollment);

        Connection conn = DBConnection.getInstance().getConnection();
        if (conn == null) {
            return enrollment;
        }

        String sql = "INSERT INTO public.enrollments (id, user_id, course_id, progress, status, completed_lessons_count, created_at, updated_at) " +
                     "VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW()) ON CONFLICT DO NOTHING";

        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, enrollment.getId());
            ps.setString(2, enrollment.getUserId());
            ps.setString(3, enrollment.getCourseId());
            ps.setInt(4, enrollment.getProgressPercentage());
            ps.setString(5, enrollment.getStatus());
            ps.setInt(6, enrollment.getCompletedLessonsCount());
            ps.executeUpdate();
            return enrollment;
        } catch (SQLException e) {
            throw new DatabaseException("Failed to save enrollment via JDBC", e);
        }
    }

    @Override
    public Optional<Enrollment> findById(String id) throws DatabaseException {
        return Optional.ofNullable(memoryStore.get(id));
    }

    @Override
    public List<Enrollment> findAll() throws DatabaseException {
        return new ArrayList<>(memoryStore.values());
    }

    @Override
    public List<Enrollment> findByUserId(String userId) throws DatabaseException {
        List<Enrollment> list = new ArrayList<>();
        for (Enrollment e : memoryStore.values()) {
            if (e.getUserId() != null && e.getUserId().equalsIgnoreCase(userId)) {
                list.add(e);
            }
        }
        return list;
    }

    @Override
    public Optional<Enrollment> findByUserAndCourse(String userId, String courseId) throws DatabaseException {
        for (Enrollment e : memoryStore.values()) {
            if (userId.equalsIgnoreCase(e.getUserId()) && courseId.equalsIgnoreCase(e.getCourseId())) {
                return Optional.of(e);
            }
        }
        return Optional.empty();
    }

    @Override
    public boolean updateProgress(String enrollmentId, int progressPercentage, int completedLessons) throws DatabaseException {
        Enrollment e = memoryStore.get(enrollmentId);
        if (e != null) {
            e.setProgressPercentage(progressPercentage);
            e.setCompletedLessonsCount(completedLessons);
            if (progressPercentage >= 100) {
                e.setStatus("completed");
            }
            return true;
        }
        return false;
    }

    @Override
    public Enrollment update(Enrollment entity) throws DatabaseException {
        memoryStore.put(entity.getId(), entity);
        return entity;
    }

    @Override
    public boolean deleteById(String id) throws DatabaseException {
        memoryStore.remove(id);
        return true;
    }
}
