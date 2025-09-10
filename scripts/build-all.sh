#!/bin/bash

# Build script for Azure Universal Print Demo
set -e

echo "🏗️  Building Azure Universal Print Demo"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check for required tools
echo "🔍 Checking for required tools..."

if ! command_exists node; then
    echo "❌ Node.js is required but not installed. Please install Node.js 18 or higher."
    exit 1
fi

if ! command_exists npm; then
    echo "❌ npm is required but not installed. Please install npm."
    exit 1
fi

echo "✅ Required tools found"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."

echo "🔧 Installing backend dependencies..."
cd backend
npm ci
cd ..

echo "🎨 Installing frontend dependencies..."
cd frontend
npm ci
cd ..

# Run linting and type checking
echo ""
echo "🔍 Running code quality checks..."

echo "🔧 Linting and type checking backend..."
cd backend
npm run lint
npm run build
cd ..

echo "🎨 Linting and type checking frontend..."
cd frontend
npm run lint
npm run type-check
cd ..

# Build applications
echo ""
echo "🏗️  Building applications..."

echo "🔧 Building backend..."
cd backend
npm run build
cd ..

echo "🎨 Building frontend..."
cd frontend
npm run build
cd ..

# Run tests
echo ""
echo "🧪 Running tests..."

echo "🔧 Running backend tests..."
cd backend
npm test
cd ..

echo ""
echo "✅ Build completed successfully!"
echo ""
echo "📁 Built artifacts:"
echo "   🔹 Backend: ./backend/dist/"
echo "   🔹 Frontend: ./frontend/dist/"
echo ""
echo "🚀 Ready for deployment!"