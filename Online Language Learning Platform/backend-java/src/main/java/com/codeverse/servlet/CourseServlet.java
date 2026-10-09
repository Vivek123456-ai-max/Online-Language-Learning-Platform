package com.codeverse.servlet;

import com.codeverse.model.Course;
import com.codeverse.service.CourseService;
import com.codeverse.util.JsonUtils;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import java.util.Optional;

/**
 * Course Controller Servlet handling catalog retrieval, filtering, and search.
 */
@WebServlet(name = "CourseServlet", urlPatterns = {"/api/courses/*"})
public class CourseServlet extends BaseServlet {

    private final CourseService courseService = new CourseService();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String pathInfo = req.getPathInfo();
        String searchQuery = req.getParameter("search");

        try {
            // Case 1: Search query provided (?search=java)
            if (searchQuery != null && !searchQuery.trim().isEmpty()) {
                List<Course> results = courseService.searchCourses(searchQuery);
                String json = JsonUtils.listToJson(results, JsonUtils::courseToJson);
                sendJsonResponse(resp, HttpServletResponse.SC_OK, json);
                return;
            }

            // Case 2: Specific course by ID (/api/courses/course-java-01)
            if (pathInfo != null && pathInfo.length() > 1) {
                String courseId = pathInfo.substring(1);
                Optional<Course> courseOpt = courseService.getCourseById(courseId);
                if (courseOpt.isPresent()) {
                    sendJsonResponse(resp, HttpServletResponse.SC_OK, JsonUtils.courseToJson(courseOpt.get()));
                } else {
                    sendErrorResponse(resp, HttpServletResponse.SC_NOT_FOUND, "Course not found: " + courseId);
                }
                return;
            }

            // Case 3: List all published courses
            List<Course> courses = courseService.getPublishedCourses();
            String json = JsonUtils.listToJson(courses, JsonUtils::courseToJson);
            sendJsonResponse(resp, HttpServletResponse.SC_OK, json);

        } catch (Exception e) {
            sendErrorResponse(resp, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Database query error: " + e.getMessage());
        }
    }
}
