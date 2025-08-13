FROM node:20
WORKDIR /app
COPY package.json .
RUN npx puppeteer browsers install chrome
RUN npm install
COPY bot.js .

CMD ["node", "bot.js"]