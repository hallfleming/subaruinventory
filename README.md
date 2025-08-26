# Subaru Parts Inventory (Vite + React)

A lightweight app to catalog Subaru parts, attach photos, and auto-fetch part name/category/price from the Subaru site (best-effort).

## Run locally
```bash
npm install
npm run dev
```
Open the printed local URL in your browser.

## Deploy to Vercel
### One-time
```bash
npm i -g vercel
vercel login
vercel
```
Answer the prompts to create the project.

### Updates
```bash
vercel --prod
```

## Notes
- Price and metadata are parsed from the public Subaru part page via AllOrigins; if parsing fails, you can enter a manual name/price.
- Images are stored locally in the browser (base64) in this simple demo.
