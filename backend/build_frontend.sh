#!/bin/bash
echo "🛠 Building React frontend..."
cd ../frontend
npm install
npm run build

echo "📦 Copying build to Django static directory..."
rm -rf ../backend/static/*
mkdir -p ../backend/static/
cp -r dist/* ../backend/static/

echo "Copying index.html to Django templates..."
rm -rf ../backend/templates/*
mkdir -p ../backend/templates
cp dist/index.html ../backend/templates/

echo "Frontend build complete."