FROM node:22.13.1-alpine AS builder

# Native build tools for ARM64 compilation (sharp, esbuild, swc, etc.)
RUN apk add --no-cache python3 make g++ linux-headers

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

# Disable postinstall (runs codegen before native modules are ready on ARM64)
RUN sed -i 's/"postinstall": "husky install && yarn g:prepare"/"postinstall": "true"/' package.json

# Install dependencies + native modules
RUN yarn install

# Copy turbo config, source, and mobile/extension .graphql files (needed for codegen)
COPY turbo.json ./
COPY apps/web/ apps/web/
COPY apps/mobile/src/ apps/mobile/src/
COPY apps/extension/src/ apps/extension/src/

# Run codegen after native modules are built
RUN yarn g:prepare

# Build (production or development mode)
ARG BUILD_MODE=production
ARG COMMIT_HASH=unknown
ENV NODE_ENV=production
ENV COMMIT_HASH=${COMMIT_HASH}
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
