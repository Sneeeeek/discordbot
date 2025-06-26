FROM node:20
WORKDIR /app
COPY package.json .
RUN npm install
COPY bot.js .

CMD ["node", "bot.js"]