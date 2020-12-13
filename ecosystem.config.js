module.exports = {
  apps: [
    {
        name: "butr-backend-app",
        script: "./dist/index.js",
        instances: 1,
        exec_mode: "fork",
        max_restarts: 0,
        watch: ["./dist"],
        env: {
            PORT: '7001',
            NEXUSMODS_APIKEY: ''
        }
    },
  ],
};