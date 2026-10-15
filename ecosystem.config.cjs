module.exports = {
  apps: [{
    name: 'papermotion',
    cwd: '/home/azureuser/.openclaw/workspace/PaperMotion',
    script: './node_modules/next/dist/bin/next',
    args: 'start --hostname 127.0.0.1 --port 3010',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    max_memory_restart: '850M',
    env: { NODE_ENV: 'production', GETIT_WEB: '1', GETIT_HOSTED: '1', NEXT_TELEMETRY_DISABLED: '1' },
    time: true
  }]
};
