FROM node:latest
WORKDIR /app
COPY package.json .
RUN npx puppeteer browsers install chrome
RUN apt-get update
RUN apt-get install -y --no-install-recommends libgtk-3-dev libnotify-dev libgconf-2-4 libnss3 libxss1 libasound2
RUN npm install
COPY bot.js .

CMD ["node", "bot.js"]