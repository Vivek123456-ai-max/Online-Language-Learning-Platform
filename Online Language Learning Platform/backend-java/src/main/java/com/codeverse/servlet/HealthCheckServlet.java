package com.codeverse.servlet;

import com.codeverse.config.DBConnection;
import com.codeverse.service.BackgroundSyncService;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.lang.management.ManagementFactory;
import java.sql.Connection;

/**
 * Health Check Servlet providing real-time diagnostics:
 * - JDBC PostgreSQL connectivity status
 * - JVM memory and thread metrics
 * - Background worker heartbeat
 */
@WebServlet(name = "HealthCheckServlet", urlPatterns = {"/api/health"})
public class HealthCheckServlet extends BaseServlet {

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        boolean dbConnected = false;
        String dbDetails = "PostgreSQL";

        try {
            Connection conn = DBConnection.getInstance().getConnection();
            if (conn != null && !conn.isClosed()) {
                dbConnected = true;
                dbDetails = conn.getMetaData().getDatabaseProductName() + " " + conn.getMetaData().getDatabaseProductVersion();
            } else if (DBConnection.getInstance().isMockMode()) {
                dbDetails = "Memory Cache Resilient Mode (Active)";
            }
        } catch (Exception e) {
            dbDetails = "Error: " + e.getMessage();
        }

        long uptime = ManagementFactory.getRuntimeMXBean().getUptime();
        int activeThreads = Thread.activeCount();
        long freeMemory = Runtime.getRuntime().freeMemory() / (1024 * 1024);
        long totalMemory = Runtime.getRuntime().totalMemory() / (1024 * 1024);

        String json = String.format(
            "{" +
            "\"status\":\"UP\"," +
            "\"platform\":\"CodeVerse Java Backend\"," +
            "\"architecture\":\"Java Servlets + JDBC + PostgreSQL\"," +
            "\"databaseConnected\":%b," +
            "\"databaseDetails\":\"%s\"," +
            "\"jvmVersion\":\"%s\"," +
            "\"uptimeMs\":%d," +
            "\"activeThreads\":%d," +
            "\"freeMemoryMB\":%d," +
            "\"totalMemoryMB\":%d," +
            "\"backgroundSyncEvents\":%d" +
            "}",
            dbConnected,
            dbDetails,
            System.getProperty("java.version"),
            uptime,
            activeThreads,
            freeMemory,
            totalMemory,
            BackgroundSyncService.getInstance().getTotalProcessedEvents()
        );

        sendJsonResponse(resp, HttpServletResponse.SC_OK, json);
    }
}
