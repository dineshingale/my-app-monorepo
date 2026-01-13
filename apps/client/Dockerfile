# Use official Node.js image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Expose port (Vite default is 5173, but production serves static or uses preview)
# For this setup, we will use 'preview' to serve the build
EXPOSE 4173

# Start the application
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0"]
