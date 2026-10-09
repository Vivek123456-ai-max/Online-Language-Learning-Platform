package com.codeverse.servlet;

import com.codeverse.service.BackgroundSyncService;
import com.codeverse.util.JsonUtils;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;

/**
 * Base Abstract Servlet demonstrating OOP Inheritance and Reusable Web Controller logic.
 * Encapsulates JSON serialization, CORS management, and standardized HTTP responses.
 */
public abstract class BaseServlet extends HttpServlet {

    @Override
    public void init() throws ServletException {
        super.init();
        // Ensure background multi-threaded worker is active
        BackgroundSyncService.getInstance().start();
    }

    /**
     * Injects standard CORS headers allowing React frontend to communicate with Java Servlets.
     */
    protected void applyCorsHeaders(HttpServletResponse response) {
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
        response.setHeader("Access-Control-Max-Age", "3600");
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        applyCorsHeaders(resp);
        resp.setStatus(HttpServletResponse.SC_OK);
    }

    /**
     * Sends a formatted JSON success response.
     */
    protected void sendJsonResponse(HttpServletResponse response, int statusCode, String jsonBody) throws IOException {
        applyCorsHeaders(response);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.setStatus(statusCode);

        PrintWriter out = response.getWriter();
        out.print(jsonBody);
        out.flush();
    }

    /**
     * Sends a formatted JSON error response.
     */
    protected void sendErrorResponse(HttpServletResponse response, int statusCode, String message) throws IOException {
        String errorJson = String.format("{\"error\":true,\"status\":%d,\"message\":\"%s\"}", statusCode, JsonUtils.escape(message));
        sendJsonResponse(response, statusCode, errorJson);
    }

    /**
     * Reads the entire HTTP request payload as a String.
     */
    protected String readRequestBody(HttpServletRequest request) throws IOException {
        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = request.getReader()) {
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
        }
        return sb.toString();
    }
}
