# Vercel Deployment Guide

## Quick Deploy Steps

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit - Todo List App"
# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

### 2. Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will auto-detect Next.js settings
5. Click "Deploy"

### 3. Set Environment Variables
In Vercel dashboard → Project Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL = https://shzueztrnmdkaifpxixj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoenVlenRybm1ka2FpZnB4aXhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNjk4MjAsImV4cCI6MjA3Mjk0NTgyMH0.qPcFMpBjfq2efwj1B0DZrcyGjYfzR1lCfoVBAmZAIvc
```

### 4. Redeploy
After adding environment variables, trigger a new deployment.

## Your app will be live at: `https://your-repo-name.vercel.app`

## Features Ready:
✅ User authentication
✅ Todo lists and tasks
✅ Responsive design
✅ Performance optimized
✅ Database with RLS security