# Stage 1: Build the Next.js static export
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Serve with nginx (same as original, drop-in replacement)
FROM nginx:alpine

COPY --from=builder /app/out /usr/share/nginx/html

EXPOSE 80
