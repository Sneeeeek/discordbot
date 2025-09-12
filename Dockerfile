FROM node:latest

RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 && \
    ln -s /usr/bin/python3 /usr/bin/python

WORKDIR /app
COPY package.json .
RUN npm install
COPY ytdl.js .

CMD ["node", "ytdl.js"]