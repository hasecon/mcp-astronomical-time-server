FROM node:20-alpine

WORKDIR /app

# Copy everything
COPY . .

# Install ALL dependencies 
RUN npm install

# Build 
RUN npm run build

# Start
CMD ["node", "dist/index.js"]