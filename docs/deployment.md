# Production & Free Demo Deployment Guide

## 1. Backend Deployment (Render)

1. Connect your GitHub repository to [Render](https://render.com).
2. Create a new **Web Service** using the root repository (or using `render.yaml` Blueprint).
3. Set the following settings:
   - **Root Directory**: `backend` (or leave root with build command below)
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Environment Variables**:
     - `LLM_PROVIDER`: `gemini`
     - `GEMINI_MODEL`: `gemini-2.5-flash`
     - `GEMINI_API_KEY`: *(Your Google AI Studio API key)*
     - `CORS_ORIGINS`: `*` (or your specific Vercel/Netlify domain)
     - `DEBUG_TRACE`: `true`

> [!NOTE]
> Render Free Tier Web Services spin down after inactivity. On a cold start, allow 30-50s for the initial boot. ChromaDB and uploads are ephemeral on free tier without a persistent disk; re-ingest sample files after cold starts.

---

## 2. Frontend Deployment (Vercel & Netlify)

### Vercel
1. Connect your GitHub repository to [Vercel](https://vercel.com).
2. Set **Root Directory** to `frontend`.
3. In Environment Variables, set:
   - `VITE_API_URL`: `https://<YOUR-RENDER-BACKEND-SERVICE>.onrender.com`
4. Click **Deploy**. Vercel will build with `npm run build` and route using `vercel.json`.

### Netlify
1. Connect your GitHub repository to [Netlify](https://netlify.com).
2. Set **Base Directory** to `frontend`, **Build command** to `npm run build`, and **Publish directory** to `dist`.
3. In Environment Variables, set:
   - `VITE_API_URL`: `https://<YOUR-RENDER-BACKEND-SERVICE>.onrender.com`
4. Deploy site. SPA routing is automatically handled by `netlify.toml` and `public/_redirects`.


