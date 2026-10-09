package com.codeverse.service;

import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Service demonstrating Multithreading & Synchronization in Java.
 * Runs background workers for analytics aggregation, cache invalidation,
 * and real-time active user counting using thread-safe synchronization.
 */
public class BackgroundSyncService implements Runnable {

    private static BackgroundSyncService instance;
    private final ScheduledExecutorService scheduler;
    private final AtomicInteger activeConnections;
    private final AtomicLong totalProcessedEvents;
    private final Object syncLock = new Object();
    private boolean isRunning = false;

    private BackgroundSyncService() {
        this.scheduler = Executors.newScheduledThreadPool(2);
        this.activeConnections = new AtomicInteger(0);
        this.totalProcessedEvents = new AtomicLong(0);
    }

    public static synchronized BackgroundSyncService getInstance() {
        if (instance == null) {
            instance = new BackgroundSyncService();
        }
        return instance;
    }

    /**
     * Starts the periodic multithreaded worker.
     */
    public void start() {
        synchronized (syncLock) {
            if (!isRunning) {
                isRunning = true;
                scheduler.scheduleAtFixedRate(this, 10, 30, TimeUnit.SECONDS);
                System.out.println("[BackgroundSyncService] Multithreaded background worker started.");
            }
        }
    }

    /**
     * Runnable execution task running on background worker thread.
     */
    @Override
    public void run() {
        try {
            // Synchronized block demonstrating thread synchronization
            synchronized (syncLock) {
                totalProcessedEvents.incrementAndGet();
                // Periodic system health logging
                System.out.println(String.format(
                    "[BackgroundWorker Thread: %s] Sync Tick #%d | Active Users: %d",
                    Thread.currentThread().getName(),
                    totalProcessedEvents.get(),
                    activeConnections.get()
                ));
            }
        } catch (Exception e) {
            System.err.println("[BackgroundSyncService] Worker error: " + e.getMessage());
        }
    }

    public void incrementConnections() {
        activeConnections.incrementAndGet();
    }

    public void decrementConnections() {
        activeConnections.decrementAndGet();
    }

    public int getActiveConnections() {
        return activeConnections.get();
    }

    public long getTotalProcessedEvents() {
        return totalProcessedEvents.get();
    }

    public void shutdown() {
        synchronized (syncLock) {
            isRunning = false;
            scheduler.shutdown();
        }
    }
}
