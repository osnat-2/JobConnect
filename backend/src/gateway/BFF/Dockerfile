FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
COPY ../../../shared/nodejs ./shared/nodejs
RUN npm install --production
COPY . .
ENV PORT=8080
EXPOSE 8080
CMD ["node","server.js"]
