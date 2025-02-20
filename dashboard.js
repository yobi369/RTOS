const express = require('express');
const path = require('path');
const { RTOSError } = require('./error');
const configManager = require('./config');
const scheduler = require('./schedulerInstance');
const WebSocket = require('ws');
const moment = require('moment');
const _ = require('lodash');

class Dashboard {
    constructor() {
        this.app = express();
        this.port = configManager.get('dashboard.port', 3000);
        this.wss = null;
        this.setupMiddleware();
        this.setupRoutes();
        this.setupWebSocket();
    }

    setupWebSocket() {
        this.wss = new WebSocket.Server({ port: 8080 });
        
        this.wss.on('connection', (ws) => {
            // Send initial data on connection
            ws.send(JSON.stringify({
                type: 'init',
                data: {
                    timestamp: moment().format(),
                    tasks: scheduler.getTaskStatus(),
                    resources: scheduler.getResourceStatus(),
                    statistics: scheduler.getStatistics(),
                    history: scheduler.getExecutionHistory(),
                    alerts: scheduler.getRecentAlerts()
                }
            }));

            // Broadcast updates to all clients
            const broadcast = (data) => {
                this.wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify(data));
                    }
                });
            };

            // Set up scheduler update listener
            scheduler.onUpdate = () => {
                broadcast({
                    type: 'update',
                    data: {
                        timestamp: moment().format(),
                        tasks: scheduler.getTaskStatus(),
                        resources: scheduler.getResourceStatus(),
                        statistics: scheduler.getStatistics(),
                        history: scheduler.getExecutionHistory(),
                        alerts: scheduler.getRecentAlerts()
                    }
                });
            };
        });
    }

    setupMiddleware() {
        this.app.use(express.json());
        this.app.use(express.static(path.join(__dirname, 'public')));
    }

    setupRoutes() {
        // API Endpoints
        this.app.get('/api/status', (req, res) => {
            res.json({
                status: 'running',
                environment: configManager.environment,
                tasks: scheduler.getTaskStatus(),
                resources: scheduler.getResourceStatus(),
                statistics: scheduler.getStatistics()
            });
        });

        this.app.get('/api/config', (req, res) => {
            res.json(configManager.config);
        });

        this.app.get('/api/history', (req, res) => {
            const history = scheduler.getExecutionHistory();
            res.json({
                timestamp: moment().format(),
                history: _.groupBy(history, 'taskId')
            });
        });

        this.app.get('/api/alerts', (req, res) => {
            const alerts = scheduler.getRecentAlerts();
            res.json({
                timestamp: moment().format(),
                alerts: alerts
            });
        });

        // Serve dashboard
        this.app.get('*', (req, res) => {
            res.sendFile(path.join(__dirname, 'public', 'index.html'));
        });
    }

    start() {
        try {
            this.server = this.app.listen(this.port, () => {
                console.log(`Dashboard running at http://localhost:${this.port}`);
            });
        } catch (error) {
            console.error('Failed to start dashboard:', error);
            console.error('Is another process using port', this.port, '?');
            process.exit(1);
        }
    }

    stop() {
        if (this.server) {
            this.server.close();
        }
        if (this.wss) {
            this.wss.close();
        }
    }
}

module.exports = new Dashboard();
