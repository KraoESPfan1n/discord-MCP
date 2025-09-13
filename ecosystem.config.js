module.exports = {
  apps: [{
    name: 'discord-mcp',
    script: 'dist/server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 3000,
      HOST: '0.0.0.0'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOST: '0.0.0.0'
    },
    log_file: './logs/discord-mcp-combined.log',
    error_file: './logs/discord-mcp-error.log',
    out_file: './logs/discord-mcp-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    time: true,
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
