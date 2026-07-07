FROM node:18-alpine
WORKDIR /app
COPY src/gateway/BFF/package.json ./
COPY shared/nodejs ./shared/nodejs
RUN npm install --production
COPY src/gateway/BFF/. ./
ENV PORT=8080
EXPOSE 8080
CMD ["node","server.js"]
