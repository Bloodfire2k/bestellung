module.exports = {
  apps: [{
    name: 'bestellung-app',
    script: 'npm',
    args: 'run start:prod',
    cwd: '/var/www/bestellung',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: '/var/log/bestellung-error.log',
    out_file: '/var/log/bestellung-out.log',
    log_file: '/var/log/bestellung-combined.log',
    time: true,
    
    // Restart-Strategien
    restart_delay: 4000,
    max_restarts: 5,
    min_uptime: '10s',
    
    // Environment-spezifische Konfiguration
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001,
      // Weitere Production-spezifische Variablen hier
    }
  }]
}; 