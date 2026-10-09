package com.codeverse.model;

/**
 * Lesson Entity representing modular coding lessons within courses.
 */
public class Lesson extends BaseEntity {

    private String courseId;
    private String moduleId;
    private String title;
    private String content;
    private int orderIndex;
    private String starterCode;
    private String solutionCode;
    private int xpReward;

    public Lesson() {
        super();
        this.xpReward = 50;
    }

    public Lesson(String id, String courseId, String title, int orderIndex) {
        super(id);
        this.courseId = courseId;
        this.title = title;
        this.orderIndex = orderIndex;
        this.xpReward = 50;
    }

    public String getCourseId() {
        return courseId;
    }

    public void setCourseId(String courseId) {
        this.courseId = courseId;
    }

    public String getModuleId() {
        return moduleId;
    }

    public void setModuleId(String moduleId) {
        this.moduleId = moduleId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public int getOrderIndex() {
        return orderIndex;
    }

    public void setOrderIndex(int orderIndex) {
        this.orderIndex = orderIndex;
    }

    public String getStarterCode() {
        return starterCode;
    }

    public void setStarterCode(String starterCode) {
        this.starterCode = starterCode;
    }

    public String getSolutionCode() {
        return solutionCode;
    }

    public void setSolutionCode(String solutionCode) {
        this.solutionCode = solutionCode;
    }

    public int getXpReward() {
        return xpReward;
    }

    public void setXpReward(int xpReward) {
        this.xpReward = xpReward;
    }
}
