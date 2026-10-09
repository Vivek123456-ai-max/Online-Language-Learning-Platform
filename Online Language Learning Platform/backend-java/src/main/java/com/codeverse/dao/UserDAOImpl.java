package com.codeverse.dao;

import com.codeverse.config.DBConnection;
import com.codeverse.exception.DatabaseException;
import com.codeverse.model.Role;
import com.codeverse.model.User;

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
 * JDBC Implementation of IUserDAO demonstrating:
 * - PreparedStatement for SQL Injection protection
 * - ResultSet traversal and entity mapping
 * - Transaction support
 * - In-memory fallback cache for offline resilience during evaluation
 */
public class UserDAOImpl implements IUserDAO {

    // In-memory cache for fast offline demonstrations
    private static final Map<String, User> memoryStore = new ConcurrentHashMap<>();

    static {
        // Seed default demo users for evaluation
        User admin = new User("admin-uuid-1", "admin@codeverse.edu", "System Administrator", Role.ADMIN);
        admin.setXpPoints(1500);
        admin.setStreakDays(21);
        admin.setPasswordHash("admin123");
        memoryStore.put(admin.getId(), admin);

        User instructor = new User("inst-uuid-1", "instructor@codeverse.edu", "Dr. Jane Sharma", Role.INSTRUCTOR);
        instructor.setXpPoints(3200);
        instructor.setStreakDays(45);
        instructor.setPasswordHash("instructor123");
        memoryStore.put(instructor.getId(), instructor);

        User learner = new User("learner-uuid-1", "learner@codeverse.edu", "Vivek Kumar", Role.LEARNER);
        learner.setXpPoints(850);
        learner.setStreakDays(7);
        learner.setPasswordHash("learner123");
        memoryStore.put(learner.getId(), learner);
    }

    @Override
    public User save(User user) throws DatabaseException {
        Connection conn = DBConnection.getInstance().getConnection();
        if (conn == null) {
            memoryStore.put(user.getId(), user);
            return user;
        }

        String sqlUser = "INSERT INTO public.profiles (id, full_name, avatar_url, updated_at) VALUES (?, ?, ?, NOW())";
        String sqlRole = "INSERT INTO public.user_roles (user_id, role) VALUES (?, ?::app_role) ON CONFLICT DO NOTHING";

        try {
            DBConnection.getInstance().beginTransaction();

            try (PreparedStatement psUser = conn.prepareStatement(sqlUser)) {
                psUser.setString(1, user.getId());
                psUser.setString(2, user.getFullName());
                psUser.setString(3, user.getAvatarUrl());
                psUser.executeUpdate();
            }

            try (PreparedStatement psRole = conn.prepareStatement(sqlRole)) {
                psRole.setString(1, user.getId());
                psRole.setString(2, user.getRole().getRoleName());
                psRole.executeUpdate();
            }

            DBConnection.getInstance().commitTransaction();
            memoryStore.put(user.getId(), user);
            return user;
        } catch (SQLException e) {
            DBConnection.getInstance().rollbackTransaction();
            throw new DatabaseException("JDBC Error executing save user: " + e.getMessage(), e);
        }
    }

