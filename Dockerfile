FROM node:22.22.2-trixie-slim

WORKDIR /xenia-web-service

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

ENV API_PORT=36000
ENV SWAGGER_API=true
ENV nginx=true

EXPOSE 36000

CMD [ "npm", "start" ]
