package com.codeverse.exception;

/**
 * Custom runtime exception for invalid input parameters and payload validation.
 */
public class ValidationException extends RuntimeException {

    private String fieldName;

    public ValidationException(String message) {
        super(message);
    }

    public ValidationException(String fieldName, String message) {
        super("Validation failed on field '" + fieldName + "': " + message);
        this.fieldName = fieldName;
    }

    public String getFieldName() {
        return fieldName;
    }
}
