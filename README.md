# ✨ KlearPix — Lossless AI Image & Video Watermark Remover

**Live Demo:** [https://klearpix.vercel.app](https://klearpix.vercel.app)

**KlearPix** is a fast, 100% client-side AI watermark unblending web application that removes visible corner watermarks from **Google Gemini, Imagen 3, Nano Banana, Google Flow, Veo 3, and Nanonets** photos and videos without blurring or losing native resolution.
---

## 🚀 Key Features (5-Tool Studio)

- **01. 100% Lossless Image Unblending:** Uses inverse mathematical alpha compositing (`Original = (Watermarked - α × 255) / (1 - α)`) to restore exact original pixels underneath the watermark.
- **02. Bulk Multi-Photo Mode:** Clean up to **25 AI images** simultaneously in one click.
- **03. Native-Quality Video Watermark Remover:** Frame-by-frame WebCodecs H.264 processing for **Veo 3, Google Flow (1080p), and Gemini Omni** videos while preserving 100% original resolution, file size (MB), and lossless audio.
- **04. Video HD / 4K-Look Reels Booster:** Dedicated optical unsharp-masking and high-bitrate encoder for Instagram Reels, YouTube Shorts, and TikTok.
- **05. No-AI-Tag Stealth Shield & Forensic Scanner:** Wipes binary C2PA/JUMBF manifests, XMP/IPTC `trainedAlgorithmicMedia` tags, and MP4 `uuid`/`udta` boxes, while injecting a genuine **Apple iPhone 16 Pro (iOS 18.2)** binary EXIF header with 100% untouched corner pixels.
- **Direct Paste (`Ctrl+V`) & Image URL Support:** Paste copied images directly from clipboard or import via URL.
- **6-Layer Security Firewall:** Cryptographic magic-byte file verification, SSRF URL protection, and strict enterprise security headers.

---

## 🛠️ Run Locally

```bash
# 1. Install dependencies
npm install

# 2. Start development server on http://localhost:3000
npm run dev

# 3. Build for production
npm run build
```
