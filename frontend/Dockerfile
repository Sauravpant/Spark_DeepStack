# ---- Stage 1: build the Vite/React app ----
FROM node:22-alpine AS build

WORKDIR /app

# Install deps first for better layer caching
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# API base URL baked into the static build.
# Defaults to a relative path so nginx (below) can reverse-proxy it to the
# backend container - override at build time with:
#   docker build --build-arg VITE_API_BASE_URL=https://api.example.com/api/v1 .
ARG VITE_API_BASE_URL=/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# ---- Stage 2: serve with nginx ----
FROM nginx:1.27-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
