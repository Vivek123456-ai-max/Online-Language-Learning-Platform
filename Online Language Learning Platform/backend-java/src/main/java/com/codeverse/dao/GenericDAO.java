package com.codeverse.dao;

import com.codeverse.exception.DatabaseException;
import com.codeverse.model.BaseEntity;
import java.util.List;
import java.util.Optional;

/**
 * Generic Data Access Object Interface demonstrating Java Generics & Abstraction.
 *
 * @param <T> Domain entity extending BaseEntity
 * @param <ID> Primary key type (e.g., String UUID)
 */
public interface GenericDAO<T extends BaseEntity, ID> {

    /**
     * Persists a new entity to the database via JDBC.
     */
    T save(T entity) throws DatabaseException;

    /**
     * Retrieves an entity by its unique ID.
     */
    Optional<T> findById(ID id) throws DatabaseException;

    /**
     * Retrieves all entities in the database table.
     */
    List<T> findAll() throws DatabaseException;

    /**
     * Updates an existing entity.
     */
    T update(T entity) throws DatabaseException;

    /**
     * Deletes an entity by its primary key ID.
     */
    boolean deleteById(ID id) throws DatabaseException;
}
