# ---- build ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/client/package.json packages/client/
COPY packages/server/package.json packages/server/
RUN npm ci --no-audit --no-fund
COPY tsconfig.base.json ./
COPY tools ./tools
COPY packages ./packages
# the 2014 original, served at /classic
COPY index.html ./
COPY lib ./lib
COPY css ./css
COPY sprites ./sprites
COPY vendor ./vendor
RUN npm run build

# ---- runtime ----
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=8080 CLIENT_DIR=/app/client CLASSIC_DIR=/app/classic
RUN printf '{"type":"module","dependencies":{"ws":"^8.18.0"}}' > package.json \
  && npm install --omit=dev --no-audit --no-fund
COPY --from=build /app/packages/server/dist/index.js ./server.js
COPY --from=build /app/packages/client/dist ./client
COPY --from=build /app/classic-dist ./classic
EXPOSE 8080
CMD ["node", "server.js"]
