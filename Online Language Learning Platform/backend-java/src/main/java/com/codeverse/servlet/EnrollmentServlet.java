package com.codeverse.servlet;

import com.codeverse.model.Enrollment;
import com.codeverse.service.CourseService;
import com.codeverse.util.JsonUtils;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import java.util.Map;

/**
 * Enrollment Servlet managing student enrollment and progress updates.
 */
@WebServlet(name = "EnrollmentServlet", urlPatterns = {"/api/enrollments/*"})
public class EnrollmentServlet extends BaseServlet {

    private final CourseService courseService = new CourseService();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String userId = req.getParameter("userId");

        if (userId == null || userId.trim().isEmpty()) {
            userId = "learner-uuid-1"; // Default demo student
        }

        try {
            List<Enrollment> enrollments = courseService.getUserEnrollments(userId);
            String json = JsonUtils.listToJson(enrollments, JsonUtils::enrollmentToJson);
            sendJsonResponse(resp, HttpServletResponse.SC_OK, json);
        } catch (Exception e) {
            sendErrorResponse(resp, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Failed to fetch enrollments: " + e.getMessage());
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String body = readRequestBody(req);
        Map<String, String> payload = JsonUtils.parseSimpleJson(body);

        String userId = payload.get("userId");
        String courseId = payload.get("courseId");

        if (userId == null || courseId == null) {
            sendErrorResponse(resp, HttpServletResponse.SC_BAD_REQUEST, "userId and courseId are required");
            return;
        }

        try {
            Enrollment enrollment = courseService.enrollUserInCourse(userId, courseId);
            String json = "{\"success\":true,\"message\":\"Enrolled successfully\",\"enrollment\":" + JsonUtils.enrollmentToJson(enrollment) + "}";
            sendJsonResponse(resp, HttpServletResponse.SC_CREATED, json);
        } catch (Exception e) {
            sendErrorResponse(resp, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Enrollment error: " + e.getMessage());
        }
    }
}
