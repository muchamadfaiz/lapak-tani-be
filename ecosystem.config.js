module.exports = {
  apps: [
    {
      name: 'attendance-api',
      script: 'dist/src/main.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      merge_logs: true,
      max_size: '50M',
      retain: 5,
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
        // Tambahkan variabel environment production lainnya di sini jika perlu
        // PORT: 3000,
      },
    },
  ],
};
