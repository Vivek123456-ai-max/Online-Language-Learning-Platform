package com.codeverse.model;

/**
 * Course Entity representing programming courses (Java, Python, C++, etc.).
 * Demonstrates OOP Inheritance and Data Model encapsulation.
 */
public class Course extends BaseEntity {

    private String title;
    private String slug;
    private String description;
    private String languageId;
    private String languageName;
    private String instructorId;
    private String difficulty; // beginner, intermediate, advanced
    private int estimatedHours;
    private boolean isPublished;
    private int totalLessons;

    public Course() {
        super();
        this.difficulty = "beginner";
        this.isPublished = true;
    }

    public Course(String id, String title, String slug, String languageId, String difficulty) {
        super(id);
        this.title = title;
        this.slug = slug;
        this.languageId = languageId;
        this.difficulty = difficulty != null ? difficulty : "beginner";
        this.isPublished = true;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getSlug() {
        return slug;
    }

    public void setSlug(String slug) {
        this.slug = slug;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getLanguageId() {
        return languageId;
    }

    public void setLanguageId(String languageId) {
        this.languageId = languageId;
    }

    public String getLanguageName() {
        return languageName;
    }

    public void setLanguageName(String languageName) {
        this.languageName = languageName;
    }

    public String getInstructorId() {
        return instructorId;
    }

    public void setInstructorId(String instructorId) {
        this.instructorId = instructorId;
    }

    public String getDifficulty() {
        return difficulty;
    }

    public void setDifficulty(String difficulty) {
        this.difficulty = difficulty;
    }

    public int getEstimatedHours() {
        return estimatedHours;
    }

    public void setEstimatedHours(int estimatedHours) {
        this.estimatedHours = estimatedHours;
    }

    public boolean isPublished() {
        return isPublished;
    }

    public void setPublished(boolean published) {
        isPublished = published;
    }

    public int getTotalLessons() {
        return totalLessons;
    }

    public void setTotalLessons(int totalLessons) {
        this.totalLessons = totalLessons;
    }

    @Override
    public String toString() {
        return "Course{" +
                "id='" + getId() + '\'' +
                ", title='" + title + '\'' +
                ", languageId='" + languageId + '\'' +
                ", difficulty='" + difficulty + '\'' +
                '}';
    }
}
