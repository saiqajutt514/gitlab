FROM node:14
WORKDIR /usr/src/socket-service
COPY package*.json ./
COPY yarn.lock ./
COPY . .
RUN yarn install
RUN npm run build
CMD npm run start:prod