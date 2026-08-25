ARG NODE_VERSION=lts-slim

FROM node:${NODE_VERSION}

WORKDIR /xenia-web-service

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

ENV API_PORT=36000
# MongoDB on host system or container (27018)
ENV MONGO_URI=mongodb://host.docker.internal:27017/
ENV SWAGGER_API=true
ENV nginx=true
ENV xstorage=true

EXPOSE 36000

CMD [ "npm", "start" ]
