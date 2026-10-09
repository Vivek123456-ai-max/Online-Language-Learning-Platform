package com.codeverse.model;

import com.codeverse.exception.ValidationException;

/**
 * User Entity demonstrating OOP Encapsulation and Inheritance from BaseEntity.
 */
public class User extends BaseEntity {

    private String email;
    private String fullName;
    private String passwordHash;
    private String avatarUrl;
    private Role role;
    private int xpPoints;
    private int streakDays;

    public User() {
        super();
        this.role = Role.LEARNER;
        this.xpPoints = 0;
        this.streakDays = 0;
    }

    public User(String id, String email, String fullName, Role role) {
        super(id);
        setEmail(email);
        this.fullName = fullName;
        this.role = role != null ? role : Role.LEARNER;
        this.xpPoints = 0;
        this.streakDays = 0;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        if (email == null || !email.contains("@")) {
            throw new ValidationException("email", "Invalid email address format");
        }
        this.email = email.trim().toLowerCase();
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName != null ? fullName.trim() : "";
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role != null ? role : Role.LEARNER;
    }

    public int getXpPoints() {
        return xpPoints;
    }

    public void setXpPoints(int xpPoints) {
        this.xpPoints = Math.max(0, xpPoints);
    }

    public int getStreakDays() {
        return streakDays;
    }

    public void setStreakDays(int streakDays) {
        this.streakDays = Math.max(0, streakDays);
    }

    public boolean hasPermission(Role requiredRole) {
        return this.role.getLevel() >= requiredRole.getLevel();
    }

    @Override
    public String toString() {
        return "User{" +
                "id='" + getId() + '\'' +
                ", email='" + email + '\'' +
                ", fullName='" + fullName + '\'' +
                ", role=" + role +
                ", xpPoints=" + xpPoints +
                '}';
    }
}
