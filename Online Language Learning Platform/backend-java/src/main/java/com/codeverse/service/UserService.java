package com.codeverse.service;

import com.codeverse.dao.IUserDAO;
import com.codeverse.dao.UserDAOImpl;
import com.codeverse.exception.AuthenticationException;
import com.codeverse.exception.DatabaseException;
import com.codeverse.exception.ValidationException;
import com.codeverse.model.Role;
import com.codeverse.model.User;

import java.util.List;
import java.util.Optional;

/**
 * Service Layer encapsulating Business Logic for User Management & Authentication.
 */
public class UserService {

    private final IUserDAO userDAO;

    public UserService() {
        this.userDAO = new UserDAOImpl();
    }

    public UserService(IUserDAO userDAO) {
        this.userDAO = userDAO;
    }

    public User registerUser(String email, String fullName, String password, Role role) throws DatabaseException {
        if (email == null || email.trim().isEmpty()) {
            throw new ValidationException("email", "Email cannot be empty");
        }
        if (password == null || password.length() < 6) {
            throw new ValidationException("password", "Password must have at least 6 characters");
        }

        Optional<User> existing = userDAO.findByEmail(email);
        if (existing.isPresent()) {
            throw new ValidationException("email", "User with this email already exists");
        }

        User newUser = new User();
        newUser.setEmail(email);
        newUser.setFullName(fullName != null ? fullName : "Learner");
        newUser.setRole(role != null ? role : Role.LEARNER);
        newUser.setPasswordHash(password); // In production, hash with BCrypt

        return userDAO.save(newUser);
    }

    public User authenticateUser(String email, String password) throws DatabaseException {
        if (email == null || password == null) {
            throw new AuthenticationException("Email and password are required");
        }

        Optional<User> userOpt = userDAO.findByEmail(email);
        if (userOpt.isEmpty()) {
            throw new AuthenticationException("Invalid email or password");
        }

        User user = userOpt.get();
        if (user.getPasswordHash() != null && !user.getPasswordHash().equals(password)) {
            throw new AuthenticationException("Invalid email or password");
        }

        return user;
    }

    public Optional<User> getUserById(String id) throws DatabaseException {
        return userDAO.findById(id);
    }

    public List<User> getAllUsers() throws DatabaseException {
        return userDAO.findAll();
    }

    public void awardProgressXP(String userId, int xpPoints) throws DatabaseException {
        userDAO.updateStats(userId, xpPoints, 1);
    }
}
