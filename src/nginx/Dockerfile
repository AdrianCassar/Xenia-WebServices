FROM nginx:alpine
COPY --from=xenia-backend:build /xenia-web-service/src/public /usr/share/nginx/html
COPY docker.nginx.conf /etc/nginx/nginx.conf
