FROM node:10

WORKDIR /usr/src/app

# Install dependencies
COPY package.json ./
COPY package-lock.json ./
RUN npm install

# Copy source files
COPY . ./

# Make an optimized version of this build
RUN mkdir build
RUN npm run build

# Serve the optimized version of this build
RUN npm install -g serve
CMD serve -s build