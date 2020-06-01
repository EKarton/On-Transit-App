# Stage 1 - the build process
FROM node:7.10 as build-deps
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm install
COPY . ./
RUN npm build

# Stage 2 - the production environment
FROM nginx:1.12-alpine
COPY --from=build-deps /usr/src/app/build /usr/share/nginx/html
CMD ["nginx", "-g", "daemon off;"]