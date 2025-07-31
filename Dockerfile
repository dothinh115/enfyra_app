FROM node:20-alpine

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install

COPY . .

ARG API_URL=https://api.enfyra.io
ENV API_URL=$API_URL

RUN yarn build

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]