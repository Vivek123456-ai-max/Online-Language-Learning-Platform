# Deployment Guide for CodeVerse

CodeVerse is optimized for deployment to Vercel, Netlify, or standard static web hosting.

## Frontend Build Commands
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Node.js Version**: 18.x or 20.x+

## Required Production Environment Variables

Configure these in your Vercel or Netlify project settings:

```env
VITE_SUPABASE_URL=https://bxzdpsmqunpetlvjuptw.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_6C73H9jH8tFDjjUrz3pIsA_nuLLyGc1
VITE_APP_NAME=CodeVerse
VITE_APP_URL=https://your-production-domain.com
```

## Single Page Application (SPA) Routing Configuration

### Vercel (`vercel.json`)
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### Netlify (`_redirects` in `public/`)
```
/*    /index.html   200
```
