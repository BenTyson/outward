# Phase 3: Shopify Integration

## Current Status ✅ WORKING
- **Store**: lumengrave.com (Shopify Basic)
- **Deployment**: Ready for Vercel
- **Storage**: Cloudinary (free tier)
- **Test Product**: Created and active

## Completed Setup ✅

### API Credentials
```bash
# .env.local / .env.production
VITE_SHOPIFY_DOMAIN=lumengrave.myshopify.com
VITE_SHOPIFY_STOREFRONT_TOKEN=3d4fa6fda4ad0a34d647ca191fd33095
VITE_CLOUDINARY_CLOUD_NAME=dq69mrv68
VITE_CLOUDINARY_UPLOAD_PRESET=lumengrave_maps
```

### Test Product Variant IDs
- Whiskey (rocks): 43120044769368
- Pint: 43120044802136
- Wine: 43120044834904
- Shot: 43120044867672

## Integration Architecture

### Order Flow
1. Customer designs map → clicks checkout
2. System generates 3 images:
   - 3D model preview (canvas capture)
   - Map preview (1600px)
   - Laser file (4800px high-res)
3. Images upload to Cloudinary
4. Checkout opens with line item properties
5. Order appears in Shopify admin with clickable URLs

### Data Structure in Orders
```
Line Item Properties:
├── Glass Type: "rocks"
├── _3D Model Preview: [URL] (underscore = internal)
├── _Map Preview Image: [URL] 
└── _Laser File (High-Res): [URL]
```

## Next Steps

### Deploy to Production
```bash
# Deploy to Vercel
vercel --prod

# Set environment variables in Vercel dashboard
# All VITE_* variables from .env.production
```

### Create Production Product
1. Duplicate test product as "Custom Map Glass"
2. Set real pricing
3. Update variant IDs in `src/utils/shopify.js`
4. Keep hidden until tested

### Add to Store
```html
<!-- Simple link in theme -->
<a href="https://your-vercel-url.vercel.app" target="_blank">
  Design Your Custom Map Glass →
</a>
```

## Troubleshooting

### Common Issues
- **Blank 3D capture**: Fixed with `preserveDrawingBuffer: true`
- **Small laser files**: Fixed with 4800px generation
- **HTML in orders**: Use plain URLs (auto-linked by Shopify)
- **Checkout fails**: Check product is published, inventory tracking disabled

### Testing Checklist
- [ ] 3D model capture working
- [ ] High-res file >5MB
- [ ] URLs clickable in order admin
- [ ] Checkout completes successfully
- [ ] Files accessible from Cloudinary

## Key Files
- `/src/utils/shopify.js` - Checkout integration
- `/src/utils/cloudinary.js` - Image uploads  
- `/src/components/Checkout/CheckoutButton.jsx` - Checkout flow
- `/src/components/Steps/Step2.jsx` - 3D capture