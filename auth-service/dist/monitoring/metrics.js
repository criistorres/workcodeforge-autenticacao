"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metricsCollector = void 0;
exports.metricsMiddleware = metricsMiddleware;
exports.trackError = trackError;
exports.trackQuery = trackQuery;
const perf_hooks_1 = require("perf_hooks");
class MetricsCollector {
    constructor() {
        this.requestTimes = [];
        this.queryTimes = [];
        this.errorCounts = {};
        this.startTime = Date.now();
        this.metrics = this.initializeMetrics();
    }
    initializeMetrics() {
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
    recordRequest(responseTime, success) {
        this.metrics.requests.total++;
        this.requestTimes.push(responseTime);
        if (success) {
            this.metrics.requests.successful++;
        }
        else {
            this.metrics.requests.failed++;
        }
        if (this.requestTimes.length > 1000) {
            this.requestTimes = this.requestTimes.slice(-1000);
        }
        this.metrics.requests.averageResponseTime =
            this.requestTimes.reduce((a, b) => a + b, 0) / this.requestTimes.length;
    }
    updateUserMetrics(total, active, registeredToday) {
        this.metrics.users.total = total;
        this.metrics.users.active = active;
        this.metrics.users.registeredToday = registeredToday;
    }
    recordQuery(queryTime) {
        this.metrics.database.queries++;
        this.queryTimes.push(queryTime);
        if (this.queryTimes.length > 1000) {
            this.queryTimes = this.queryTimes.slice(-1000);
        }
        this.metrics.database.averageQueryTime =
            this.queryTimes.reduce((a, b) => a + b, 0) / this.queryTimes.length;
    }
    updateDatabaseConnections(connections) {
        this.metrics.database.connections = connections;
    }
    recordError(errorType) {
        this.metrics.errors.total++;
        this.errorCounts[errorType] = (this.errorCounts[errorType] || 0) + 1;
        this.metrics.errors.byType = { ...this.errorCounts };
    }
    updateSystemMetrics() {
        this.metrics.timestamp = Date.now();
        this.metrics.system.memoryUsage = process.memoryUsage();
        this.metrics.system.uptime = Date.now() - this.startTime;
        const cpuUsage = process.cpuUsage();
        this.metrics.system.cpuUsage = (cpuUsage.user + cpuUsage.system) / 1000000;
    }
    getMetrics() {
        this.updateSystemMetrics();
        return { ...this.metrics };
    }
    getSummary() {
        const metrics = this.getMetrics();
        return {
            status: 'healthy',
            timestamp: metrics.timestamp,
            uptime: Math.floor(metrics.system.uptime / 1000),
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
    reset() {
        this.metrics = this.initializeMetrics();
        this.requestTimes = [];
        this.queryTimes = [];
        this.errorCounts = {};
        this.startTime = Date.now();
    }
}
exports.metricsCollector = new MetricsCollector();
function metricsMiddleware(_req, res, next) {
    const startTime = perf_hooks_1.performance.now();
    res.on('finish', () => {
        const endTime = perf_hooks_1.performance.now();
        const responseTime = endTime - startTime;
        const success = res.statusCode >= 200 && res.statusCode < 400;
        exports.metricsCollector.recordRequest(responseTime, success);
    });
    next();
}
function trackError(error, context) {
    const errorType = error.constructor.name;
    const errorKey = context ? `${errorType}:${context}` : errorType;
    exports.metricsCollector.recordError(errorKey);
}
function trackQuery(queryFn) {
    const startTime = perf_hooks_1.performance.now();
    return queryFn().finally(() => {
        const endTime = perf_hooks_1.performance.now();
        const queryTime = endTime - startTime;
        exports.metricsCollector.recordQuery(queryTime);
    });
}
exports.default = exports.metricsCollector;
//# sourceMappingURL=metrics.js.map