/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

const ONE_HOUR_MS = 60 * 60 * 1000;

/**
 * Tracks which live query actions have already had their completion event reported.
 * Uses an in-memory Map with TTL-based cleanup to prevent duplicate events
 * and unbounded memory growth.
 */
export class CompletionTracker {
  private readonly reported = new Map<string, number>();

  /**
   * Check if a completion event has already been reported for this action.
   */
  public hasReported(actionId: string): boolean {
    return this.reported.has(actionId);
  }

  /**
   * Mark an action as having its completion event reported.
   */
  public markReported(actionId: string): void {
    this.reported.set(actionId, Date.now());
  }

  /**
   * Evict entries older than 1 hour to prevent memory growth.
   */
  public cleanup(): void {
    const cutoff = Date.now() - ONE_HOUR_MS;
    for (const [actionId, timestamp] of this.reported.entries()) {
      if (timestamp < cutoff) {
        this.reported.delete(actionId);
      }
    }
  }
}
