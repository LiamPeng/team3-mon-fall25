#!/bin/bash
echo "🛠 Building React frontend..."
cd ../frontend
npm install
npm run build

echo "📦 Copying build to Django static directory..."
rm -rf ../backend/static/*
mkdir -p ../backend/static/
cp -r dist/* ../backend/static/  # 若你的 build 資料夾是 build，改成 build/*
echo "✅ Frontend build complete."