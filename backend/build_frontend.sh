#!/bin/bash
echo "Building React frontend..."
cd ../frontend
npm install
npm run build

echo "Copying build to Django static directory..."
rm -rf ../backend/frontend_build/*
mkdir -p ../backend/frontend_build/
cp -r dist/* ../backend/frontend_build/


echo "Frontend build complete."