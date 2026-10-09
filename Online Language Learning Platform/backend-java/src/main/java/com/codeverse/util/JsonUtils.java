package com.codeverse.util;

import com.codeverse.model.Course;
import com.codeverse.model.Enrollment;
import com.codeverse.model.User;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Lightweight JSON Serialization Utility in pure Java.
 * Enables zero-dependency REST JSON responses for Servlets and Standalone Server.
 */
public class JsonUtils {

    public static String escape(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\b", "\\b")
                .replace("\f", "\\f")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    public static String userToJson(User u) {
        if (u == null) return "null";
        return String.format(
            "{\"id\":\"%s\",\"email\":\"%s\",\"fullName\":\"%s\",\"role\":\"%s\",\"avatarUrl\":\"%s\",\"xpPoints\":%d,\"streakDays\":%d}",
            escape(u.getId()),
            escape(u.getEmail()),
            escape(u.getFullName()),
            u.getRole() != null ? u.getRole().getRoleName() : "learner",
            escape(u.getAvatarUrl() != null ? u.getAvatarUrl() : ""),
            u.getXpPoints(),
            u.getStreakDays()
        );
    }

    public static String courseToJson(Course c) {
        if (c == null) return "null";
        return String.format(
            "{\"id\":\"%s\",\"title\":\"%s\",\"slug\":\"%s\",\"description\":\"%s\",\"languageName\":\"%s\",\"difficulty\":\"%s\",\"estimatedHours\":%d,\"isPublished\":%b,\"totalLessons\":%d}",
            escape(c.getId()),
            escape(c.getTitle()),
            escape(c.getSlug()),
            escape(c.getDescription()),
            escape(c.getLanguageName() != null ? c.getLanguageName() : "Multi-Language"),
            escape(c.getDifficulty()),
            c.getEstimatedHours(),
            c.isPublished(),
            c.getTotalLessons()
        );
    }

    public static String enrollmentToJson(Enrollment e) {
        if (e == null) return "null";
        return String.format(
            "{\"id\":\"%s\",\"userId\":\"%s\",\"courseId\":\"%s\",\"progressPercentage\":%d,\"status\":\"%s\",\"completedLessonsCount\":%d}",
            escape(e.getId()),
            escape(e.getUserId()),
            escape(e.getCourseId()),
            e.getProgressPercentage(),
            escape(e.getStatus()),
            e.getCompletedLessonsCount()
        );
    }

    public static <T> String listToJson(List<T> list, java.util.function.Function<T, String> mapper) {
        if (list == null || list.isEmpty()) return "[]";
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < list.size(); i++) {
            sb.append(mapper.apply(list.get(i)));
            if (i < list.size() - 1) sb.append(",");
        }
        sb.append("]");
        return sb.toString();
    }

    public static String mapToJson(Map<String, Object> map) {
        if (map == null) return "{}";
        StringBuilder sb = new StringBuilder("{");
        int count = 0;
        for (Map.Entry<String, Object> entry : map.entrySet()) {
            if (count > 0) sb.append(",");
            sb.append("\"").append(escape(entry.getKey())).append("\":");
            Object val = entry.getValue();
            if (val == null) {
                sb.append("null");
            } else if (val instanceof Number || val instanceof Boolean) {
                sb.append(val.toString());
            } else if (val instanceof String) {
                sb.append("\"").append(escape((String) val)).append("\"");
            } else {
                sb.append("\"").append(escape(val.toString())).append("\"");
            }
            count++;
        }
        sb.append("}");
        return sb.toString();
    }

    /**
     * Parses simple JSON key-values like {"email":"...", "password":"..."}
     */
    public static Map<String, String> parseSimpleJson(String json) {
        Map<String, String> map = new HashMap<>();
        if (json == null || json.trim().isEmpty()) return map;

        String clean = json.trim();
        if (clean.startsWith("{")) clean = clean.substring(1);
        if (clean.endsWith("}")) clean = clean.substring(0, clean.length() - 1);

        String[] pairs = clean.split(",(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)");
        for (String pair : pairs) {
            String[] kv = pair.split(":(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)", 2);
            if (kv.length == 2) {
                String key = kv[0].trim().replace("\"", "");
                String value = kv[1].trim().replace("\"", "");
                map.put(key, value);
            }
        }
        return map;
    }
}
