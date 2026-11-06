# ✨ KlearPix — Lossless AI Image & Video Watermark Remover

**Live Demo:** [https://klearpix.vercel.app](https://klearpix.vercel.app)

**KlearPix** is a fast, 100% client-side AI watermark unblending web application that removes visible corner watermarks from **Google Gemini, Imagen 3, Nano Banana, Google Flow, Veo 3, and Nanonets** photos and videos without blurring or losing native resolution.

## 🚀 Key Features

- **100% Lossless Image Unblending:** Uses inverse mathematical alpha compositing (`Original = (Watermarked - α × 255) / (1 - α)`) to restore exact original pixels underneath the watermark.
- **Bulk Multi-Photo Mode:** Clean up to **25 AI images** simultaneously in one click.
- **HD Video Watermark Remover:** Frame-by-frame WebCodecs H.264 processing for **Veo 3, Google Flow, and Gemini Omni** videos with lossless original audio passthrough.
- **AI Metadata (EXIF / C2PA) Privacy Shield:** Automatically strips hidden AI generation metadata tags on export.
- **Direct Paste (`Ctrl+V`) & Image URL Support:** Paste copied images directly from clipboard or import via URL.
- **Format & HD Upscale Studio:** Export in **PNG (Lossless)**, **WebP**, or **JPG**, with optional **1.5× HD Upscaling**.
- **6-Layer Security Firewall:** Cryptographic magic-byte file verification, SSRF URL protection, and strict enterprise security headers.


## 🛠️ Run Locally

```bash
# 1. Install dependencies
npm install

# 2. Start development server on http://localhost:3000
npm run dev

# 3. Build for production
npm run build
```
