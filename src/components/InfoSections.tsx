import React, { useState } from 'react';
import {
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Zap,
  Image as ImageIcon,
  Video,
  ChevronDown,
  Lock,
  X,
  Layers,
  ClipboardPaste,
  FileSpreadsheet,
  ArrowUpRight,
} from 'lucide-react';
import { WatermarkEngine } from '../lib/watermarkEngine';
import { WorkspaceTab } from '../App';

interface InfoSectionsProps {
  imgEngine: WatermarkEngine | null;
  onSelectTab: (tab: WorkspaceTab) => void;
  onTriggerAction?: (
    action: 'paste' | 'url' | 'bulk_demo' | 'sample_image'
  ) => void;
}

export const InfoSections: React.FC<InfoSectionsProps> = ({
  onSelectTab,
  onTriggerAction,
}) => {
  const [activeModal, setActiveModal] = useState<
    'privacy' | 'terms' | 'disclaimer' | null
  >(null);

  return (
    <>
      {/* ============================================================
          SECTION 1: INTERACTIVE "WHAT THIS WEBSITE CAN DO" SHOWCASE
         ============================================================ */}
      <section
        id="all-features"
        className="py-16 bg-white border-t border-slate-200/80"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              All-In-One AI Media Toolkit
            </span>
            <h2 className="mt-3 font-display text-2xl sm:text-3xl font-extrabold text-slate-900">
              Everything KlearPix Can Do For You
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Click any feature card below to launch that tool directly in the workspace above.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Feature 1: Single Photo Lossless Unblender */}
            <div className="rounded-2xl bg-slate-50 hover:bg-blue-50/40 border border-slate-200/90 hover:border-blue-300 p-6 flex flex-col justify-between transition-all">
              <div>
                <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-4 shadow-xs">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-blue-600">
                  01 · Zero Blur Photo Cleaner
                </span>
                <h3 className="mt-1 font-display font-bold text-base text-slate-900">
                  100% Lossless Image Watermark Remover
                </h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  Removes Gemini, Imagen 3, Nano Banana, and Nanonets corner logos by reversing the transparency math—recovering the exact original pixels underneath.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onTriggerAction?.('sample_image')}
                className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
              >
                <span>Test with a Sample Photo</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Feature 2: Bulk Multi-Photo Cleaner */}
            <div className="rounded-2xl bg-slate-50 hover:bg-indigo-50/40 border border-slate-200/90 hover:border-indigo-300 p-6 flex flex-col justify-between transition-all">
              <div>
                <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-4 shadow-xs">
                  <Layers className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-indigo-600">
                  02 · Batch Processing
                </span>
                <h3 className="mt-1 font-display font-bold text-base text-slate-900">
                  Bulk Clean Up to 25 Photos at Once
                </h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  Have a whole folder of AI images? Upload up to 25 photos together, remove all watermarks in one click, and download them all at once.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onTriggerAction?.('bulk_demo')}
                className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
              >
                <span>Try Bulk Mode with 3 Demo Photos</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Feature 3: HD Video & Audio Preserver */}
            <div className="rounded-2xl bg-slate-50 hover:bg-emerald-50/40 border border-slate-200/90 hover:border-emerald-300 p-6 flex flex-col justify-between transition-all">
              <div>
                <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-4 shadow-xs">
                  <Video className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-emerald-600">
                  03 · Veo 3 & Google Flow
                </span>
                <h3 className="mt-1 font-display font-bold text-base text-slate-900">
                  HD Video Watermark Remover (With Audio)
                </h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  Cleans Gemini Omni, Google Flow, Veo 3, and Nanonets MP4/WebM videos frame-by-frame while keeping original HD resolution and audio intact.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onSelectTab('video')}
                className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-800 cursor-pointer"
              >
                <span>Open HD Video Remover</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Feature 4: Direct Paste (Ctrl+V) & URL Loader */}
            <div className="rounded-2xl bg-slate-50 hover:bg-blue-50/40 border border-slate-200/90 hover:border-blue-300 p-6 flex flex-col justify-between transition-all">
              <div>
                <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center mb-4 shadow-xs">
                  <ClipboardPaste className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-slate-700">
                  04 · Instant Workflow
                </span>
                <h3 className="mt-1 font-display font-bold text-base text-slate-900">
                  Direct Paste (Ctrl+V) & Image URL Import
                </h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  No need to save files to your device first. Copy any image from Gemini or the web and press <code className="font-mono font-bold">Ctrl+V</code>, or paste a direct image link.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onTriggerAction?.('url')}
                className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-slate-900 hover:text-blue-600 cursor-pointer"
              >
                <span>Paste an Image Link Now</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Feature 5: AI Metadata & C2PA Privacy Shield */}
            <div className="rounded-2xl bg-slate-50 hover:bg-emerald-50/40 border border-slate-200/90 hover:border-emerald-300 p-6 flex flex-col justify-between transition-all">
              <div>
                <div className="w-11 h-11 rounded-xl bg-emerald-700 text-white flex items-center justify-center mb-4 shadow-xs">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-emerald-700">
                  05 · Creator Privacy Shield
                </span>
                <h3 className="mt-1 font-display font-bold text-base text-slate-900">
                  Hidden AI Metadata (EXIF / C2PA) Cleaner
                </h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  Automatically strips hidden EXIF, XMP, and C2PA metadata headers from your exported image so social platforms don&apos;t auto-flag your file.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onSelectTab('image')}
                className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer"
              >
                <span>Enabled by Default on All Exports</span>
                <CheckCircle2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Feature 6: Format & 1.5x HD Upscale Converter */}
            <div className="rounded-2xl bg-slate-50 hover:bg-blue-50/40 border border-slate-200/90 hover:border-blue-300 p-6 flex flex-col justify-between transition-all">
              <div>
                <div className="w-11 h-11 rounded-xl bg-blue-700 text-white flex items-center justify-center mb-4 shadow-xs">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-blue-700">
                  06 · Studio Converter
                </span>
                <h3 className="mt-1 font-display font-bold text-base text-slate-900">
                  PNG, WebP & JPG + 1.5× HD Upscaler
                </h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  Convert your cleaned image into lossless PNG, fast WebP, or compact JPG—and optionally upscale resolution by 1.5× in a single click.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onTriggerAction?.('sample_image')}
                className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900 cursor-pointer"
              >
                <span>Try Format & HD Converter</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 2: Simple 3-Step "How It Works"
         ============================================================ */}
      <section
        id="how-it-works"
        className="py-16 bg-slate-50 border-t border-slate-200/80"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600">
              Fast & Effortless
            </span>
            <h2 className="mt-2 font-display text-2xl sm:text-3xl font-extrabold text-slate-900">
              How KlearPix Works in 3 Simple Steps
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              No complicated editing tools and zero blur. Just upload, click remove, and save your original quality file.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl bg-white border border-slate-200/80 p-6 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-display font-bold text-sm flex items-center justify-center mb-4">
                1
              </div>
              <h3 className="font-display font-bold text-base text-slate-900 mb-1.5">
                Upload, Paste (Ctrl+V), or Bulk Select
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Select 1 photo, up to 25 bulk photos, or an HD video from Gemini, Imagen 3, Nano Banana, Veo 3, Flow, or Nanonets.
              </p>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200/80 p-6 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-display font-bold text-sm flex items-center justify-center mb-4">
                2
              </div>
              <h3 className="font-display font-bold text-base text-slate-900 mb-1.5">
                Click &quot;Remove Watermark&quot;
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Our engine automatically detects the exact corner logo, restores the original pixels underneath, and strips hidden AI metadata.
              </p>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200/80 p-6 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-display font-bold text-sm flex items-center justify-center mb-4">
                3
              </div>
              <h3 className="font-display font-bold text-base text-slate-900 mb-1.5">
                Download 100% HD Result
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Save your clean image (in PNG, WebP, or JPG) or MP4 video in full HD resolution with original audio preserved.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 3: Supported AI Models
         ============================================================ */}
      <section
        id="supported-models"
        className="py-16 bg-white border-t border-slate-200/80"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">
              Universal AI Support
            </span>
            <h2 className="mt-2 font-display text-2xl sm:text-3xl font-extrabold text-slate-900">
              Built for Gemini, Veo 3, Flow & Nanonets
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Unlike ordinary blur tools that leave a smudge in the corner, KlearPix reverses the semi-transparent watermark math to keep 100% original clarity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Image Card */}
            <div className="bg-slate-50 rounded-3xl border border-slate-200/90 p-7 flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/80 text-blue-700 text-xs font-bold mb-4">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>AI Photos & Bulk Images</span>
                </div>
                <h3 className="font-display font-bold text-xl text-slate-900 mb-2">
                  Gemini, Imagen 3, Nano Banana & Nanonets Images
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-5">
                  Removes the bottom-right sparkle and corner watermarks from PNG, JPG, and WebP images without changing a single pixel outside the logo area.
                </p>
                <ul className="space-y-2 text-xs text-slate-700 font-medium mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Zero blur or smudge — exact original background recovery</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Single Photo, Bulk 25× Photos, Ctrl+V Paste & URL Import</span>
                  </li>
                </ul>
              </div>
              <button
                type="button"
                onClick={() => onSelectTab('image')}
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-blue-600 text-white font-display font-bold text-xs transition-colors cursor-pointer"
              >
                Open Image Watermark Remover
              </button>
            </div>

            {/* Video Card */}
            <div className="bg-slate-50 rounded-3xl border border-slate-200/90 p-7 flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-700 text-xs font-bold mb-4">
                  <Video className="w-3.5 h-3.5" />
                  <span>AI Videos & Clips</span>
                </div>
                <h3 className="font-display font-bold text-xl text-slate-900 mb-2">
                  Gemini Omni, Google Flow, Veo 3 & Nanonets Videos
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-5">
                  Cleans every video frame in your browser while keeping the original frame rate, HD resolution, and full audio track intact.
                </p>
                <ul className="space-y-2 text-xs text-slate-700 font-medium mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Supports MP4, WebM, and MOV video files</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Original audio stream is preserved without quality loss</span>
                  </li>
                </ul>
              </div>
              <button
                type="button"
                onClick={() => onSelectTab('video')}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-display font-bold text-xs transition-colors cursor-pointer"
              >
                Open Video Watermark Remover
              </button>
            </div>
          </div>

          {/* Security & Privacy Strip */}
          <div className="mt-8 bg-slate-50 rounded-2xl border border-slate-200/90 p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-display font-bold text-sm text-slate-900">
                  100% Private Browser Sandbox & Binary File Security
                </h4>
                <p className="text-xs text-slate-600">
                  Your photos and videos never leave your device. Every file is verified with cryptographic magic-byte headers.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold text-emerald-700">
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" />
                Verified File Security
              </span>
              <span className="inline-flex items-center gap-1">
                <Zap className="w-4 h-4" />
                Instant Local Speed
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 4: Clean FAQ
         ============================================================ */}
      <section id="faq" className="py-16 bg-slate-50 border-t border-slate-200/80">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900">
              Frequently Asked Questions
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Everything you need to know about removing AI watermarks without losing quality.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                q: 'Will my photo or video lose quality after removing the watermark?',
                a: 'No. KlearPix keeps 100% of your original resolution, sharpness, and video audio. Only the semi-transparent watermark pixels in the corner are mathematically restored.',
              },
              {
                q: 'How can I clean multiple photos at once (Bulk Mode)?',
                a: 'Simply click the "Bulk Photos (Up to 25)" tab at the top of the page, select multiple images together, and click "Remove Watermark from All".',
              },
              {
                q: 'What does the AI Metadata (EXIF / C2PA) Shield do?',
                a: 'AI generators often embed hidden tags inside image files showing they were generated by AI. Our Metadata Shield re-encodes a fresh pixel stream so all hidden EXIF/C2PA tags are completely removed.',
              },
              {
                q: 'Can I paste an image directly without downloading it first?',
                a: 'Yes! Right-click any image, select "Copy Image", and press Ctrl+V (or Cmd+V on Mac) anywhere on KlearPix to load it immediately.',
              },
            ].map((item, idx) => (
              <details
                key={idx}
                open={idx === 0}
                className="group rounded-2xl bg-white border border-slate-200/80 p-5 shadow-xs"
              >
                <summary className="font-display font-bold text-sm sm:text-base text-slate-900 cursor-pointer list-none flex items-center justify-between gap-4">
                  <span>{item.q}</span>
                  <ChevronDown className="w-4 h-4 text-slate-500 group-open:rotate-180 transition-transform shrink-0" />
                </summary>
                <p className="mt-2.5 text-sm text-slate-600 leading-relaxed">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Clean Minimal Footer */}
      <footer className="bg-slate-900 text-slate-400 py-10 border-t border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-display font-bold text-white text-sm">
              KlearPix
            </span>
            <span className="text-slate-500">
              — Lossless AI Image & Video Watermark Remover
            </span>
          </div>

          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => setActiveModal('privacy')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <button
              type="button"
              onClick={() => setActiveModal('terms')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Terms of Use
            </button>
            <button
              type="button"
              onClick={() => setActiveModal('disclaimer')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Disclaimer
            </button>
          </div>
        </div>
      </footer>

      {/* Legal Modal */}
      {activeModal && (
        <div
          onClick={() => setActiveModal(null)}
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 shadow-xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-display font-bold text-lg text-slate-900 capitalize">
                {activeModal}
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
              {activeModal === 'privacy' && (
                <p>
                  KlearPix processes all images and videos locally inside your browser. We never upload, store, or view your media files on any external server.
                </p>
              )}
              {activeModal === 'terms' && (
                <p>
                  You are responsible for ensuring you have the right to modify and use the images or videos you process with KlearPix.
                </p>
              )}
              {activeModal === 'disclaimer' && (
                <p>
                  KlearPix is an independent utility and is not affiliated with Google LLC, Gemini, Veo, or Nanonets.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
