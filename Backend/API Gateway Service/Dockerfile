FROM node:10

WORKDIR /app

# Copy over the required files
COPY . .
COPY package.json ./
COPY package-lock.json ./

# Install dependencies
RUN npm install

CMD node server.js


