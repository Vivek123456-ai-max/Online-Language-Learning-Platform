package com.codeverse.dao;

import com.codeverse.exception.DatabaseException;
import com.codeverse.model.Role;
import com.codeverse.model.User;
import java.util.List;
import java.util.Optional;

/**
 * User Data Access Interface defining user-specific database contracts.
 */
public interface IUserDAO extends GenericDAO<User, String> {

    Optional<User> findByEmail(String email) throws DatabaseException;

    List<User> findByRole(Role role) throws DatabaseException;

    boolean updatePassword(String userId, String passwordHash) throws DatabaseException;

    boolean updateStats(String userId, int xpToAdd, int streakDays) throws DatabaseException;
}
