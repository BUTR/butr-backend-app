FROM keymetrics/pm2:14-alpine

ENV TIME_ZONE=UTC

# Set the timezone in docker
RUN apk --update add tzdata \\
   && cp /usr/share/zoneinfo/UTC /etc/localtime \\
   && echo "UTC" > /etc/timezone \\
   && apk del tzdata

ADD . /

RUN rm -rf ./node_modules ./build &&\
      npm ci &&\
      npm run build &&\
      npm prune --production

CMD ["pm2-runtime", "start", "ecosystem.config.js"]
