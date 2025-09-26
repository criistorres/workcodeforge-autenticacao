import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { config } from 'dotenv';

const execAsync = promisify(exec);

// Load environment variables
config();

interface BackupConfig {
  databasePath: string;
  backupPath: string;
  retentionDays: number;
  compressionEnabled: boolean;
}

class DatabaseBackup {
  private config: BackupConfig;

  constructor() {
    this.config = {
      databasePath: process.env.SQLITE_DB_PATH || './data/auth.db',
      backupPath: process.env.BACKUP_PATH || './backups',
      retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10),
      compressionEnabled: process.env.BACKUP_COMPRESSION_ENABLED !== 'false',
    };
  }

  async createBackup(): Promise<string> {
    try {
      // Ensure backup directory exists
      if (!fs.existsSync(this.config.backupPath)) {
        fs.mkdirSync(this.config.backupPath, { recursive: true });
      }

      // Generate backup filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `auth-backup-${timestamp}.db`;
      const backupFilePath = path.join(this.config.backupPath, backupFileName);

      // Check if database exists
      if (!fs.existsSync(this.config.databasePath)) {
        throw new Error(`Database file not found: ${this.config.databasePath}`);
      }

      // Create backup
      console.log(`Creating backup: ${backupFileName}`);
      fs.copyFileSync(this.config.databasePath, backupFilePath);

      // Compress if enabled
      if (this.config.compressionEnabled) {
        const compressedFileName = `${backupFileName}.gz`;
        const compressedFilePath = path.join(this.config.backupPath, compressedFileName);
        
        console.log(`Compressing backup: ${compressedFileName}`);
        await execAsync(`gzip -c "${backupFilePath}" > "${compressedFilePath}"`);
        
        // Remove uncompressed file
        fs.unlinkSync(backupFilePath);
        
        console.log(`Backup created successfully: ${compressedFileName}`);
        return compressedFilePath;
      } else {
        console.log(`Backup created successfully: ${backupFileName}`);
        return backupFilePath;
      }
    } catch (error) {
      console.error('Backup failed:', error);
      throw error;
    }
  }

  async restoreBackup(backupFilePath: string): Promise<void> {
    try {
      // Check if backup file exists
      if (!fs.existsSync(backupFilePath)) {
        throw new Error(`Backup file not found: ${backupFilePath}`);
      }

      // Check if it's compressed
      const isCompressed = backupFilePath.endsWith('.gz');
      let sourceFile = backupFilePath;

      if (isCompressed) {
        // Decompress first
        const decompressedPath = backupFilePath.replace('.gz', '');
        console.log(`Decompressing backup: ${backupFilePath}`);
        await execAsync(`gunzip -c "${backupFilePath}" > "${decompressedPath}"`);
        sourceFile = decompressedPath;
      }

      // Create backup of current database
      const currentBackupPath = `${this.config.databasePath}.backup.${Date.now()}`;
      if (fs.existsSync(this.config.databasePath)) {
        console.log(`Creating backup of current database: ${currentBackupPath}`);
        fs.copyFileSync(this.config.databasePath, currentBackupPath);
      }

      // Restore from backup
      console.log(`Restoring from backup: ${sourceFile}`);
      fs.copyFileSync(sourceFile, this.config.databasePath);

      // Clean up decompressed file if it was compressed
      if (isCompressed && sourceFile !== backupFilePath) {
        fs.unlinkSync(sourceFile);
      }

      console.log('Database restored successfully');
    } catch (error) {
      console.error('Restore failed:', error);
      throw error;
    }
  }

  async cleanupOldBackups(): Promise<void> {
    try {
      const files = fs.readdirSync(this.config.backupPath);
      const now = Date.now();
      const retentionMs = this.config.retentionDays * 24 * 60 * 60 * 1000;

      let deletedCount = 0;
      for (const file of files) {
        if (file.startsWith('auth-backup-')) {
          const filePath = path.join(this.config.backupPath, file);
          const stats = fs.statSync(filePath);
          const fileAge = now - stats.mtime.getTime();

          if (fileAge > retentionMs) {
            console.log(`Deleting old backup: ${file}`);
            fs.unlinkSync(filePath);
            deletedCount++;
          }
        }
      }

      console.log(`Cleaned up ${deletedCount} old backup(s)`);
    } catch (error) {
      console.error('Cleanup failed:', error);
      throw error;
    }
  }

  async listBackups(): Promise<string[]> {
    try {
      const files = fs.readdirSync(this.config.backupPath);
      return files
        .filter(file => file.startsWith('auth-backup-'))
        .map(file => {
          const filePath = path.join(this.config.backupPath, file);
          const stats = fs.statSync(filePath);
          return {
            name: file,
            size: stats.size,
            created: stats.mtime,
            path: filePath
          };
        })
        .sort((a, b) => b.created.getTime() - a.created.getTime());
    } catch (error) {
      console.error('Failed to list backups:', error);
      return [];
    }
  }

  async scheduleBackup(): Promise<void> {
    try {
      console.log('Starting scheduled backup...');
      await this.createBackup();
      await this.cleanupOldBackups();
      console.log('Scheduled backup completed');
    } catch (error) {
      console.error('Scheduled backup failed:', error);
      throw error;
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const backup = new DatabaseBackup();

  try {
    switch (command) {
      case 'create':
        await backup.createBackup();
        break;
      
      case 'restore':
        const backupFile = args[1];
        if (!backupFile) {
          console.error('Usage: npm run backup:restore <backup-file>');
          process.exit(1);
        }
        await backup.restoreBackup(backupFile);
        break;
      
      case 'list':
        const backups = await backup.listBackups();
        console.log('Available backups:');
        backups.forEach(backup => {
          console.log(`  ${backup.name} (${Math.round(backup.size / 1024)}KB) - ${backup.created.toISOString()}`);
        });
        break;
      
      case 'cleanup':
        await backup.cleanupOldBackups();
        break;
      
      case 'schedule':
        await backup.scheduleBackup();
        break;
      
      default:
        console.log('Usage: npm run backup <command>');
        console.log('Commands:');
        console.log('  create    - Create a new backup');
        console.log('  restore   - Restore from backup');
        console.log('  list      - List available backups');
        console.log('  cleanup   - Clean up old backups');
        console.log('  schedule  - Run scheduled backup (create + cleanup)');
        process.exit(1);
    }
  } catch (error) {
    console.error('Backup operation failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export default DatabaseBackup;