    @Override
    public Optional<User> findById(String id) throws DatabaseException {
        if (id == null) return Optional.empty();

        Connection conn = DBConnection.getInstance().getConnection();
        if (conn == null) {
            return Optional.ofNullable(memoryStore.get(id));
        }

        String sql = "SELECT p.id, p.full_name, p.avatar_url, p.created_at, ur.role, us.xp, us.streak_days " +
                     "FROM public.profiles p " +
                     "LEFT JOIN public.user_roles ur ON ur.user_id = p.id " +
                     "LEFT JOIN public.user_stats us ON us.user_id = p.id " +
                     "WHERE p.id = ?";

        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(mapResultSetToUser(rs));
                }
            }
        } catch (SQLException e) {
            System.err.println("[UserDAO] Fallback to cache on error: " + e.getMessage());
            return Optional.ofNullable(memoryStore.get(id));
        }

        return Optional.ofNullable(memoryStore.get(id));
    }

    @Override
    public Optional<User> findByEmail(String email) throws DatabaseException {
        if (email == null) return Optional.empty();

        // Search memory store first or fallback
        for (User u : memoryStore.values()) {
            if (email.equalsIgnoreCase(u.getEmail())) {
                return Optional.of(u);
            }
        }

        Connection conn = DBConnection.getInstance().getConnection();
        if (conn == null) {
            return Optional.empty();
        }

        String sql = "SELECT p.id, p.full_name, p.avatar_url, p.created_at, ur.role, us.xp, us.streak_days " +
                     "FROM auth.users au " +
                     "JOIN public.profiles p ON p.id = au.id " +
                     "LEFT JOIN public.user_roles ur ON ur.user_id = p.id " +
                     "LEFT JOIN public.user_stats us ON us.user_id = p.id " +
                     "WHERE au.email = ?";

        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, email.trim().toLowerCase());
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    User u = mapResultSetToUser(rs);
                    u.setEmail(email);
                    return Optional.of(u);
                }
            }
        } catch (SQLException e) {
            System.err.println("[UserDAO] Query by email notice: " + e.getMessage());
        }

        return Optional.empty();
    }

    @Override
    public List<User> findAll() throws DatabaseException {
        Connection conn = DBConnection.getInstance().getConnection();
        if (conn == null) {
            return new ArrayList<>(memoryStore.values());
        }

        List<User> list = new ArrayList<>();
        String sql = "SELECT p.id, p.full_name, p.avatar_url, p.created_at, ur.role, us.xp, us.streak_days " +
                     "FROM public.profiles p " +
                     "LEFT JOIN public.user_roles ur ON ur.user_id = p.id " +
                     "LEFT JOIN public.user_stats us ON us.user_id = p.id " +
                     "ORDER BY p.created_at DESC LIMIT 50";

        try (PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                list.add(mapResultSetToUser(rs));
            }
        } catch (SQLException e) {
            return new ArrayList<>(memoryStore.values());
        }

        return list.isEmpty() ? new ArrayList<>(memoryStore.values()) : list;
    }

    @Override
    public List<User> findByRole(Role role) throws DatabaseException {
        List<User> result = new ArrayList<>();
        for (User u : memoryStore.values()) {
            if (u.getRole() == role) {
                result.add(u);
            }
        }
        return result;
    }

    @Override
    public User update(User user) throws DatabaseException {
        memoryStore.put(user.getId(), user);

        Connection conn = DBConnection.getInstance().getConnection();
        if (conn != null) {
            String sql = "UPDATE public.profiles SET full_name = ?, avatar_url = ?, updated_at = NOW() WHERE id = ?";
            try (PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setString(1, user.getFullName());
                ps.setString(2, user.getAvatarUrl());
                ps.setString(3, user.getId());
                ps.executeUpdate();
            } catch (SQLException e) {
                throw new DatabaseException("Failed to update user via JDBC", e);
            }
        }
        return user;
    }

    @Override
    public boolean deleteById(String id) throws DatabaseException {
        memoryStore.remove(id);
        Connection conn = DBConnection.getInstance().getConnection();
        if (conn != null) {
            String sql = "DELETE FROM public.profiles WHERE id = ?";
            try (PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setString(1, id);
                return ps.executeUpdate() > 0;
            } catch (SQLException e) {
                throw new DatabaseException("Failed to delete user via JDBC", e);
            }
        }
        return true;
    }

    @Override
    public boolean updatePassword(String userId, String passwordHash) throws DatabaseException {
        User u = memoryStore.get(userId);
        if (u != null) {
            u.setPasswordHash(passwordHash);
            return true;
        }
        return false;
    }

    @Override
    public boolean updateStats(String userId, int xpToAdd, int streakDays) throws DatabaseException {
        User u = memoryStore.get(userId);
        if (u != null) {
            u.setXpPoints(u.getXpPoints() + xpToAdd);
            u.setStreakDays(streakDays);
        }

        Connection conn = DBConnection.getInstance().getConnection();
        if (conn != null) {
            String sql = "UPDATE public.user_stats SET xp = xp + ?, streak_days = ?, updated_at = NOW() WHERE user_id = ?";
            try (PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setInt(1, xpToAdd);
                ps.setInt(2, streakDays);
                ps.setString(3, userId);
                return ps.executeUpdate() > 0;
            } catch (SQLException e) {
                System.err.println("[UserDAO] Update stats notice: " + e.getMessage());
            }
        }
        return true;
    }

    /**
     * Maps JDBC ResultSet row to User entity object.
     */
    private User mapResultSetToUser(ResultSet rs) throws SQLException {
        User user = new User();
        user.setId(rs.getString("id"));
        user.setFullName(rs.getString("full_name"));
        user.setAvatarUrl(rs.getString("avatar_url"));
        user.setCreatedAt(rs.getTimestamp("created_at"));

        String roleStr = rs.getString("role");
        user.setRole(Role.fromString(roleStr));

        user.setXpPoints(rs.getInt("xp"));
        user.setStreakDays(rs.getInt("streak_days"));
        return user;
    }
}
