const { RTOSError } = require('./error');
const configManager = require('./config');
const dashboard = require('./dashboard');
const RateMonotonicScheduler = require('./scheduler');
const EDFScheduler = require('./edfScheduler');
const Task = require('./task');
const EDFTask = require('./edfTask');

// Load configuration
configManager.loadConfig('/home/bml/Desktop/RTOS/config.yaml');

// Create scheduler instance based on configuration
const schedulerType = configManager.get('scheduler.type', 'rate-monotonic');
let scheduler = schedulerType === 'edf' ? new EDFScheduler() : new RateMonotonicScheduler();

// Handle configuration changes
configManager.on('configChanged', () => {
    console.log('\nConfiguration changed detected. Restarting scheduler...');
    initializeScheduler();
});

// Initialize scheduler with current configuration
function initializeScheduler() {
    try {
        // Clear existing scheduler state
        scheduler.tasks = [];
        scheduler.resources = [];
        scheduler.statistics = {
            totalExecutionTime: 0,
            totalIdleTime: 0,
            totalMissedDeadlines: 0
        };

        // Add shared resources
        const resources = configManager.get('resources');
        resources.forEach(resource => {
            scheduler.addResource(resource.id);
        });

        // Create tasks from configuration and store them
        const createdTasks = [];
        const tasks = configManager.get('tasks');
        tasks.forEach(taskConfig => {
            const task = schedulerType === 'edf' ?
                new EDFTask(
                    taskConfig.id,
                    taskConfig.period,
                    taskConfig.executionTime,
                    taskConfig.deadline || taskConfig.period
                ) :
                new Task(
                    taskConfig.id,
                    taskConfig.period,
                    taskConfig.executionTime
                );
            scheduler.addTask(task);
            createdTasks.push(task);
        });

        return createdTasks;
    } catch (error) {
        handleError(error);
    }
}

// Helper function to handle errors
function handleError(error) {
    if (error instanceof RTOSError) {
        console.error(`RTOS Error: ${error.message}`);
    } else {
        console.error(`Unexpected Error: ${error.message}`);
    }
    process.exit(1);
}

try {
    // Start the monitoring dashboard
    dashboard.start();
    
    // Initialize scheduler with current configuration
    const createdTasks = initializeScheduler();

    // Simulate resource contention using the created tasks
    createdTasks[1].block('RESOURCE_A');
    createdTasks[2].block('RESOURCE_A');

    // Run the scheduler for 48ms to demonstrate more scheduling cycles
    console.log(`Starting RTOS with ${schedulerType === 'edf' ? 'EDF' : 'Rate Monotonic'} Scheduling...`);
    console.log("Task 2 is blocked on RESOURCE_A");
    console.log("Task 3 is blocked on RESOURCE_A");
    scheduler.run(48);
    console.log("Scheduler completed.");

    // Demonstrate task unblocking
    console.log("\nReleasing RESOURCE_A and running again...");
    createdTasks[1].unblock();
    createdTasks[2].unblock();
    scheduler.run(24);
} catch (error) {
    handleError(error);
}

module.exports = {
    scheduler
};
