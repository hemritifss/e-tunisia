# Production stage - use pre-built dist
FROM node:20-alpine AS production

WORKDIR /app

# Install production dependencies. We use `npm install --omit=dev` instead of
# `npm ci` because peer-dep collisions across @nestjs/* major versions
# (10.x common + 11.x core) require --legacy-peer-deps + a lockfile that may
# get regenerated. `install` is forgiving of those skews; `ci` aborts on them.
COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps && npm cache clean --force

# Copy pre-built dist
COPY dist ./dist
COPY src/seeds ./src/seeds

# Create uploads directory
RUN mkdir -p uploads

EXPOSE 3000

CMD ["node", "dist/main"]
