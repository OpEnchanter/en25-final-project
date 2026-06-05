PAGE="" bun run build
echo ""
echo "COPYING ASSETS TO DIST"
cp -r assets/* dist/assets
mkdir -p dist/data
cp -r src/data/* dist/data
echo "DONE"