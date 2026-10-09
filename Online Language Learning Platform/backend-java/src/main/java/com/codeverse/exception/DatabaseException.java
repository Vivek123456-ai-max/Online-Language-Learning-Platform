package com.codeverse.exception;

/**
 * Custom checked exception for Database & JDBC operations.
 * Demonstrates robust Java Exception Handling hierarchy.
 */
public class DatabaseException extends Exception {
    
    private int errorCode;

    public DatabaseException(String message) {
        super(message);
    }

    public DatabaseException(String message, Throwable cause) {
        super(message, cause);
    }

    public DatabaseException(String message, int errorCode, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
    }

    public int getErrorCode() {
        return errorCode;
    }
}
