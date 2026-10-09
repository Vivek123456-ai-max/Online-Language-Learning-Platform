package com.codeverse.config;

import com.codeverse.exception.DatabaseException;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

/**
 * Singleton Database Connection Manager implementing JDBC best practices.
 * Handles Connection pooling / singleton instance, transactions, and driver loading.
 */
public class DBConnection {

    private static DBConnection instance;
    private Connection connection;

    // Default configuration (supports Supabase Postgres / Localhost Postgres)
    private static final String DEFAULT_DRIVER = "org.postgresql.Driver";
    private static final String DB_URL = System.getenv("JDBC_DATABASE_URL") != null
            ? System.getenv("JDBC_DATABASE_URL")
            : "jdbc:postgresql://db.bxzdpsmqunpetlvjuptw.supabase.co:5432/postgres";
    private static final String DB_USER = System.getenv("DB_USER") != null
            ? System.getenv("DB_USER")
            : "postgres";
    private static final String DB_PASSWORD = System.getenv("DB_PASSWORD") != null
            ? System.getenv("DB_PASSWORD")
            : "postgres";

    private boolean isMockMode = false;

    private DBConnection() {
        try {
            Class.forName(DEFAULT_DRIVER);
        } catch (ClassNotFoundException e) {
            System.out.println("[DBConnection] PostgreSQL Driver not found in classpath. Falling back to active memory DAO mode.");
            this.isMockMode = true;
        }
    }

    /**
     * Singleton Instance Accessor (Thread-safe Double-Checked Locking)
     */
    public static DBConnection getInstance() {
        if (instance == null) {
            synchronized (DBConnection.class) {
                if (instance == null) {
                    instance = new DBConnection();
                }
            }
        }
        return instance;
    }

    /**
     * Establishes and returns an active JDBC Connection.
     */
    public synchronized Connection getConnection() throws DatabaseException {
        if (isMockMode) {
            return null; // Signals DAO layer to use fast memory fallback
        }

        try {
            if (connection == null || connection.isClosed()) {
                DriverManager.setLoginTimeout(3);
                connection = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD);
                System.out.println("[DBConnection] Successfully connected to PostgreSQL via JDBC!");
            }
            return connection;
        } catch (SQLException e) {
            System.err.println("[DBConnection] JDBC Connection Warning: " + e.getMessage() + ". Enabling resilient fallback.");
            this.isMockMode = true;
            return null;
        }
    }

    public boolean isMockMode() {
        return isMockMode;
    }

    public void setMockMode(boolean mockMode) {
        this.isMockMode = mockMode;
    }

    /**
     * Transaction Management: Begin Transaction
     */
    public void beginTransaction() throws DatabaseException {
        try {
            Connection conn = getConnection();
            if (conn != null) {
                conn.setAutoCommit(false);
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to begin transaction", e);
        }
    }

    /**
     * Transaction Management: Commit Transaction
     */
    public void commitTransaction() throws DatabaseException {
        try {
            Connection conn = getConnection();
            if (conn != null) {
                conn.commit();
                conn.setAutoCommit(true);
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to commit transaction", e);
        }
    }

    /**
     * Transaction Management: Rollback Transaction
     */
    public void rollbackTransaction() {
        try {
            Connection conn = getConnection();
            if (conn != null) {
                conn.rollback();
                conn.setAutoCommit(true);
            }
        } catch (Exception e) {
            System.err.println("[DBConnection] Rollback error: " + e.getMessage());
        }
    }

    /**
     * Closes JDBC Resources safely
     */
    public static void close(ResultSet rs, Statement stmt, Connection conn) {
        if (rs != null) {
            try { rs.close(); } catch (SQLException ignored) {}
        }
        if (stmt != null) {
            try { stmt.close(); } catch (SQLException ignored) {}
        }
        if (conn != null) {
            try { conn.close(); } catch (SQLException ignored) {}
        }
    }
}
