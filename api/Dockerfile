FROM node:22-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY src ./src

ENV PORT=3980
ENV SQLITE_PATH=/data/samgent.db
EXPOSE 3980
CMD ["node", "src/index.js"]
