ARG NODE_VERSION=lts-alpine

FROM node:${NODE_VERSION}
WORKDIR /xenia-web-service

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# MongoDB on host system or container (27018)
ENV MONGO_URI=mongodb://host.docker.internal:27017/
ENV API_PORT=36000
ENV SWAGGER_API=true
ENV nginx=true

EXPOSE 36000
CMD [ "npm", "start" ]
