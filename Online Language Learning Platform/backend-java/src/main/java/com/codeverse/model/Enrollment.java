package com.codeverse.model;

/**
 * Enrollment Entity representing a student's enrollment in a course.
 */
public class Enrollment extends BaseEntity {

    private String userId;
    private String courseId;
    private int progressPercentage;
    private String status; // active, completed, dropped
    private int completedLessonsCount;

    public Enrollment() {
        super();
        this.progressPercentage = 0;
        this.status = "active";
        this.completedLessonsCount = 0;
    }

    public Enrollment(String id, String userId, String courseId) {
        super(id);
        this.userId = userId;
        this.courseId = courseId;
        this.progressPercentage = 0;
        this.status = "active";
        this.completedLessonsCount = 0;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getCourseId() {
        return courseId;
    }

    public void setCourseId(String courseId) {
        this.courseId = courseId;
    }

    public int getProgressPercentage() {
        return progressPercentage;
    }

    public void setProgressPercentage(int progressPercentage) {
        this.progressPercentage = Math.min(100, Math.max(0, progressPercentage));
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public int getCompletedLessonsCount() {
        return completedLessonsCount;
    }

    public void setCompletedLessonsCount(int completedLessonsCount) {
        this.completedLessonsCount = completedLessonsCount;
    }
}
