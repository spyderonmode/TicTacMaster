module.exports = {
  apps: [{
    name: 'tictac-app',

    // Production points to compiled JS, dev points to TS
    script: 'dist/server/index.js',
    instances: 'max',
    exec_mode: 'cluster',

    // Interpreter is Node for production
    interpreter: 'node',

    env: {
      NODE_ENV: 'development',
      PORT: 3000,
      EMAIL_HOST: 'smtppro.zoho.in',
      EMAIL_USER: 'support@darklayerstudios.com',
      EMAIL_PASS: '58565525@Sam',
      
      // Dev interpreter override
      PM2_INTERPRETER: 'ts-node',
      PM2_SCRIPT: 'server/index.ts'
    },

    env_production: {
      NODE_ENV: 'production',
      PORT: 5000,
      EMAIL_HOST: 'smtppro.zoho.in',
      EMAIL_USER: 'support@darklayerstudios.com',
      EMAIL_PASS: '58565525@Sam'
    },

    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,

    max_memory_restart: '6G',
    watch: false,
    ignore_watch: ['node_modules', 'logs'],
    restart_delay: 1000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};