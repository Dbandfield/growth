FROM node:8

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . . 
RUN npm run build-debug
EXPOSE 80
ENV DEBUG growth*
CMD ["npm", "start"]