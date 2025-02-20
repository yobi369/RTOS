const Task = require('./task');
const { DeadlineError, AperiodicTaskError } = require('./error');

class EDFTask extends Task {
    constructor(id, period, executionTime, deadline, isAperiodic = false) {
        super(id, period, executionTime);
        
        if (!isAperiodic && !deadline) {
            throw new DeadlineError('Periodic tasks must have a deadline');
        }
        
        this.deadline = deadline;
        this.isAperiodic = isAperiodic;
        this.absoluteDeadline = this.calculateAbsoluteDeadline();
    }

    calculateAbsoluteDeadline() {
        if (this.isAperiodic) {
            return Infinity; // Aperiodic tasks have no fixed deadline
        }
        return this.deadline;
    }

    updateDeadline(currentTime) {
        if (!this.isAperiodic) {
            this.absoluteDeadline = currentTime + this.deadline;
        }
    }

    getAbsoluteDeadline() {
        return this.absoluteDeadline;
    }

    reset() {
        super.reset();
        if (!this.isAperiodic) {
            this.absoluteDeadline = this.calculateAbsoluteDeadline();
        }
    }
}

module.exports = EDFTask;
