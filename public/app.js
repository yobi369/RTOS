// Initialize Chart.js
const ctx = document.getElementById('statsChart').getContext('2d');
const statsChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Execution Time',
            data: [],
            borderColor: 'rgba(75, 192, 192, 1)',
            fill: false
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true
            }
        }
    }
});

// Initialize WebSocket connection
const ws = new WebSocket('ws://localhost:8080');

ws.onmessage = function(event) {
    const message = JSON.parse(event.data);
    
    switch(message.type) {
        case 'init':
            updateDashboard(message.data);
            break;
        case 'update':
            updateDashboard(message.data);
            break;
    }
};

function updateDashboard(data) {
    // Update task list
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = data.tasks.map(task => `
        <div class="task-item">
            <span class="task-id">${task.id}</span>
            <span class="task-status">${task.status}</span>
            <span class="task-executions">Executions: ${task.executions}</span>
            ${task.missedDeadlines > 0 ? `<span class="task-missed">Missed: ${task.missedDeadlines}</span>` : ''}
        </div>
    `).join('');

    // Update statistics chart
    statsChart.data.labels.push(new Date().toLocaleTimeString());
    statsChart.data.datasets[0].data.push(data.statistics.totalExecutionTime);
    
    if (statsChart.data.labels.length > 10) {
        statsChart.data.labels.shift();
        statsChart.data.datasets[0].data.shift();
    }
    
    statsChart.update();

    // Update resource status
    const resourceList = document.getElementById('resourceList');
    resourceList.innerHTML = data.resources.map(resource => `
        <div class="resource-item">
            <span class="resource-id">${resource.id}</span>
            <span class="resource-status">${resource.status}</span>
            ${resource.blockedTasks.length > 0 ? `
                <div class="blocked-tasks">
                    Blocked Tasks: ${resource.blockedTasks.join(', ')}
                </div>
            ` : ''}
        </div>
    `).join('');
}

// Theme toggle
const themeToggle = document.getElementById('themeToggle');
themeToggle.addEventListener('change', function() {
    document.body.classList.toggle('dark-theme', this.checked);
});
