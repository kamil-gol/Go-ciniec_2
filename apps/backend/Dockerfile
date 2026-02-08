FROM node:20-slim
WORKDIR /app

# Install OpenSSL and DejaVu fonts (full UTF-8/Polish support)
RUN apt-get update && \
    apt-get install -y openssl fonts-dejavu-core && \
    rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Generate Prisma Client
RUN npx prisma generate

EXPOSE 3001

# Run in dev mode
CMD ["npm", "run", "dev"]
