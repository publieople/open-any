import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'OpenAny',
        short_name: 'OpenAny',
        description: 'Universal file viewer and editor',
        theme_color: '#0f172a',
        display: 'standalone',
        icons: [
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      }
    })
  ],
  build: {
    chunkSizeWarningLimit: 1000,
    rolldownOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) return 'vendor-react'
          if (id.includes('node_modules/codemirror') || id.includes('node_modules/@codemirror/')) return 'vendor-codemirror'
          if (id.includes('node_modules/vanilla-jsoneditor')) return 'vendor-jsoneditor'
          if (id.includes('node_modules/@mdxeditor/editor')) return 'vendor-mdxeditor'
          if (id.includes('node_modules/tui-image-editor') || id.includes('node_modules/fabric')) return 'vendor-image'
          if (id.includes('node_modules/papaparse')) return 'vendor-csv'
          if (id.includes('node_modules/@tanstack/react-table')) return 'vendor-table'
        },
      },
    },
  },
})
