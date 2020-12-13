FROM keymetrics/pm2:14-alpine

ENV TZ=UTC
RUN apk add tzdata

COPY src src/
COPY package.json .
COPY tsconfig.json .
COPY ecosystem.config.js .

RUN npm install --production && npm ci && npm run build && npm prune --production

CMD ["pm2-runtime", "start", "ecosystem.config.js"]
