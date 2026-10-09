package com.codeverse.model;

/**
 * Enumeration representing user access roles in CodeVerse.
 * Demonstrates Type-Safe Enums in Java.
 */
public enum Role {
    LEARNER("learner", 1),
    INSTRUCTOR("instructor", 2),
    ADMIN("admin", 3);

    private final String roleName;
    private final int level;

    Role(String roleName, int level) {
        this.roleName = roleName;
        this.level = level;
    }

    public String getRoleName() {
        return roleName;
    }

    public int getLevel() {
        return level;
    }

    public static Role fromString(String text) {
        if (text == null) return LEARNER;
        for (Role r : Role.values()) {
            if (r.roleName.equalsIgnoreCase(text) || r.name().equalsIgnoreCase(text)) {
                return r;
            }
        }
        return LEARNER;
    }
}
