import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';

const execAsync = promisify(exec);

// Load environment variables
config();

interface DeployConfig {
  environment: string;
  dockerComposeFile: string;
  backupBeforeDeploy: boolean;
  runTests: boolean;
  restartServices: boolean;
}

class DeployManager {
  private config: DeployConfig;

  constructor() {
    this.config = {
      environment: process.env.NODE_ENV || 'production',
      dockerComposeFile: process.env.DOCKER_COMPOSE_FILE || 'docker-compose.auth.yaml',
      backupBeforeDeploy: process.env.BACKUP_BEFORE_DEPLOY !== 'false',
      runTests: process.env.RUN_TESTS_ON_DEPLOY !== 'false',
      restartServices: process.env.RESTART_SERVICES !== 'false',
    };
  }

  async deploy(): Promise<void> {
    try {
      console.log('🚀 Starting deployment...');
      console.log(`Environment: ${this.config.environment}`);
      console.log(`Docker Compose: ${this.config.dockerComposeFile}`);

      // Step 1: Run tests
      if (this.config.runTests) {
        await this.runTests();
      }

      // Step 2: Build application
      await this.buildApplication();

      // Step 3: Backup database
      if (this.config.backupBeforeDeploy) {
        await this.backupDatabase();
      }

      // Step 4: Deploy with Docker
      await this.deployWithDocker();

      // Step 5: Health check
      await this.healthCheck();

      console.log('✅ Deployment completed successfully!');
    } catch (error) {
      console.error('❌ Deployment failed:', error);
      throw error;
    }
  }

  private async runTests(): Promise<void> {
    console.log('🧪 Running tests...');
    
    try {
      // Run unit and integration tests
      await execAsync('npm run test:ci');
      console.log('✅ Tests passed');
    } catch (error) {
      console.error('❌ Tests failed');
      throw new Error('Tests failed, deployment aborted');
    }
  }

  private async buildApplication(): Promise<void> {
    console.log('🔨 Building application...');
    
    try {
      // Install dependencies
      await execAsync('npm ci --only=production');
      
      // Build TypeScript
      await execAsync('npm run build');
      
      console.log('✅ Application built successfully');
    } catch (error) {
      console.error('❌ Build failed');
      throw error;
    }
  }

  private async backupDatabase(): Promise<void> {
    console.log('💾 Creating database backup...');
    
    try {
      await execAsync('npm run backup:create');
      console.log('✅ Database backup created');
    } catch (error) {
      console.error('⚠️  Database backup failed, continuing with deployment');
    }
  }

  private async deployWithDocker(): Promise<void> {
    console.log('🐳 Deploying with Docker...');
    
    try {
      // Stop existing services
      console.log('Stopping existing services...');
      await execAsync(`docker-compose -f ${this.config.dockerComposeFile} down`);
      
      // Build and start services
      console.log('Building and starting services...');
      await execAsync(`docker-compose -f ${this.config.dockerComposeFile} up -d --build`);
      
      console.log('✅ Docker deployment completed');
    } catch (error) {
      console.error('❌ Docker deployment failed');
      throw error;
    }
  }

  private async healthCheck(): Promise<void> {
    console.log('🏥 Performing health check...');
    
    const maxRetries = 30;
    const retryDelay = 2000; // 2 seconds
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        const { stdout } = await execAsync('curl -f http://localhost:3001/health');
        const health = JSON.parse(stdout);
        
        if (health.status === 'ok') {
          console.log('✅ Health check passed');
          return;
        }
      } catch (error) {
        // Health check failed, retry
      }
      
      if (i < maxRetries - 1) {
        console.log(`Health check attempt ${i + 1}/${maxRetries} failed, retrying in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
    
    throw new Error('Health check failed after maximum retries');
  }

  async rollback(): Promise<void> {
    try {
      console.log('🔄 Rolling back deployment...');
      
      // Stop current services
      await execAsync(`docker-compose -f ${this.config.dockerComposeFile} down`);
      
      // Restore from backup
      const backups = await this.listBackups();
      if (backups.length > 0) {
        const latestBackup = backups[0];
        console.log(`Restoring from backup: ${latestBackup.name}`);
        await execAsync(`npm run backup:restore "${latestBackup.path}"`);
      }
      
      // Start services
      await execAsync(`docker-compose -f ${this.config.dockerComposeFile} up -d`);
      
      console.log('✅ Rollback completed');
    } catch (error) {
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }

  private async listBackups(): Promise<any[]> {
    try {
      const { stdout } = await execAsync('npm run backup:list');
      // Parse backup list (this would need to be implemented in backup script)
      return [];
    } catch (error) {
      return [];
    }
  }

  async status(): Promise<void> {
    try {
      console.log('📊 Checking deployment status...');
      
      // Check Docker services
      const { stdout: dockerStatus } = await execAsync(`docker-compose -f ${this.config.dockerComposeFile} ps`);
      console.log('Docker Services:');
      console.log(dockerStatus);
      
      // Check health
      try {
        const { stdout: healthStatus } = await execAsync('curl -s http://localhost:3001/health');
        const health = JSON.parse(healthStatus);
        console.log('Health Status:', health);
      } catch (error) {
        console.log('Health check failed:', error.message);
      }
      
      // Check metrics
      try {
        const { stdout: metricsStatus } = await execAsync('curl -s http://localhost:3001/metrics/summary');
        const metrics = JSON.parse(metricsStatus);
        console.log('Metrics Summary:', metrics);
      } catch (error) {
        console.log('Metrics check failed:', error.message);
      }
    } catch (error) {
      console.error('❌ Status check failed:', error);
    }
  }

  async logs(): Promise<void> {
    try {
      console.log('📋 Fetching logs...');
      
      const { stdout } = await execAsync(`docker-compose -f ${this.config.dockerComposeFile} logs --tail=100`);
      console.log(stdout);
    } catch (error) {
      console.error('❌ Failed to fetch logs:', error);
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const deploy = new DeployManager();

  try {
    switch (command) {
      case 'deploy':
        await deploy.deploy();
        break;
      
      case 'rollback':
        await deploy.rollback();
        break;
      
      case 'status':
        await deploy.status();
        break;
      
      case 'logs':
        await deploy.logs();
        break;
      
      default:
        console.log('Usage: npm run deploy <command>');
        console.log('Commands:');
        console.log('  deploy   - Deploy the application');
        console.log('  rollback - Rollback to previous version');
        console.log('  status   - Check deployment status');
        console.log('  logs     - View application logs');
        process.exit(1);
    }
  } catch (error) {
    console.error('Deployment operation failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export default DeployManager;
