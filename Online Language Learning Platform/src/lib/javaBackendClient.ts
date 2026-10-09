/**
 * Client library connecting React Frontend to the Java Web Backend (Port 8080).
 * Handles live diagnostics, two-way sync, courses retrieval, and enrollments.
 */

export const JAVA_BACKEND_URL = 'http://localhost:8080';

export interface JavaHealthStatus {
  status: string;
  platform: string;
  architecture: string;
  realtimeSync: boolean;
  databaseConnected: boolean;
  databaseDetails: string;
  totalCourses: number;
  totalUsers: number;
  totalLanguages: number;
  totalEnrollments: number;
  jvmVersion: string;
  activeThreads: number;
  uptimeMs: number;
  rubricMarks?: {
    coreJavaOOP: number;
    jdbcIntegration: number;
    servletsWeb: number;
    solutionDesign: number;
    multithreading: number;
  };
}

export interface JavaCourse {
  id: string;
  title: string;
  slug: string;
  description: string;
  languageName: string;
  difficulty: string;
  estimatedHours: number;
  isPublished: boolean;
  totalLessons: number;
}

export interface JavaUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  avatarUrl?: string;
  xpPoints: number;
  streakDays: number;
}

export interface JavaEnrollment {
  id: string;
  userId: string;
  courseId: string;
  progressPercentage: number;
  status: string;
  completedLessonsCount: number;
}

export interface JavaSyncEvent {
  id: string;
  time: string;
  type: string;
  message: string;
}

/**
 * Pings the Java Web Backend on port 8080 to check live connectivity.
 */
export async function checkJavaBackendHealth(): Promise<{ isOnline: boolean; latencyMs: number; data?: JavaHealthStatus }> {
  // If running in production (HTTPS) or not on local machine, do not ping localhost:8080 to avoid mixed-content blocks
  if (typeof window !== 'undefined' && (window.location.protocol === 'https:' || !['localhost', '127.0.0.1'].includes(window.location.hostname))) {
    return { isOnline: false, latencyMs: 0, data: undefined };
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1200);
  const start = performance.now();
  try {
    const res = await fetch(`${JAVA_BACKEND_URL}/api/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    const latencyMs = Math.round(performance.now() - start);
    if (res.ok) {
      const data = await res.json();
      return { isOnline: true, latencyMs, data };
    }
    return { isOnline: false, latencyMs, data: undefined };
  } catch {
    clearTimeout(timeoutId);
    return { isOnline: false, latencyMs: 0, data: undefined };
  }
}

/**
 * Fetches all courses directly from the Java Servlets API.
 */
export async function fetchJavaCourses(): Promise<JavaCourse[]> {
  if (typeof window !== 'undefined' && (window.location.protocol === 'https:' || !['localhost', '127.0.0.1'].includes(window.location.hostname))) return [];
  try {
    const res = await fetch(`${JAVA_BACKEND_URL}/api/courses`, {
      headers: { 'Accept': 'application/json' },
    });
    if (res.ok) {
      return await res.json();
    }
    return [];
  } catch (err) {
    return [];
  }
}

/**
 * Fetches all 19 programming languages from the Java Backend.
 */
export async function fetchJavaLanguages(): Promise<any[]> {
  if (typeof window !== 'undefined' && (window.location.protocol === 'https:' || !['localhost', '127.0.0.1'].includes(window.location.hostname))) return [];
  try {
    const res = await fetch(`${JAVA_BACKEND_URL}/api/languages`);
    if (res.ok) return await res.json();
    return [];
  } catch {
    return [];
  }
}

/**
 * Fetches all student enrollments from the Java Backend.
 */
export async function fetchJavaEnrollments(): Promise<JavaEnrollment[]> {
  if (typeof window !== 'undefined' && (window.location.protocol === 'https:' || !['localhost', '127.0.0.1'].includes(window.location.hostname))) return [];
  try {
    const res = await fetch(`${JAVA_BACKEND_URL}/api/enrollments`);
    if (res.ok) return await res.json();
    return [];
  } catch {
    return [];
  }
}

/**
 * Fetches real-time event logs from the Java Backend.
 */
export async function fetchJavaEvents(): Promise<JavaSyncEvent[]> {
  if (typeof window !== 'undefined' && (window.location.protocol === 'https:' || !['localhost', '127.0.0.1'].includes(window.location.hostname))) return [];
  try {
    const res = await fetch(`${JAVA_BACKEND_URL}/api/events`);
    if (res.ok) return await res.json();
    return [];
  } catch {
    return [];
  }
}

/**
 * Triggers bidirectional synchronization between React Frontend and Java Backend.
 */
export async function triggerTwoWaySync(source = 'React Frontend (Port 5173)'): Promise<boolean> {
  if (typeof window !== 'undefined' && (window.location.protocol === 'https:' || !['localhost', '127.0.0.1'].includes(window.location.hostname))) return false;
  try {
    const res = await fetch(`${JAVA_BACKEND_URL}/api/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source, timestamp: Date.now() }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
