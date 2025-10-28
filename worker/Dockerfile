# Use Node.js 22 alpine for smaller image size
FROM node:22-alpine

# Install Python, FFmpeg, and other dependencies
RUN apk add --no-cache \
    --repository http://dl-cdn.alpinelinux.org/alpine/edge/main \
    --repository http://dl-cdn.alpinelinux.org/alpine/edge/community \
    python3 \
    py3-pip \
    ffmpeg \
    bash \
    curl

# Install yt-dlp (use --break-system-packages for Alpine's externally managed environment)
RUN pip3 install --no-cache-dir --break-system-packages yt-dlp

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev for build)
RUN npm ci

# Copy prisma schema
COPY prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Copy TypeScript config and source
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript
RUN npm run build

# Clean up dev dependencies
RUN npm prune --production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Create cookies directory and file
RUN mkdir -p /app/cookies && touch /app/cookies/cookies.txt

# Change ownership of app directory
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001

# Start the worker
CMD ["npm", "start"]