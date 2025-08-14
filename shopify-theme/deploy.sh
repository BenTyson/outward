#!/bin/bash

# Map Glass Configurator - Shopify Theme Deployment Script

echo "🚀 Map Glass Configurator - Shopify Deployment"
echo "============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found. Please run from project root.${NC}"
    exit 1
fi

# Step 1: Build for Shopify
echo -e "\n${YELLOW}Step 1: Building for Shopify...${NC}"
npm run build:shopify

if [ $? -ne 0 ]; then
    echo -e "${RED}Build failed. Please fix errors and try again.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Build successful${NC}"

# Step 2: Check build output
echo -e "\n${YELLOW}Step 2: Checking build output...${NC}"
if [ ! -d "dist-shopify" ]; then
    echo -e "${RED}Error: dist-shopify directory not found${NC}"
    exit 1
fi

# List generated files
echo "Generated files:"
ls -lh dist-shopify/

# Step 3: Prepare for theme upload
echo -e "\n${YELLOW}Step 3: Preparing files for theme upload...${NC}"

# Create upload directory
mkdir -p shopify-theme/assets

# Copy built files to theme assets
cp dist-shopify/map-glass-configurator.js shopify-theme/assets/
cp dist-shopify/map-glass-configurator.css shopify-theme/assets/

# Check file sizes
JS_SIZE=$(ls -lh shopify-theme/assets/map-glass-configurator.js | awk '{print $5}')
CSS_SIZE=$(ls -lh shopify-theme/assets/map-glass-configurator.css | awk '{print $5}')

echo -e "${GREEN}✓ Files prepared${NC}"
echo "  - JS: $JS_SIZE"
echo "  - CSS: $CSS_SIZE"

# Step 4: Instructions for manual upload
echo -e "\n${YELLOW}Step 4: Manual Upload Instructions${NC}"
echo "======================================="
echo ""
echo "1. Go to your Shopify Admin → Online Store → Themes"
echo "2. Click 'Actions' → 'Edit code' on your development theme"
echo ""
echo "3. Upload JavaScript file:"
echo "   - Navigate to 'Assets' folder"
echo "   - Click 'Add a new asset'"
echo "   - Upload: shopify-theme/assets/map-glass-configurator.js"
echo ""
echo "4. Upload CSS file:"
echo "   - Click 'Add a new asset'"
echo "   - Upload: shopify-theme/assets/map-glass-configurator.css"
echo ""
echo "5. Add snippets:"
echo "   - Navigate to 'Snippets' folder"
echo "   - Create new snippet: 'map-configurator-button'"
echo "   - Copy content from: shopify-theme/snippets/map-configurator-button.liquid"
echo "   - Create new snippet: 'map-configurator-scripts'"
echo "   - Copy content from: shopify-theme/snippets/map-configurator-scripts.liquid"
echo ""
echo "6. Update theme.liquid:"
echo "   - Add before </body> tag:"
echo "   {% include 'map-configurator-scripts' %}"
echo ""
echo "7. Update product template:"
echo "   - Add where you want the button:"
echo "   {% include 'map-configurator-button', product: product %}"
echo ""
echo "8. Configure theme settings:"
echo "   - Go to 'Config' → 'settings_schema.json'"
echo "   - Add the configuration from: shopify-theme/config/settings_schema_addition.json"
echo ""
echo "9. Enable in Theme Customizer:"
echo "   - Go to 'Customize' on your theme"
echo "   - Find 'Map Glass Configurator' settings"
echo "   - Enable and configure as needed"
echo ""
echo -e "${GREEN}✓ Deployment preparation complete!${NC}"
echo ""
echo "Optional: Use Shopify CLI for automated deployment:"
echo "  shopify theme push --path shopify-theme/assets"
echo ""