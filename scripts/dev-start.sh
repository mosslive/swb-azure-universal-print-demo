#!/bin/bash

# Development startup script for Azure Universal Print Demo
set -e

echo "🚀 Starting Azure Universal Print Demo Development Environment"

# Check if .env files exist
if [ ! -f "./backend/.env" ]; then
    echo "⚠️  Backend .env file not found. Copying from example..."
    cp ./backend/.env.example ./backend/.env
    echo "📝 Please update ./backend/.env with your Azure configuration"
fi

if [ ! -f "./frontend/.env" ]; then
    echo "⚠️  Frontend .env file not found. Copying from example..."
    cp ./frontend/.env.example ./frontend/.env
    echo "📝 Please update ./frontend/.env with your Azure configuration"
fi

# Install dependencies if node_modules don't exist
if [ ! -d "./backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

if [ ! -d "./frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

# Start backend in the background
echo "🔧 Starting backend server..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "🎨 Starting frontend development server..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Development environment started!"
echo "🔹 Backend:  http://localhost:3001"
echo "🔹 Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"

# Function to kill both processes on script exit
cleanup() {
    echo ""
    echo "🛑 Stopping development servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    wait $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    echo "✅ Development environment stopped"
}

# Set trap to cleanup on script exit
trap cleanup EXIT INT TERM

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID