FROM node:22-alpine AS build
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/angular.json frontend/tsconfig*.json ./integration/
COPY frontend/src/ ./integration/src/
COPY frontend/public/ ./integration/public/
COPY demo4216/integration/ ./integration/
COPY demo4216/personnel-v2/ ./personnel-v2/
RUN cd integration && ../node_modules/.bin/ng build --configuration development
RUN ln -s /app/node_modules /app/personnel-v2/node_modules && cd personnel-v2 && ../node_modules/.bin/ng build --configuration development --base-href /v2/

FROM nginx:alpine
COPY --from=build /app/integration/dist/frontend/browser/ /usr/share/nginx/html/
COPY --from=build /app/personnel-v2/dist/frontend/browser/ /usr/share/nginx/html/v2/
COPY demo4216/nginx.conf /etc/nginx/conf.d/default.conf
