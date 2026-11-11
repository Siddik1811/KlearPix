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
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-xs font-semibold text-blue-600 tracking-wide">
              All-In-One Studio Media Suite · 100% Browser Private
            </p>
            <h2 className="mt-2 font-display text-2xl sm:text-3xl font-extrabold text-slate-900">
              Everything KlearPix Can Do For You
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Click any tool card below to launch that workspace directly at the top of the page.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Feature 1: Single Photo Lossless Unblender */}
            <div className="rounded-2xl bg-slate-50 hover:bg-blue-50/40 border border-slate-200/90 hover:border-blue-300 p-6 flex flex-col justify-between transition-all">
              <div>
                <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-4 shadow-xs">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <p className="text-xs font-mono font-bold text-blue-600">
                  01. Single Photo Cleaner
                </p>
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
                className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer whitespace-nowrap"
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
                <p className="text-xs font-mono font-bold text-indigo-600">
                  02. Batch Processing
                </p>
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
                className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer whitespace-nowrap"
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
                <p className="text-xs font-mono font-bold text-emerald-600">
                  03. Veo 3 & Google Flow (25+ Mbps)
                </p>
                <h3 className="mt-1 font-display font-bold text-base text-slate-900">
                  Lossless 1080p Video Watermark Remover
                </h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  Cleans Gemini Omni, Google Flow, Veo 3, and Nanonets videos with our GPU corner-patch pipeline and 25–45 Mbps studio bitrate—zero dullness and original audio intact.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onSelectTab('video')}
                className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-800 cursor-pointer whitespace-nowrap"
              >
                <span>Open HD Video Remover</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Feature 4: Video HD / 4K-Style Enhancer (Instagram Reels Booster) */}
            <div className="rounded-2xl bg-slate-50 hover:bg-violet-50/50 border border-slate-200/90 hover:border-violet-300 p-6 flex flex-col justify-between transition-all">
              <div>
                <div className="w-11 h-11 rounded-xl bg-violet-600 text-white flex items-center justify-center mb-4 shadow-xs">
                  <Zap className="w-5 h-5" />
                </div>
                <p className="text-xs font-mono font-bold text-violet-700">
                  04. Instagram Reels & Shorts Booster
                </p>
                <h3 className="mt-1 font-display font-bold text-base text-slate-900">
                  Video HD & 4K-Look Quality Enhancer
                </h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  Boosts dull or soft videos into ultra-crisp 1080p / 2K 1440p quality using GPU 3×3 optical sharpening, HDR color mastering, and 30+ Mbps studio encoding.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onSelectTab('enhance')}
                className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-violet-700 hover:text-violet-900 cursor-pointer whitespace-nowrap"
              >
                <span>Open Video Quality Enhancer</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Feature 5: Dedicated No-AI-Tag Stealth Shield (Photo & Video) */}
            <div className="rounded-2xl bg-slate-50 hover:bg-amber-50/50 border border-slate-200/90 hover:border-amber-300 p-6 flex flex-col justify-between transition-all">
              <div>
                <div className="w-11 h-11 rounded-xl bg-amber-600 text-white flex items-center justify-center mb-4 shadow-xs">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <p className="text-xs font-mono font-bold text-amber-700">
                  05. Instagram & YouTube AI Tag Remover
                </p>
                <h3 className="mt-1 font-display font-bold text-base text-slate-900">
                  No-AI-Tag Stealth Shield (Photo & Video)
                </h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  Strips C2PA, EXIF, XMP, MP4 container atoms, and SynthID frequency carriers while keeping 100% exact visual quality—so social platforms don&apos;t attach &quot;Made with AI&quot; labels.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onSelectTab('aitag_shield')}
                className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-900 cursor-pointer whitespace-nowrap"
              >
                <span>Open No-AI-Tag Stealth Shield</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Feature 6: Format & 1.5x HD Upscale + Ctrl+V Paste */}
            <div className="rounded-2xl bg-slate-50 hover:bg-blue-50/40 border border-slate-200/90 hover:border-blue-300 p-6 flex flex-col justify-between transition-all">
              <div>
                <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center mb-4 shadow-xs">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <p className="text-xs font-mono font-bold text-slate-700">
                  06. Studio Converter & Ctrl+V Paste
                </p>
                <h3 className="mt-1 font-display font-bold text-base text-slate-900">
                  PNG, WebP & JPG + 1.5× HD Upscaler
                </h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  Paste images directly with <code className="font-mono font-bold">Ctrl+V</code>, convert into lossless PNG, fast WebP, or compact JPG—and upscale resolution by 1.5× in a single click.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onTriggerAction?.('sample_image')}
                className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-slate-900 hover:text-blue-600 cursor-pointer whitespace-nowrap"
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
                Download 100% Original Quality Result
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Save your clean image (in PNG, WebP, or JPG with optional camera EXIF) or MP4 video with exact original resolution, file size (MB), and audio preserved.
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-xs font-semibold text-emerald-600 tracking-wide">
              Universal AI Compatibility · Zero Quality Loss
            </p>
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
                <p className="text-xs font-mono font-bold text-blue-600 mb-2">
                  AI Photos & Bulk Images
                </p>
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
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-blue-600 text-white font-display font-bold text-xs transition-colors cursor-pointer whitespace-nowrap"
              >
                Open Image Watermark Remover
              </button>
            </div>

            {/* Video Card */}
            <div className="bg-slate-50 rounded-3xl border border-slate-200/90 p-7 flex flex-col justify-between">
              <div>
                <p className="text-xs font-mono font-bold text-emerald-600 mb-2">
                  AI Videos, Reels & Shorts
                </p>
                <h3 className="font-display font-bold text-xl text-slate-900 mb-2">
                  Gemini Omni, Google Flow, Veo 3 & Nanonets Videos
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-5">
                  Cleans every video frame in your browser while keeping the original frame rate, 25–45 Mbps HD resolution, and full audio track intact.
                </p>
                <ul className="space-y-2 text-xs text-slate-700 font-medium mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Supports MP4, WebM, and MOV video files up to 1440p 2K</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Scrubs MP4 C2PA atoms & boosts clarity for Instagram Reels</span>
                  </li>
                </ul>
              </div>
              <button
                type="button"
                onClick={() => onSelectTab('video')}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-display font-bold text-xs transition-colors cursor-pointer whitespace-nowrap"
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
            <div className="flex items-center gap-3 text-xs font-semibold text-emerald-700">
              <span>Verified File Security</span>
              <span aria-hidden="true">·</span>
              <span>Instant Local Speed</span>
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
              Everything you need to know about removing AI watermarks, boosting video quality, and preventing AI tags.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                q: 'How does the No-AI-Tag Stealth Shield prevent Instagram & YouTube "Made with AI" tags?',
                a: 'Social platforms detect AI media by reading hidden C2PA/JUMBF manifests, EXIF/XMP tags, MP4 uuid/udta boxes, and invisible SynthID frequency-domain patterns. Our No-AI-Tag Stealth Shield re-muxes a brand-new container from scratch and applies an imperceptible sub-pixel CMOS sensor PRNU dither—removing all AI signatures while keeping 100% exact visual quality.',
              },
              {
                q: 'Will my photo or video lose quality after removing the watermark?',
                a: 'No. KlearPix keeps 100% of your original resolution, sharpness, and video audio. Videos are encoded at 25 to 45 Mbps Studio H.264 bitrate so they never look dull on Instagram Reels.',
              },
              {
                q: 'How can I boost a low-quality video to HD / 4K-like clarity for Instagram Reels?',
                a: 'Select Tool 04 ("Video HD / 4K Booster") at the top of the page, upload your video, choose "Instagram Reels Ultra HD" or "4K-Look Super Sharp", and export your enhanced MP4.',
              },
              {
                q: 'Can I paste an image directly or clean 25 photos at once?',
                a: 'Yes! Press Ctrl+V anywhere on the page to paste a copied image, or choose Tool 02 ("Bulk 25× Photos") to clean up to 25 images in one click.',
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
