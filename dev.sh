#!/bin/bash

# Development helper script
# Builds TypeScript and starts the app

echo "🔨 Building TypeScript..."
npm run build

echo "📋 Copying renderer files..."
cp src/renderer/*.js src/renderer/*.html dist/renderer/

echo "🚀 Starting app..."
npm start

