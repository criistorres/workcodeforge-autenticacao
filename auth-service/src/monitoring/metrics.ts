import { performance } from 'perf_hooks';

export interface MetricsData {
  timestamp: number;
  requests: {
    total: number;
    successful: number;
    failed: number;
    averageResponseTime: number;
  };
  users: {
    total: number;
    active: number;
    registeredToday: number;
  };
  system: {
    memoryUsage: NodeJS.MemoryUsage;
    uptime: number;
    cpuUsage: number;
  };
  database: {
    connections: number;
    queries: number;
    averageQueryTime: number;
  };
  errors: {
    total: number;
    byType: Record<string, number>;
  };
}

class MetricsCollector {
  private metrics: MetricsData;
  private requestTimes: number[] = [];
  private queryTimes: number[] = [];
  private errorCounts: Record<string, number> = {};
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
    this.metrics = this.initializeMetrics();
  }

  private initializeMetrics(): MetricsData {
    return {
      timestamp: Date.now(),
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        averageResponseTime: 0,
      },
      users: {
        total: 0,
        active: 0,
        registeredToday: 0,
      },
      system: {
        memoryUsage: process.memoryUsage(),
        uptime: 0,
        cpuUsage: 0,
      },
      database: {
        connections: 0,
        queries: 0,
        averageQueryTime: 0,
      },
      errors: {
        total: 0,
        byType: {},
      },
    };
  }

  // Request metrics
  recordRequest(responseTime: number, success: boolean) {
    this.metrics.requests.total++;
    this.requestTimes.push(responseTime);
    
    if (success) {
      this.metrics.requests.successful++;
    } else {
      this.metrics.requests.failed++;
    }

    // Keep only last 1000 request times for average calculation
    if (this.requestTimes.length > 1000) {
      this.requestTimes = this.requestTimes.slice(-1000);
    }

    this.metrics.requests.averageResponseTime = 
      this.requestTimes.reduce((a, b) => a + b, 0) / this.requestTimes.length;
  }

  // User metrics
  updateUserMetrics(total: number, active: number, registeredToday: number) {
    this.metrics.users.total = total;
    this.metrics.users.active = active;
    this.metrics.users.registeredToday = registeredToday;
  }

  // Database metrics
  recordQuery(queryTime: number) {
    this.metrics.database.queries++;
    this.queryTimes.push(queryTime);
    
    // Keep only last 1000 query times
    if (this.queryTimes.length > 1000) {
      this.queryTimes = this.queryTimes.slice(-1000);
    }

    this.metrics.database.averageQueryTime = 
      this.queryTimes.reduce((a, b) => a + b, 0) / this.queryTimes.length;
  }

  updateDatabaseConnections(connections: number) {
    this.metrics.database.connections = connections;
  }

  // Error metrics
  recordError(errorType: string) {
    this.metrics.errors.total++;
    this.errorCounts[errorType] = (this.errorCounts[errorType] || 0) + 1;
    this.metrics.errors.byType = { ...this.errorCounts };
  }

  // System metrics
  updateSystemMetrics() {
    this.metrics.timestamp = Date.now();
    this.metrics.system.memoryUsage = process.memoryUsage();
    this.metrics.system.uptime = Date.now() - this.startTime;
    
    // CPU usage calculation (simplified)
    const cpuUsage = process.cpuUsage();
    this.metrics.system.cpuUsage = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to seconds
  }

  // Get current metrics
  getMetrics(): MetricsData {
    this.updateSystemMetrics();
    return { ...this.metrics };
  }

  // Get metrics summary
  getSummary() {
    const metrics = this.getMetrics();
    return {
      status: 'healthy',
      timestamp: metrics.timestamp,
      uptime: Math.floor(metrics.system.uptime / 1000), // seconds
      requests: {
        total: metrics.requests.total,
        successful: metrics.requests.successful,
        failed: metrics.requests.failed,
        successRate: metrics.requests.total > 0 
          ? ((metrics.requests.successful / metrics.requests.total) * 100).toFixed(2) + '%'
          : '0%',
        averageResponseTime: metrics.requests.averageResponseTime.toFixed(2) + 'ms'
      },
      users: metrics.users,
      system: {
        memoryUsage: {
          rss: Math.round(metrics.system.memoryUsage.rss / 1024 / 1024) + 'MB',
          heapUsed: Math.round(metrics.system.memoryUsage.heapUsed / 1024 / 1024) + 'MB',
          heapTotal: Math.round(metrics.system.memoryUsage.heapTotal / 1024 / 1024) + 'MB'
        },
        uptime: Math.floor(metrics.system.uptime / 1000) + 's',
        cpuUsage: metrics.system.cpuUsage.toFixed(2) + 's'
      },
      database: {
        connections: metrics.database.connections,
        queries: metrics.database.queries,
        averageQueryTime: metrics.database.averageQueryTime.toFixed(2) + 'ms'
      },
      errors: {
        total: metrics.errors.total,
        byType: metrics.errors.byType
      }
    };
  }

  // Reset metrics (useful for testing)
  reset() {
    this.metrics = this.initializeMetrics();
    this.requestTimes = [];
    this.queryTimes = [];
    this.errorCounts = {};
    this.startTime = Date.now();
  }
}

// Singleton instance
export const metricsCollector = new MetricsCollector();

// Middleware for Express
export function metricsMiddleware(_req: any, res: any, next: any) {
  const startTime = performance.now();
  
  res.on('finish', () => {
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    const success = res.statusCode >= 200 && res.statusCode < 400;
    
    metricsCollector.recordRequest(responseTime, success);
  });
  
  next();
}

// Error tracking
export function trackError(error: Error, context?: string) {
  const errorType = error.constructor.name;
  const errorKey = context ? `${errorType}:${context}` : errorType;
  metricsCollector.recordError(errorKey);
}

// Database query tracking
export function trackQuery<T>(queryFn: () => Promise<T>): Promise<T> {
  const startTime = performance.now();
  
  return queryFn().finally(() => {
    const endTime = performance.now();
    const queryTime = endTime - startTime;
    metricsCollector.recordQuery(queryTime);
  });
}

export default metricsCollector;