# Minimal image so registries (e.g. Glama) can start the server and run
# MCP introspection (initialize + tools/list) over stdio.
FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY dist ./dist
ENTRYPOINT ["node", "dist/index.js"]
