// pm2 process definition for the game server. Secrets (JWT_SECRET, PARTY_CODE) are NOT set
// here — they live in a gitignored `.env` file in this same directory (see .env.example) and
// are loaded by src/server/server.ts itself via `dotenv/config`. This file only carries
// non-secret process config, so it's safe to commit.
//
// .cjs (not .js) because package.json sets "type": "module" — pm2/node would otherwise try
// to parse this as ESM, where `module.exports` doesn't exist.
//
// Usage on the server:
//   pm2 delete game-server   # only if it was started manually before this file existed
//   pm2 start ecosystem.config.cjs
//   pm2 save
module.exports = {
  apps: [
    {
      name: 'game-server',
      script: 'npx',
      args: ['tsx', 'src/server/server.ts'],
      cwd: __dirname,
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
