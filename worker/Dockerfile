FROM node:20-slim

RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
COPY scripts ./scripts

RUN npm install

COPY . .

RUN npx prisma generate

RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
