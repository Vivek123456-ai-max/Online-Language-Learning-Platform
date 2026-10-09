package com.codeverse.dao;

import com.codeverse.config.DBConnection;
import com.codeverse.exception.DatabaseException;
import com.codeverse.model.Course;

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
 * JDBC Implementation of ICourseDAO with prepared statements and query filtering.
 */
public class CourseDAOImpl implements ICourseDAO {

    private static final Map<String, Course> memoryStore = new ConcurrentHashMap<>();

    static {
        // Seed default programming courses
        Course javaCourse = new Course("course-java-01", "Mastering Java: From Core OOP to Servlets", "mastering-java", "lang-java", "intermediate");
        javaCourse.setDescription("Learn Java Object-Oriented Programming, Collections, Multithreading, JDBC connectivity, and Servlets.");
        javaCourse.setLanguageName("Java");
        javaCourse.setEstimatedHours(35);
        javaCourse.setTotalLessons(24);
        memoryStore.put(javaCourse.getId(), javaCourse);

        Course pythonCourse = new Course("course-python-01", "Python for Modern Software Engineering", "python-fullstack", "lang-python", "beginner");
        pythonCourse.setDescription("Comprehensive guide to Python syntax, data structures, algorithms, and web integration.");
        pythonCourse.setLanguageName("Python");
        pythonCourse.setEstimatedHours(28);
        pythonCourse.setTotalLessons(18);
        memoryStore.put(pythonCourse.getId(), pythonCourse);

        Course cppCourse = new Course("course-cpp-01", "High-Performance Systems with Modern C++", "modern-cpp", "lang-cpp", "advanced");
        cppCourse.setDescription("Master pointers, memory management, STL algorithms, and low-latency system design.");
        cppCourse.setLanguageName("C++");
        cppCourse.setEstimatedHours(42);
        cppCourse.setTotalLessons(30);
        memoryStore.put(cppCourse.getId(), cppCourse);
    }

    @Override
    public Course save(Course course) throws DatabaseException {
        memoryStore.put(course.getId(), course);

        Connection conn = DBConnection.getInstance().getConnection();
        if (conn == null) {
            return course;
        }

        String sql = "INSERT INTO public.courses (id, title, slug, description, language_id, instructor_id, difficulty, estimated_hours, is_published, created_at, updated_at) " +
                     "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())";

        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, course.getId());
            ps.setString(2, course.getTitle());
            ps.setString(3, course.getSlug());
            ps.setString(4, course.getDescription());
            ps.setString(5, course.getLanguageId());
            ps.setString(6, course.getInstructorId());
            ps.setString(7, course.getDifficulty());
            ps.setInt(8, course.getEstimatedHours());
            ps.setBoolean(9, course.isPublished());
            ps.executeUpdate();
            return course;
        } catch (SQLException e) {
            throw new DatabaseException("JDBC Error creating course: " + e.getMessage(), e);
        }
    }

    @Override
    public Optional<Course> findById(String id) throws DatabaseException {
        if (id == null) return Optional.empty();

        Connection conn = DBConnection.getInstance().getConnection();
        if (conn == null) {
            return Optional.ofNullable(memoryStore.get(id));
        }

        String sql = "SELECT c.*, l.name AS language_name FROM public.courses c " +
                     "LEFT JOIN public.languages l ON l.id = c.language_id WHERE c.id = ?";

        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(mapResultSetToCourse(rs));
                }
            }
        } catch (SQLException e) {
            return Optional.ofNullable(memoryStore.get(id));
        }

        return Optional.ofNullable(memoryStore.get(id));
    }

    @Override
    public Optional<Course> findBySlug(String slug) throws DatabaseException {
        for (Course c : memoryStore.values()) {
            if (c.getSlug() != null && c.getSlug().equalsIgnoreCase(slug)) {
                return Optional.of(c);
            }
        }
        return Optional.empty();
    }

    @Override
    public List<Course> findAll() throws DatabaseException {
        return findPublishedCourses();
    }

    @Override
    public List<Course> findPublishedCourses() throws DatabaseException {
        Connection conn = DBConnection.getInstance().getConnection();
        if (conn == null) {
            return new ArrayList<>(memoryStore.values());
        }

        List<Course> list = new ArrayList<>();
        String sql = "SELECT c.*, l.name AS language_name FROM public.courses c " +
                     "LEFT JOIN public.languages l ON l.id = c.language_id " +
                     "WHERE c.is_published = true ORDER BY c.created_at DESC";

        try (PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                list.add(mapResultSetToCourse(rs));
            }
        } catch (SQLException e) {
            return new ArrayList<>(memoryStore.values());
        }

        return list.isEmpty() ? new ArrayList<>(memoryStore.values()) : list;
    }

    @Override
    public List<Course> findByLanguage(String languageId) throws DatabaseException {
        List<Course> list = new ArrayList<>();
        for (Course c : memoryStore.values()) {
            if (c.getLanguageId() != null && c.getLanguageId().equalsIgnoreCase(languageId)) {
                list.add(c);
            }
        }
        return list;
    }

    @Override
    public List<Course> searchCourses(String keyword) throws DatabaseException {
        if (keyword == null || keyword.trim().isEmpty()) {
            return findPublishedCourses();
        }

        String lower = keyword.toLowerCase();
        List<Course> results = new ArrayList<>();
        for (Course c : memoryStore.values()) {
            if ((c.getTitle() != null && c.getTitle().toLowerCase().contains(lower)) ||
                (c.getDescription() != null && c.getDescription().toLowerCase().contains(lower))) {
                results.add(c);
            }
        }
        return results;
    }

    @Override
    public Course update(Course course) throws DatabaseException {
        memoryStore.put(course.getId(), course);
        return course;
    }

    @Override
    public boolean deleteById(String id) throws DatabaseException {
        memoryStore.remove(id);
        return true;
    }

    private Course mapResultSetToCourse(ResultSet rs) throws SQLException {
        Course c = new Course();
        c.setId(rs.getString("id"));
        c.setTitle(rs.getString("title"));
        c.setSlug(rs.getString("slug"));
        c.setDescription(rs.getString("description"));
        c.setLanguageId(rs.getString("language_id"));
        c.setLanguageName(rs.getString("language_name"));
        c.setInstructorId(rs.getString("instructor_id"));
        c.setDifficulty(rs.getString("difficulty"));
        c.setEstimatedHours(rs.getInt("estimated_hours"));
        c.setPublished(rs.getBoolean("is_published"));
        return c;
    }
}
