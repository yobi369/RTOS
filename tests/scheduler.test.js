const RateMonotonicScheduler = require('../scheduler');
const Task = require('../task');
const { 
    SchedulingError,
    ResourceConflictError,
    ValidationError
} = require('../error');

const EDFTask = require('../edfTask');
const { 
    InvalidTaskError, 
    ValidationError, 
    SchedulingError, 
    ResourceConflictError 
} = require('../error');

describe('RateMonotonicScheduler', () => {
    let scheduler;

    beforeEach(() => {
        scheduler = new RateMonotonicScheduler();
    });

    describe('Validation', () => {
        it('should throw error when adding invalid task', () => {
            expect(() => scheduler.addTask(null)).toThrow(ValidationError);
            expect(() => scheduler.addTask({})).toThrow(ValidationError);
        });

        it('should throw error when adding duplicate task', () => {
            const task = new Task('T1', 10, 2);
            scheduler.addTask(task);
            expect(() => scheduler.addTask(task)).toThrow(SchedulingError);
        });

        it('should throw error when running with invalid time', () => {
            expect(() => scheduler.run(0)).toThrow(ValidationError);
            expect(() => scheduler.run(-1)).toThrow(ValidationError);
            expect(() => scheduler.run('invalid')).toThrow(ValidationError);
        });

        it('should throw error when running with no tasks', () => {
            expect(() => scheduler.run(10)).toThrow(SchedulingError);
        });
    });

    describe('Task Scheduling', () => {
        it('should handle empty task list', () => {
            expect(scheduler.schedule(0)).toBeNull();
        });

        it('should schedule tasks in rate monotonic order', () => {
            const task1 = new Task('T1', 10, 2);
            const task2 = new Task('T2', 5, 1);
            const task3 = new Task('T3', 20, 3);

            scheduler.addTask(task1);
            scheduler.addTask(task2);
            scheduler.addTask(task3);

            expect(scheduler.tasks).toEqual([task2, task1, task3]);
        });

        it('should handle resource conflicts gracefully', () => {
            const task1 = new Task('T1', 10, 2);
            const task2 = new Task('T2', 5, 1);
            
            scheduler.addTask(task1);
            scheduler.addTask(task2);
            
            // Simulate resource conflict
            task1.block('R1');
            
            expect(() => scheduler.run(10)).not.toThrow();
            expect(scheduler.getStatistics().totalExecutionTime).toBeGreaterThan(0);
        });

        it('should track missed deadlines', () => {
            const task = new Task('T1', 5, 3, 4); // Deadline before period
            scheduler.addTask(task);
            scheduler.run(10);
            
            const stats = scheduler.getStatistics();
            expect(stats.totalMissedDeadlines).toBeGreaterThan(0);
            expect(stats.tasks[0].missedDeadlines).toBeGreaterThan(0);
        });
    });
});

describe('EDF Scheduler Tests', () => {
    let edfScheduler;

    beforeEach(() => {
        edfScheduler = new EDFScheduler();
    });

    test('should require deadlines for tasks', () => {
        expect(() => {
            new EDFTask('T1', 6, 2);
        }).toThrow('EDF scheduling requires tasks to have deadlines');
    });

    test('should sort tasks by deadline', () => {
        const task1 = new EDFTask('T1', 6, 2, 6);
        const task2 = new EDFTask('T2', 4, 1, 4);
        edfScheduler.addTask(task1);
        edfScheduler.addTask(task2);
        expect(edfScheduler.tasks[0].id).toBe('T2');
        expect(edfScheduler.tasks[1].id).toBe('T1');
    });

    test('should execute tasks based on deadlines', () => {
        const task1 = new EDFTask('T1', 6, 2, 6);
        const task2 = new EDFTask('T2', 6, 2, 3);
        edfScheduler.addTask(task1);
        edfScheduler.addTask(task2);
        edfScheduler.run(6);
        expect(task2.executionCount).toBe(1);
        expect(task1.executionCount).toBe(1);
    });

    test('should handle aperiodic tasks', () => {
        const periodicTask = new EDFTask('T1', 6, 2, 6);
        const aperiodicTask = new EDFTask('T2', 0, 1, null, true);
        edfScheduler.addTask(periodicTask);
        edfScheduler.addTask(aperiodicTask);
        edfScheduler.run(6);
        expect(aperiodicTask.executionCount).toBe(1);
        expect(periodicTask.executionCount).toBe(1);
    });

    test('should throw error for missing deadline on periodic task', () => {
        expect(() => {
            new EDFTask('T1', 6, 2);
        }).toThrow(DeadlineError);
    });

    test('should prioritize aperiodic tasks over periodic tasks', () => {
        const periodicTask = new EDFTask('T1', 6, 2, 6);
        const aperiodicTask = new EDFTask('T2', 0, 1, null, true);
        edfScheduler.addTask(periodicTask);
        edfScheduler.addTask(aperiodicTask);
        edfScheduler.run(3);
        expect(aperiodicTask.executionCount).toBe(1);
        expect(periodicTask.executionCount).toBe(0);
    });

    test('should clean up completed aperiodic tasks', () => {
        const aperiodicTask = new EDFTask('T1', 0, 1, null, true);
        edfScheduler.addTask(aperiodicTask);
        edfScheduler.run(3);
        expect(aperiodicTask.executionCount).toBe(1);
        expect(edfScheduler.aperiodicTasks.length).toBe(0);
    });
});
