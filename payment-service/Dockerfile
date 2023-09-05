FROM node:14
WORKDIR /usr/src/payment
COPY package*.json ./
COPY yarn.lock ./
COPY . .
RUN yarn install
RUN npm run build
CMD npm run start:prod