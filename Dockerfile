FROM node:22.13.1-alpine AS builder

WORKDIR /app

# Copy yarn config and lockfile
COPY .yarnrc.yml yarn.lock package.json ./
COPY .yarn/ .yarn/

# Copy all workspace package.json files (yarn needs them for resolution)
COPY apps/web/package.json apps/web/
COPY apps/mobile/package.json apps/mobile/
COPY apps/extension/package.json apps/extension/
COPY packages/ packages/
COPY config/ config/

# Install dependencies
RUN yarn install --immutable

# Copy source
COPY apps/web/ apps/web/
COPY tsconfig.json turbo.json ./

# Build (production or development mode)
ARG BUILD_MODE=production
ENV NODE_ENV=production
RUN yarn web build:${BUILD_MODE}

# --- Serve with nginx ---
FROM nginx:alpine

RUN apk add --no-cache curl

# SPA fallback: serve index.html for all routes
RUN printf 'server {\n\
    listen 3000;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
\n\
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {\n\
        expires 1y;\n\
        add_header Cache-Control "public, immutable";\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

COPY --from=builder /app/apps/web/build/ /usr/share/nginx/html/

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --retries=3 --start-period=5s \
  CMD curl -sf http://127.0.0.1:3000/ || exit 1
