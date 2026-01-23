#/bin/bash
rm -rf ./build
cd ./client
npm run build
cd ..
cd ./server
npm run build
cd ..
cp -r ./server/dist ./build
cp ./server/package.json ./build/package.json
cp ./server/package-lock.json ./build/package-lock.json
cp -r ./client/dist ./build/public
cp Dockerfile ./build