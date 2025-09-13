FROM node:latest

RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 && \
    ln -s /usr/bin/python3 /usr/bin/python

WORKDIR /app
COPY package.json .
RUN npm install
COPY bot.js .

CMD ["node", "bot.js"]