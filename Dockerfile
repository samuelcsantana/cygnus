# ---- Build stage ----
FROM node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite bakes VITE_* vars into the static bundle at build time — there is no
# runtime env for a plain Nginx-served SPA, so this must be a build arg.
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm run build

# ---- Runtime stage ----
FROM nginx:1.27-alpine AS runtime

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY security-headers.conf /etc/nginx/conf.d/security-headers.conf

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --spider http://127.0.0.1/ || exit 1

EXPOSE 80
