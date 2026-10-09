package com.codeverse;

import com.codeverse.server.CodeVerseAppServer;

/**
 * Main Application Entry Point for CodeVerse Java Web Backend.
 */
public class Main {

    public static void main(String[] args) {
        int port = 8080;
        if (args.length > 0) {
            try {
                port = Integer.parseInt(args[0]);
            } catch (NumberFormatException ignored) {}
        }

        try {
            CodeVerseAppServer server = new CodeVerseAppServer(port);
            server.start();
        } catch (Exception e) {
            System.err.println("Fatal: Failed to start CodeVerse Server: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
