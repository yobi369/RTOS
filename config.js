const fs = require('fs');
const yaml = require('js-yaml');
const { ValidationError } = require('./error');
const EventEmitter = require('events');

class ConfigManager extends EventEmitter {
    constructor() {
        super();
        this.config = {};
        this.configPath = '';
        this.watcher = null;
        this.environment = process.env.NODE_ENV || 'development';
    }

    loadConfig(filePath) {
        this.configPath = filePath;
        const ext = filePath.split('.').pop().toLowerCase();
        try {
            const fileContent = fs.readFileSync(filePath, 'utf8');
            let baseConfig = {};
            
            if (ext === 'json') {
                baseConfig = JSON.parse(fileContent);
            } else if (ext === 'yaml' || ext === 'yml') {
                baseConfig = yaml.load(fileContent);
            } else {
                throw new ValidationError('Unsupported file format. Use JSON or YAML');
            }
            
            // Merge environment-specific configuration
            this.config = this.mergeEnvironmentConfig(baseConfig);
            this.validate();
            console.log(`Configuration loaded successfully from ${filePath} (${this.environment} environment)`);
            
            // Set up file watcher for runtime reloading
            this.setupWatcher();
        } catch (error) {
            console.error(`Error loading configuration: ${error.message}`);
            process.exit(1);
        }
    }

    mergeEnvironmentConfig(baseConfig) {
        const envConfig = baseConfig[this.environment] || {};
        const mergedConfig = { ...baseConfig, ...envConfig };
        
        // Remove environment-specific keys
        delete mergedConfig.development;
        delete mergedConfig.production;
        delete mergedConfig.test;
        
        return mergedConfig;
    }

    setupWatcher() {
        if (this.watcher) {
            this.watcher.close();
        }
        
        this.watcher = fs.watch(this.configPath, (eventType) => {
            if (eventType === 'change') {
                console.log('\nConfiguration file changed. Reloading...');
                this.reloadConfig();
            }
        });
    }

    reloadConfig() {
        if (this.configPath) {
            try {
                const oldConfig = this.config;
                this.loadConfig(this.configPath);
                console.log('Configuration reloaded successfully');
                
                // Emit event or trigger callback for configuration changes
                this.handleConfigChange(oldConfig, this.config);
            } catch (error) {
                console.error(`Error reloading configuration: ${error.message}`);
                // Continue with previous configuration
            }
        }
    }

    handleConfigChange(oldConfig, newConfig) {
        // Compare configurations and handle changes
        console.log('Configuration changes detected. Components may need to be updated.');
        // Emit configChanged event
        this.emit('configChanged');
    }

    get(key, defaultValue = null) {
        const keys = key.split('.');
        let value = this.config;
        
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return defaultValue;
            }
        }
        return value;
    }

    validate() {
        const requiredFields = ['tasks', 'resources'];
        const errors = [];
        
        // Check required fields
        for (const field of requiredFields) {
            if (!this.config[field]) {
                errors.push(`Missing required field: ${field}`);
            }
        }
        
        // Validate tasks
        if (this.config.tasks) {
            if (!Array.isArray(this.config.tasks)) {
                errors.push('Tasks must be an array');
            } else {
                this.config.tasks.forEach((task, index) => {
                    if (!task.id || typeof task.id !== 'string') {
                        errors.push(`Task ${index}: id must be a non-empty string`);
                    }
                    if (!task.period || typeof task.period !== 'number' || task.period <= 0) {
                        errors.push(`Task ${index}: period must be a positive number`);
                    }
                    if (!task.executionTime || typeof task.executionTime !== 'number' || task.executionTime <= 0) {
                        errors.push(`Task ${index}: executionTime must be a positive number`);
                    }
                });
            }
        }
        
        // Validate resources
        if (this.config.resources) {
            if (!Array.isArray(this.config.resources)) {
                errors.push('Resources must be an array');
            } else {
                this.config.resources.forEach((resource, index) => {
                    if (!resource.id || typeof resource.id !== 'string') {
                        errors.push(`Resource ${index}: id must be a non-empty string`);
                    }
                });
            }
        }
        
        if (errors.length > 0) {
            throw new ValidationError(`Configuration validation failed:\n${errors.join('\n')}`);
        }
    }
}

module.exports = new ConfigManager();
