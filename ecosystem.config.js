module.exports = {
  apps: [{
    name: 'enfyra-cms',
    script: '.output/server/index.mjs',
    instances: 1,
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};