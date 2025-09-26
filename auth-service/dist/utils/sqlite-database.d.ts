import Database from 'better-sqlite3';
declare class SQLiteDatabase {
    private db;
    private static instance;
    private constructor();
    static getInstance(): SQLiteDatabase;
    initialize(): Promise<void>;
    getDatabase(): Database.Database;
    query(sql: string, params?: any[]): Promise<any>;
    transaction<T>(callback: () => T): Promise<T>;
    testConnection(): Promise<boolean>;
    close(): Promise<void>;
    runMigration(sql: string): Promise<void>;
    tableExists(tableName: string): Promise<boolean>;
    getTableInfo(tableName: string): Promise<any[]>;
}
export declare const sqliteDb: SQLiteDatabase;
export default sqliteDb;
//# sourceMappingURL=sqlite-database.d.ts.map