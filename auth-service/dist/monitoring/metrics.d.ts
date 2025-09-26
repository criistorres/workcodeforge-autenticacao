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
declare class MetricsCollector {
    private metrics;
    private requestTimes;
    private queryTimes;
    private errorCounts;
    private startTime;
    constructor();
    private initializeMetrics;
    recordRequest(responseTime: number, success: boolean): void;
    updateUserMetrics(total: number, active: number, registeredToday: number): void;
    recordQuery(queryTime: number): void;
    updateDatabaseConnections(connections: number): void;
    recordError(errorType: string): void;
    updateSystemMetrics(): void;
    getMetrics(): MetricsData;
    getSummary(): {
        status: string;
        timestamp: number;
        uptime: number;
        requests: {
            total: number;
            successful: number;
            failed: number;
            successRate: string;
            averageResponseTime: string;
        };
        users: {
            total: number;
            active: number;
            registeredToday: number;
        };
        system: {
            memoryUsage: {
                rss: string;
                heapUsed: string;
                heapTotal: string;
            };
            uptime: string;
            cpuUsage: string;
        };
        database: {
            connections: number;
            queries: number;
            averageQueryTime: string;
        };
        errors: {
            total: number;
            byType: Record<string, number>;
        };
    };
    reset(): void;
}
export declare const metricsCollector: MetricsCollector;
export declare function metricsMiddleware(_req: any, res: any, next: any): void;
export declare function trackError(error: Error, context?: string): void;
export declare function trackQuery<T>(queryFn: () => Promise<T>): Promise<T>;
export default metricsCollector;
//# sourceMappingURL=metrics.d.ts.map