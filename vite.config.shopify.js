import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// Shopify theme integration build configuration
export default defineConfig({
  plugins: [react()],
  
  build: {
    // Output as UMD format for Shopify compatibility
    lib: {
      entry: resolve(__dirname, 'src/shopify-entry.jsx'),
      name: 'MapGlassConfigurator',
      fileName: 'map-glass-configurator',
      formats: ['umd']
    },
    
    // Optimize for production
    minify: 'terser',
    sourcemap: false,
    
    // Rollup options for UMD build
    rollupOptions: {
      output: {
        // Global variable name when included via script tag
        name: 'MapGlassConfigurator',
        
        // Asset naming for Shopify
        assetFileNames: (assetInfo) => {
          if (assetInfo.name.endsWith('.css')) {
            return 'map-glass-configurator.css'
          }
          return 'assets/[name][extname]'
        },
        
        // Single file output for UMD
        inlineDynamicImports: true,
        
        // Resolve external globals if using CDN
        globals: {}
      },
      
      // Mark external dependencies if loading from CDN
      external: []
    },
    
    // Output directory for Shopify theme assets
    outDir: 'dist-shopify',
    
    // Empty output directory before build
    emptyOutDir: true,
    
    // Chunk size warnings
    chunkSizeWarningLimit: 1000, // 1MB warning threshold
    
    // CSS code splitting
    cssCodeSplit: false // Bundle all CSS together for Shopify
  },
  
  // Define global constants
  define: {
    'process.env.NODE_ENV': '"production"',
    'process.env.SHOPIFY_INTEGRATION': 'true'
  }
})