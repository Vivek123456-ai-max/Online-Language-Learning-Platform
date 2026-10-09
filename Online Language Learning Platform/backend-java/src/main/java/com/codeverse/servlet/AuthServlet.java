package com.codeverse.servlet;

import com.codeverse.exception.AuthenticationException;
import com.codeverse.exception.ValidationException;
import com.codeverse.model.Role;
import com.codeverse.model.User;
import com.codeverse.service.UserService;
import com.codeverse.util.JsonUtils;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.io.IOException;
import java.util.Map;

/**
 * Authentication Servlet managing User Session, Login, Registration, and Profile fetching.
 */
@WebServlet(name = "AuthServlet", urlPatterns = {"/api/auth/*"})
public class AuthServlet extends BaseServlet {

    private final UserService userService = new UserService();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String pathInfo = req.getPathInfo();

        if (pathInfo == null || pathInfo.equals("/") || pathInfo.equals("/me")) {
            // Retrieve current user from Java HttpSession
            HttpSession session = req.getSession(false);
            if (session != null && session.getAttribute("currentUser") != null) {
                User user = (User) session.getAttribute("currentUser");
                sendJsonResponse(resp, HttpServletResponse.SC_OK, "{\"authenticated\":true,\"user\":" + JsonUtils.userToJson(user) + "}");
            } else {
                sendJsonResponse(resp, HttpServletResponse.SC_OK, "{\"authenticated\":false,\"user\":null}");
            }
            return;
        }

        sendErrorResponse(resp, HttpServletResponse.SC_NOT_FOUND, "Auth endpoint not found: " + pathInfo);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String pathInfo = req.getPathInfo();
        String body = readRequestBody(req);
        Map<String, String> payload = JsonUtils.parseSimpleJson(body);

        try {
            if (pathInfo != null && pathInfo.endsWith("/login")) {
                handleLogin(payload, req, resp);
            } else if (pathInfo != null && pathInfo.endsWith("/register")) {
                handleRegister(payload, req, resp);
            } else if (pathInfo != null && pathInfo.endsWith("/logout")) {
                handleLogout(req, resp);
            } else {
                sendErrorResponse(resp, HttpServletResponse.SC_NOT_FOUND, "Unknown action: " + pathInfo);
            }
        } catch (AuthenticationException e) {
            sendErrorResponse(resp, HttpServletResponse.SC_UNAUTHORIZED, e.getMessage());
        } catch (ValidationException e) {
            sendErrorResponse(resp, HttpServletResponse.SC_BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            sendErrorResponse(resp, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Server Error: " + e.getMessage());
        }
    }

    private void handleLogin(Map<String, String> payload, HttpServletRequest req, HttpServletResponse resp) throws Exception {
        String email = payload.get("email");
        String password = payload.get("password");

        if (email == null || password == null) {
            throw new ValidationException("email/password", "Both email and password are required");
        }

        User user = userService.authenticateUser(email, password);

        // Store user in Java Web Session
        HttpSession session = req.getSession(true);
        session.setAttribute("currentUser", user);
        session.setMaxInactiveInterval(3600); // 1 hour session

        String json = "{\"success\":true,\"message\":\"Login successful\",\"user\":" + JsonUtils.userToJson(user) + "}";
        sendJsonResponse(resp, HttpServletResponse.SC_OK, json);
    }

    private void handleRegister(Map<String, String> payload, HttpServletRequest req, HttpServletResponse resp) throws Exception {
        String email = payload.get("email");
        String fullName = payload.get("fullName");
        String password = payload.get("password");
        String roleStr = payload.get("role");

        Role role = Role.fromString(roleStr);
        User newUser = userService.registerUser(email, fullName, password, role);

        HttpSession session = req.getSession(true);
        session.setAttribute("currentUser", newUser);

        String json = "{\"success\":true,\"message\":\"Account registered successfully\",\"user\":" + JsonUtils.userToJson(newUser) + "}";
        sendJsonResponse(resp, HttpServletResponse.SC_CREATED, json);
    }

    private void handleLogout(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        HttpSession session = req.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        sendJsonResponse(resp, HttpServletResponse.SC_OK, "{\"success\":true,\"message\":\"Logged out successfully\"}");
    }
}
