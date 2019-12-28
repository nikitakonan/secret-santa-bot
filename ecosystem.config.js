module.exports = {
  apps: [{
    name: "app",
    script: "./index.js",
    instances: 1,
    autorestart: true,
    watch: false,
    env: {
      NODE_ENV: "development",
    },
    env_production: {
      NODE_ENV: "production",
    }
  }]
}
