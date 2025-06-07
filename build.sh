#!/bin/bash

# Custom build script for Vercel deployment

# Print Node and NPM versions
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the application
echo "Building the application..."
npm run build

# Success message
echo "Build completed successfully!"
