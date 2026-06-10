# Base image
FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy dependency configs
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies (including dev deps to generate prisma client if needed, or production only)
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

# Expose port
EXPOSE 5000

# Start server
CMD ["npm", "start"]
