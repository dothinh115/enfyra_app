module.exports = {
  apps: [{
    name: 'enfyra-cms',
    script: '.output/server/index.mjs',
    instances: 1,
    watch: false,
    ignore_watch: ['node_modules', 'logs'],
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    // Restart when memory usage exceeds 500MB
    max_memory_restart: '500M',
    // Auto restart on crash
    autorestart: true,
    // Min uptime before considering stable
    min_uptime: '10s',
    // Max restarts within 15 min window
    max_restarts: 10
  }]
};