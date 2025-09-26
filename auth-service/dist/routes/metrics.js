"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const metrics_1 = require("../monitoring/metrics");
const UserServiceSQLite_1 = require("../services/UserServiceSQLite");
const router = (0, express_1.Router)();
const userService = new UserServiceSQLite_1.UserServiceSQLite();
const basicAuth = (_req, res, next) => {
    const auth = _req.headers.authorization;
    if (!auth || !auth.startsWith('Basic ')) {
        res.setHeader('WWW-Authenticate', 'Basic realm="Metrics"');
        return res.status(401).json({ error: 'Authentication required' });
    }
    const credentials = Buffer.from(auth.slice(6), 'base64').toString();
    const [username, password] = credentials.split(':');
    if (username === 'metrics' && password === (process.env['METRICS_PASSWORD'] || 'metrics123')) {
        return next();
    }
    else {
        res.setHeader('WWW-Authenticate', 'Basic realm="Metrics"');
        return res.status(401).json({ error: 'Invalid credentials' });
    }
};
router.get('/', basicAuth, async (_req, res) => {
    try {
        const metrics = metrics_1.metricsCollector.getMetrics();
        const totalUsers = await userService.count();
        const activeUsers = await userService.countActive();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const registeredToday = await userService.countRegisteredAfter(today);
        metrics_1.metricsCollector.updateUserMetrics(totalUsers, activeUsers, registeredToday);
        const prometheusMetrics = `
# HELP auth_requests_total Total number of requests
# TYPE auth_requests_total counter
auth_requests_total{status="success"} ${metrics.requests.successful}
auth_requests_total{status="error"} ${metrics.requests.failed}

# HELP auth_request_duration_seconds Request duration in seconds
# TYPE auth_request_duration_seconds histogram
auth_request_duration_seconds{quantile="0.5"} ${(metrics.requests.averageResponseTime / 1000).toFixed(6)}
auth_request_duration_seconds{quantile="0.9"} ${(metrics.requests.averageResponseTime / 1000).toFixed(6)}
auth_request_duration_seconds{quantile="0.99"} ${(metrics.requests.averageResponseTime / 1000).toFixed(6)}

# HELP auth_users_total Total number of users
# TYPE auth_users_total gauge
auth_users_total ${totalUsers}

# HELP auth_users_active Active users
# TYPE auth_users_active gauge
auth_users_active ${activeUsers}

# HELP auth_users_registered_today Users registered today
# TYPE auth_users_registered_today counter
auth_users_registered_today ${registeredToday}

# HELP auth_database_queries_total Total database queries
# TYPE auth_database_queries_total counter
auth_database_queries_total ${metrics.database.queries}

# HELP auth_database_query_duration_seconds Database query duration
# TYPE auth_database_query_duration_seconds histogram
auth_database_query_duration_seconds{quantile="0.5"} ${(metrics.database.averageQueryTime / 1000).toFixed(6)}
auth_database_query_duration_seconds{quantile="0.9"} ${(metrics.database.averageQueryTime / 1000).toFixed(6)}
auth_database_query_duration_seconds{quantile="0.99"} ${(metrics.database.averageQueryTime / 1000).toFixed(6)}

# HELP auth_errors_total Total errors
# TYPE auth_errors_total counter
auth_errors_total ${metrics.errors.total}

# HELP auth_system_memory_usage_bytes Memory usage in bytes
# TYPE auth_system_memory_usage_bytes gauge
auth_system_memory_usage_bytes{type="heap_used"} ${metrics.system.memoryUsage.heapUsed}
auth_system_memory_usage_bytes{type="heap_total"} ${metrics.system.memoryUsage.heapTotal}
auth_system_memory_usage_bytes{type="external"} ${metrics.system.memoryUsage.external}

# HELP auth_system_uptime_seconds System uptime in seconds
# TYPE auth_system_uptime_seconds gauge
auth_system_uptime_seconds ${Math.floor(metrics.system.uptime / 1000)}
`;
        res.set('Content-Type', 'text/plain');
        res.send(prometheusMetrics);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get metrics' });
    }
});
router.get('/summary', basicAuth, async (_req, res) => {
    try {
        const summary = metrics_1.metricsCollector.getSummary();
        res.json(summary);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get metrics summary' });
    }
});
router.get('/health', async (_req, res) => {
    try {
        const metrics = metrics_1.metricsCollector.getMetrics();
        const summary = metrics_1.metricsCollector.getSummary();
        let status = 'healthy';
        const issues = [];
        if (metrics.requests.total > 0) {
            const errorRate = metrics.requests.failed / metrics.requests.total;
            if (errorRate > 0.1) {
                status = 'unhealthy';
                issues.push(`High error rate: ${(errorRate * 100).toFixed(2)}%`);
            }
        }
        if (metrics.requests.averageResponseTime > 5000) {
            status = 'degraded';
            issues.push(`High response time: ${Math.round(metrics.requests.averageResponseTime)}ms`);
        }
        const memoryUsageMB = metrics.system.memoryUsage.heapUsed / 1024 / 1024;
        if (memoryUsageMB > 500) {
            status = 'degraded';
            issues.push(`High memory usage: ${Math.round(memoryUsageMB)}MB`);
        }
        res.json({
            status,
            timestamp: metrics.timestamp,
            uptime: Math.floor(metrics.system.uptime / 1000),
            issues,
            metrics: summary
        });
    }
    catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: 'Failed to check health',
            timestamp: Date.now()
        });
    }
});
router.post('/reset', basicAuth, (_req, res) => {
    try {
        metrics_1.metricsCollector.reset();
        res.json({ message: 'Metrics reset successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to reset metrics' });
    }
});
exports.default = router;
//# sourceMappingURL=metrics.js.map