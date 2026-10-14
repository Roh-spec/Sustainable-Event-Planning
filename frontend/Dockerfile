FROM node:18-alpine

WORKDIR /app

# Install project dependencies
COPY package*.json ./
RUN npm install

# Copy frontend source code
COPY . .

EXPOSE 5173

# Start Vite development server bound to all container interfaces
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
