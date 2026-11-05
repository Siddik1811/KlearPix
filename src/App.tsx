import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  Upload,
  Download,
  Video,
  Image as ImageIcon,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Loader2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Check,
  Wand2,
  ClipboardPaste,
  Link2,
  Layers,
  FileCheck2,
  ExternalLink,
  X,
  Lock,
  FileSpreadsheet,
  Maximize2,
} from 'lucide-react';
import {
  WatermarkEngine,
  VideoWatermarkEngine,
  TunerOptions,
  detectWatermarkCandidate,
  detectVideoWatermarkCandidate,
  getAdaptiveImagePreset,
  generateSampleWatermarkedImage,
} from './lib/watermarkEngine';

import {
  verifyFileMagicBytes,
  sanitizeFileName,
  loadMonetizationConfig,
  saveMonetizationConfig,
  validateSafeImageUrl,
  MonetizationConfig,
} from './lib/securityAndMonetization';


import { AdminPortal } from './components/AdminPortal';
import { InfoSections } from './components/InfoSections';

export type WorkspaceTab = 'image' | 'bulk' | 'video';
type ImageFormatMime = 'image/png' | 'image/webp' | 'image/jpeg';

interface BulkPhotoItem {
  id: string;
  file: File;
  status: 'ready' | 'processing' | 'done' | 'error';
  cleanUrl?: string;
  cleanName?: string;
  dimensions?: string;
  sizeKb?: string;
  errorMsg?: string;
}

interface PendingDownloadPayload {
  url: string;
  fileName: string;
  label: string;
  subLabel: string;
}

export default function App() {
  // Check if current URL is /admin or #/admin
  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(() => {
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    const params = new URLSearchParams(window.location.search);
    return (
      path === '/admin' ||
      path.endsWith('/admin') ||
      hash === '#/admin' ||
      hash === '#admin' ||
      params.get('portal') === 'admin'
    );
  });

  useEffect(() => {
    const checkRoute = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      const params = new URLSearchParams(window.location.search);
      setIsAdminRoute(
        path === '/admin' ||
          path.endsWith('/admin') ||
          hash === '#/admin' ||
          hash === '#admin' ||
          params.get('portal') === 'admin'
      );
    };
    window.addEventListener('popstate', checkRoute);
    window.addEventListener('hashchange', checkRoute);

    // Secret shortcut Ctrl+Shift+A for Admin Portal
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        window.location.hash = '#/admin';
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('popstate', checkRoute);
      window.removeEventListener('hashchange', checkRoute);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Core Engines
  const [imgEngine, setImgEngine] = useState<WatermarkEngine | null>(null);
  const [vidEngine, setVidEngine] = useState<VideoWatermarkEngine | null>(null);
  const [mode, setMode] = useState<WorkspaceTab>('image');

  // Monetization Config
  const [monetization, setMonetization] = useState<MonetizationConfig>(() =>
    loadMonetizationConfig()
  );

  // Common Error / Security Banner
  const [errorMessage, setErrorMessage] = useState<string>('');

  // ---------------- IDEA #1: URL INPUT & PASTE STATE ----------------
  const [imageUrlInput, setImageUrlInput] = useState<string>('');
  const [isLoadingUrl, setIsLoadingUrl] = useState<boolean>(false);
  const [showUrlBar, setShowUrlBar] = useState<boolean>(false);

  // ---------------- IDEA #4: AI METADATA PRIVACY SHIELD ----------------
  const [stripAiMetadata, setStripAiMetadata] = useState<boolean>(true);

  // ---------------- IDEA #6: FORMAT & RESOLUTION CONVERTER ----------------
  const [exportMime, setExportMime] = useState<ImageFormatMime>('image/png');
  const [exportScale, setExportScale] = useState<number>(1);

  // ---------------- IDEA #7: SMART 3-SECOND COUNTDOWN MODAL ----------------
  const [pendingDownload, setPendingDownload] = useState<PendingDownloadPayload | null>(
    null
  );
  const [countdownLeft, setCountdownLeft] = useState<number>(0);

  // ---------------- SINGLE IMAGE FLOW STATE ----------------
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [sourcePreviewUrl, setSourcePreviewUrl] = useState<string>('');
  const [imageBitmapData, setImageBitmapData] = useState<ImageData | null>(null);
  const [imgDimensions, setImgDimensions] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });
  const [imgTuner, setImgTuner] = useState<TunerOptions>({
    gain: 0.6,
    offsetX: -85,
    offsetY: -85,
    sizeScale: 1.0,
    polarity: 'white',
  });
  const [isImageProcessing, setIsImageProcessing] = useState<boolean>(false);
  const [cleanImageOutput, setCleanImageOutput] = useState<{
    url: string;
    fileName: string;
    sizeKb: string;
    formatLabel: string;
    outWidth: number;
    outHeight: number;
  } | null>(null);
  const [showImageCompare, setShowImageCompare] = useState<boolean>(false);
  const [showFineTune, setShowFineTune] = useState<boolean>(false);

  // ---------------- IDEA #2: MULTI-IMAGE BULK QUEUE STATE ----------------
  const [bulkItems, setBulkItems] = useState<BulkPhotoItem[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState<boolean>(false);

  // ---------------- VIDEO FLOW STATE ----------------
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string>('');
  const [vidDimensions, setVidDimensions] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });
  const [vidDuration, setVidDuration] = useState<number>(0);
  const [vidTuner, setVidTuner] = useState<TunerOptions>({
    gain: 0.6,
    offsetX: -24,
    offsetY: -24,
    sizeScale: 1.0,
    polarity: 'white',
    mode: 'veo',
  });
  const [isVideoProcessing, setIsVideoProcessing] = useState<boolean>(false);
  const [vidProgress, setVidProgress] = useState<{ progress: number; stage: string }>({
    progress: 0,
    stage: '',
  });
  const [cleanVideoOutput, setCleanVideoOutput] = useState<{
    url: string;
    fileName: string;
    sizeMb: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const bulkInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize Engines on Mount
  useEffect(() => {
    let mounted = true;
    WatermarkEngine.create()
      .then((eng) => {
        if (!mounted) return;
        setImgEngine(eng);
        setVidEngine(new VideoWatermarkEngine(eng));
      })
      .catch((err) => console.error('Engine init error:', err));
    return () => {
      mounted = false;
    };
  }, []);

  // Smart Countdown Timer Effect (Idea #7)
  useEffect(() => {
    if (!pendingDownload || countdownLeft <= 0) return;
    const timer = setTimeout(() => {
      setCountdownLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearTimeout(timer);
  }, [pendingDownload, countdownLeft]);

  // Record Monetization Click & Download Telemetry
  const recordMonetizedAction = (isDownloadStep: boolean) => {
    const current = loadMonetizationConfig();
    const updated: MonetizationConfig = {
      ...current,
      totalAdTriggers: current.enabled
        ? current.totalAdTriggers + 1
        : current.totalAdTriggers,
      totalDownloads: isDownloadStep
        ? current.totalDownloads + 1
        : current.totalDownloads,
    };
    saveMonetizationConfig(updated);
    setMonetization(updated);
  };

  // Trigger File Save
  const triggerLocalSave = (url: string, fileName: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // Initiate Download (Opens Smart 3-Second Modal if enabled, or saves directly)
  const initiateFileDownload = (payload: PendingDownloadPayload) => {
    const latestConfig = loadMonetizationConfig();
    setMonetization(latestConfig);
    if (latestConfig.enabled && latestConfig.smartCountdownModal) {
      setCountdownLeft(Math.max(1, latestConfig.interstitialCountdownSec || 3));
      setPendingDownload(payload);
    } else {
      recordMonetizedAction(true);
      triggerLocalSave(payload.url, payload.fileName);
    }
  };

  // Reset Current Upload
  const handleReset = () => {
    setErrorMessage('');
    setShowFineTune(false);
    setShowImageCompare(false);
    if (mode === 'image') {
      if (sourcePreviewUrl) URL.revokeObjectURL(sourcePreviewUrl);
      if (cleanImageOutput?.url) URL.revokeObjectURL(cleanImageOutput.url);
      setImageFile(null);
      setSourcePreviewUrl('');
      setImageBitmapData(null);
      setCleanImageOutput(null);
    } else if (mode === 'bulk') {
      bulkItems.forEach((item) => {
        if (item.cleanUrl) URL.revokeObjectURL(item.cleanUrl);
      });
      setBulkItems([]);
    } else {
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
      if (cleanVideoOutput?.url) URL.revokeObjectURL(cleanVideoOutput.url);
      setVideoFile(null);
      setVideoPreviewUrl('');
      setCleanVideoOutput(null);
      setVidProgress({ progress: 0, stage: '' });
    }
  };

  // Load Single Image File
  const handleLoadImage = useCallback(
    async (file: File) => {
      setErrorMessage('');
      setShowFineTune(false);
      setShowImageCompare(false);
      setCleanImageOutput((prev) => {
        if (prev?.url) URL.revokeObjectURL(prev.url);
        return null;
      });
      if (sourcePreviewUrl) URL.revokeObjectURL(sourcePreviewUrl);

      const audit = await verifyFileMagicBytes(file, 'image');
      if (!audit.valid) {
        setErrorMessage(
          audit.reason ||
            'Unsupported image file. Please upload a valid PNG, JPG, or WebP image.'
        );
        return;
      }

      setImageFile(file);
      setSourcePreviewUrl(URL.createObjectURL(file));

      const bmp = await createImageBitmap(file);
      const width = bmp.width;
      const height = bmp.height;
      setImgDimensions({ width, height });

      const offscreen = document.createElement('canvas');
      offscreen.width = width;
      offscreen.height = height;
      const ctx = offscreen.getContext('2d', { willReadFrequently: true })!;
      ctx.drawImage(bmp, 0, 0);
      bmp.close();
      const fullData = ctx.getImageData(0, 0, width, height);
      setImageBitmapData(fullData);

      if (imgEngine) {
        const det = detectWatermarkCandidate(fullData, width, height, imgEngine.bg96);
        setImgTuner({
          gain: det.gain,
          offsetX: det.offsetX,
          offsetY: det.offsetY,
          sizeScale: det.sizeScale,
          polarity: 'white',
        });
      }
    },
    [imgEngine, sourcePreviewUrl]
  );

  // IDEA #1: Global Clipboard Paste (`Ctrl + V`) Listener
  useEffect(() => {
    const handleGlobalPaste = async (e: ClipboardEvent) => {
      if (isAdminRoute) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const blob = item.getAsFile();
          if (blob) {
            const pastedFile = new File(
              [blob],
              `pasted_image_${Date.now()}.png`,
              { type: blob.type || 'image/png' }
            );
            setMode('image');
            await handleLoadImage(pastedFile);
          }
          return;
        }
      }
    };
    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [isAdminRoute, handleLoadImage]);

  // IDEA #1: Explicit "Paste from Clipboard" Button Click
  const handleClipboardButtonClick = async () => {
    setErrorMessage('');
    try {
      if (!navigator.clipboard || !navigator.clipboard.read) {
        setErrorMessage(
          'Press Ctrl+V (or Cmd+V on Mac) anywhere on this page to paste your copied image.'
        );
        return;
      }
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        const imageType = item.types.find((type) => type.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          const file = new File([blob], `clipboard_${Date.now()}.png`, {
            type: imageType,
          });
          setMode('image');
          await handleLoadImage(file);
          return;
        }
      }
      setErrorMessage(
        'No image found in clipboard. Copy an image first or press Ctrl+V.'
      );
    } catch {
      setErrorMessage(
        'Press Ctrl+V (or Cmd+V on Mac) directly on your keyboard to paste your image.'
      );
    }
  };

  // IDEA #1: Load Image from Direct URL
  const handleFetchImageUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const check = validateSafeImageUrl(imageUrlInput);
    if (!check.valid) {
      setErrorMessage(check.reason || 'Invalid URL.');
      return;
    }

    setIsLoadingUrl(true);
    try {
      const response = await fetch(imageUrlInput.trim(), { mode: 'cors' });
      if (!response.ok) {
        throw new Error(`Could not fetch image (HTTP ${response.status}).`);
      }
      const blob = await response.blob();
      const ext = blob.type.includes('webp')
        ? 'webp'
        : blob.type.includes('jpeg') || blob.type.includes('jpg')
        ? 'jpg'
        : 'png';
      const fetchedFile = new File([blob], `url_image_${Date.now()}.${ext}`, {
        type: blob.type || 'image/png',
      });
      setMode('image');
      setShowUrlBar(false);
      setImageUrlInput('');
      await handleLoadImage(fetchedFile);
    } catch {
      setErrorMessage(
        'This website blocks direct link fetching (CORS). Simply right-click the image, click "Copy Image", and press Ctrl+V here!'
      );
    } finally {
      setIsLoadingUrl(false);
    }
  };

  // Load Video File
  const handleLoadVideo = useCallback(
    async (file: File) => {
      setErrorMessage('');
      setShowFineTune(false);
      setCleanVideoOutput((prev) => {
        if (prev?.url) URL.revokeObjectURL(prev.url);
        return null;
      });
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);

      const audit = await verifyFileMagicBytes(file, 'video');
      if (!audit.valid) {
        setErrorMessage(
          audit.reason ||
            'Unsupported video file. Please upload a valid MP4, WebM, or MOV video.'
        );
        return;
      }

      const objUrl = URL.createObjectURL(file);
      setVideoFile(file);
      setVideoPreviewUrl(objUrl);

      const video = document.createElement('video');
      video.preload = 'auto';
      video.muted = true;
      video.playsInline = true;
      video.src = objUrl;

      try {
        await new Promise<void>((resolve, reject) => {
          video.onloadeddata = () => resolve();
          video.onerror = () => reject(new Error('Could not read video stream.'));
        });
        const duration = Number.isFinite(video.duration) ? video.duration : 0;
        setVidDuration(duration);
        try {
          video.currentTime = Math.min(0.5, duration ? duration * 0.2 : 0);
          await new Promise<void>((r) => {
            video.onseeked = () => r();
            setTimeout(r, 350);
          });
        } catch {
          // Ignore seek errors
        }

        const width = video.videoWidth || 1280;
        const height = video.videoHeight || 720;
        setVidDimensions({ width, height });

        if (imgEngine) {
          const offscreen = document.createElement('canvas');
          offscreen.width = width;
          offscreen.height = height;
          const ctx = offscreen.getContext('2d', { willReadFrequently: true })!;
          ctx.drawImage(video, 0, 0, width, height);
          const frameData = ctx.getImageData(0, 0, width, height);
          const det = detectVideoWatermarkCandidate(
            frameData,
            width,
            height,
            imgEngine.bg96
          );
          setVidTuner({
            gain: det.gain,
            offsetX: det.offsetX,
            offsetY: det.offsetY,
            sizeScale: det.sizeScale,
            polarity: 'white',
            mode: det.presetKey === 'sparkle' ? 'gemini' : 'veo',
          });
        }
      } catch (err) {
        console.error(err);
      }
    },
    [imgEngine, videoPreviewUrl]
  );

  // Handle File Selection (Supports 1 Photo, Multiple Bulk Photos, or Video)
  const handleFileSelect = async (
    files: FileList | null,
    forceBulkMode = false
  ) => {
    if (!files || files.length === 0) return;
    const arr = Array.from(files);

    // Check if video
    const first = arr[0];
    if (
      !forceBulkMode &&
      (first.type.startsWith('video/') || /\.(mp4|webm|mov)$/i.test(first.name))
    ) {
      setMode('video');
      await handleLoadVideo(first);
      return;
    }

    // Filter valid image candidates
    const imageFiles = arr.filter(
      (f) => f.type.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(f.name)
    );

    if (imageFiles.length === 0) {
      setErrorMessage('Please select valid PNG, JPG, WebP images or MP4/WebM videos.');
      return;
    }

    // If user is in Bulk tab, selected 2+ images, or forced bulk mode -> Bulk Queue (Idea #2)
    if (forceBulkMode || mode === 'bulk' || imageFiles.length > 1) {
      setMode('bulk');
      const newBulk: BulkPhotoItem[] = imageFiles.slice(0, 25).map((file) => ({
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        file,
        status: 'ready',
      }));
      setBulkItems((prev) => [...prev, ...newBulk]);
    } else {
      setMode('image');
      await handleLoadImage(imageFiles[0]);
    }
  };

  // Process Single Image (Button Click #1)
  const runImageWatermarkRemoval = useCallback(
    async (
      customTuner?: TunerOptions,
      customMime?: ImageFormatMime,
      customScale?: number
    ) => {
      if (!imgEngine || !imageBitmapData || !imageFile) return;
      setIsImageProcessing(true);
      try {
        const activeOpts = customTuner || imgTuner;
        const activeMime = customMime || exportMime;
        const activeScale = customScale || exportScale;

        const { blob, url, outWidth, outHeight } = await imgEngine.exportCleanImage(
          imageBitmapData,
          imgDimensions.width,
          imgDimensions.height,
          activeOpts,
          activeMime,
          activeScale
        );
        const ext =
          activeMime === 'image/png'
            ? 'png'
            : activeMime === 'image/webp'
            ? 'webp'
            : 'jpg';
        const suffix = stripAiMetadata ? 'klearpix_nometa_hd' : 'klearpix_hd';
        const cleanName = sanitizeFileName(imageFile.name, suffix, ext);
        const sizeKb = (blob.size / 1024).toFixed(1);
        setCleanImageOutput((prev) => {
          if (prev?.url) URL.revokeObjectURL(prev.url);
          return {
            url,
            fileName: cleanName,
            sizeKb,
            formatLabel: ext.toUpperCase(),
            outWidth,
            outHeight,
          };
        });
      } finally {
        setIsImageProcessing(false);
      }
    },
    [
      imgEngine,
      imageBitmapData,
      imageFile,
      imgDimensions,
      imgTuner,
      exportMime,
      exportScale,
      stripAiMetadata,
    ]
  );

  // Re-render Clean Image automatically when user changes Format, Scale, or Fine-Tune sliders after processing
  useEffect(() => {
    if (!cleanImageOutput || !imgEngine || !imageBitmapData || !imageFile) {
      return;
    }
    const timer = setTimeout(() => {
      runImageWatermarkRemoval(imgTuner, exportMime, exportScale);
    }, 100);
    return () => clearTimeout(timer);
  }, [imgTuner, exportMime, exportScale]);

  // IDEA #2: Run Bulk Photo Watermark Removal
  const runBulkWatermarkRemoval = async () => {
    if (!imgEngine || bulkItems.length === 0) return;
    setIsBulkProcessing(true);
    const updated = [...bulkItems];

    const ext =
      exportMime === 'image/png'
        ? 'png'
        : exportMime === 'image/webp'
        ? 'webp'
        : 'jpg';

    for (let i = 0; i < updated.length; i++) {
      if (updated[i].status === 'done') continue;
      updated[i] = { ...updated[i], status: 'processing' };
      setBulkItems([...updated]);

      try {
        const audit = await verifyFileMagicBytes(updated[i].file, 'image');
        if (!audit.valid) {
          throw new Error(audit.reason || 'Invalid file header');
        }
        const bmp = await createImageBitmap(updated[i].file);
        const w = bmp.width;
        const h = bmp.height;
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        const cx = c.getContext('2d')!;
        cx.drawImage(bmp, 0, 0);
        bmp.close();
        const data = cx.getImageData(0, 0, w, h);

        const det = detectWatermarkCandidate(data, w, h, imgEngine.bg96);
        const { blob, url, outWidth, outHeight } = await imgEngine.exportCleanImage(
          data,
          w,
          h,
          {
            gain: det.gain,
            offsetX: det.offsetX,
            offsetY: det.offsetY,
            sizeScale: det.sizeScale,
            polarity: 'white',
          },
          exportMime,
          exportScale
        );

        const cleanName = sanitizeFileName(
          updated[i].file.name,
          'klearpix_hd',
          ext
        );
        updated[i] = {
          ...updated[i],
          status: 'done',
          cleanUrl: url,
          cleanName,
          dimensions: `${outWidth}×${outHeight}`,
          sizeKb: (blob.size / 1024).toFixed(1),
        };
      } catch (e) {
        updated[i] = {
          ...updated[i],
          status: 'error',
          errorMsg: e instanceof Error ? e.message : 'Failed',
        };
      }
      setBulkItems([...updated]);
    }
    setIsBulkProcessing(false);
  };

  // Download All Processed Bulk Photos
  const handleDownloadAllBulk = () => {
    const doneItems = bulkItems.filter((item) => item.status === 'done' && item.cleanUrl);
    if (doneItems.length === 0) return;
    recordMonetizedAction(true);
    doneItems.forEach((item, index) => {
      setTimeout(() => {
        triggerLocalSave(item.cleanUrl!, item.cleanName!);
      }, index * 220);
    });
  };

  // Load 3 Demo Bulk Photos so user can test Bulk Mode in 1 click
  const handleTryBulkSample = async () => {
    if (!imgEngine) return;
    setMode('bulk');
    const [s1, s2, s3] = await Promise.all([
      generateSampleWatermarkedImage(imgEngine, 'gemini_portrait'),
      generateSampleWatermarkedImage(imgEngine, 'nano_architecture'),
      generateSampleWatermarkedImage(imgEngine, 'nanonets_product'),
    ]);
    const demoBulk: BulkPhotoItem[] = [s1, s2, s3].map((file, idx) => ({
      id: `sample-${idx}-${Date.now()}`,
      file,
      status: 'ready',
    }));
    setBulkItems(demoBulk);
  };

  // Process Video (Button Click #1)
  const runVideoWatermarkRemoval = async () => {
    if (!vidEngine || !videoFile) return;
    setErrorMessage('');
    setIsVideoProcessing(true);
    setVidProgress({ progress: 0.03, stage: 'Preparing lossless video pipeline...' });

    try {
      const res = await vidEngine.process(videoFile, {
        ...vidTuner,
        onProgress: (info) =>
          setVidProgress({
            progress: info.progress,
            stage: info.stage || 'Removing watermark frame-by-frame...',
          }),
      });
      const cleanName = sanitizeFileName(videoFile.name, 'klearpix_hd', res.ext);
      const sizeMb = (res.blob.size / (1024 * 1024)).toFixed(2);
      setCleanVideoOutput((prev) => {
        if (prev?.url) URL.revokeObjectURL(prev.url);
        return { url: res.url, fileName: cleanName, sizeMb };
      });
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Video processing failed. Please use Chrome or Edge desktop for hardware video encoding.'
      );
    } finally {
      setIsVideoProcessing(false);
    }
  };

  // Load Sample Image with 1 click
  const handleTrySampleImage = async () => {
    if (!imgEngine) return;
    setMode('image');
    const sample = await generateSampleWatermarkedImage(imgEngine, 'gemini_portrait');
    await handleLoadImage(sample);
  };

  // Render Private Admin Portal when visiting /admin or #/admin
  if (isAdminRoute) {
    return (
      <AdminPortal
        config={monetization}
        onUpdateConfig={setMonetization}
        onExitAdmin={() => {
          window.location.hash = '';
          if (window.location.pathname.toLowerCase().endsWith('/admin')) {
            window.history.pushState({}, '', '/');
          }
          setIsAdminRoute(false);
        }}
      />
    );
  }

  // Active Direct Links for Process & Download buttons
  const processAdUrl = monetization.enabled
    ? mode === 'video'
      ? monetization.videoExportAdUrl
      : monetization.imageDownloadAdUrl
    : undefined;

  const downloadAdUrl = monetization.enabled
    ? monetization.videoExportAdUrl || monetization.imageDownloadAdUrl
    : undefined;

  const completedBulkCount = bulkItems.filter((i) => i.status === 'done').length;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A] selection:bg-blue-600 selection:text-white">
      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={mode !== 'video'}
        accept={
          mode === 'video'
            ? 'video/mp4,video/webm,video/quicktime'
            : 'image/png,image/jpeg,image/webp'
        }
        className="hidden"
        onChange={(e) => {
          handleFileSelect(e.target.files, mode === 'bulk');
          e.target.value = '';
        }}
      />
      <input
        ref={bulkInputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          handleFileSelect(e.target.files, true);
          e.target.value = '';
        }}
      />

      {/* Clean Minimalist Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <a href="#" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-display font-extrabold text-xl tracking-tight text-slate-900">
              Klear<span className="text-blue-600">Pix</span>
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            <a href="#workspace" className="hover:text-slate-900 transition-colors">
              Watermark Remover
            </a>
            <a href="#all-features" className="hover:text-slate-900 transition-colors">
              All Features
            </a>
            <a
              href="#supported-models"
              className="hover:text-slate-900 transition-colors"
            >
              Supported AI
            </a>
            <a href="#faq" className="hover:text-slate-900 transition-colors">
              FAQ
            </a>
          </nav>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-blue-600 text-white font-display font-semibold text-xs transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload File</span>
          </button>
        </div>
      </header>

      {/* Main Simple & Fast Consumer Workspace */}
      <main
        id="workspace"
        className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 pt-9 pb-16"
      >
        {/* Clean Centered Hero */}
        <div className="text-center max-w-2xl mx-auto mb-7">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold mb-3.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>
              100% Original HD Quality · Zero Blur · AI Metadata Privacy Shield
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.12]">
            Remove Gemini, Veo & Nanonets Watermarks Instantly
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-600">
            Clean single photos, bulk image batches, or HD videos—while stripping hidden AI metadata and converting formats in one click.
          </p>
        </div>

        {/* ============================================================
            VISIBLE 3-MODE TOOL SELECTOR (So Users Immediately See All 3 Core Tools!)
           ============================================================ */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex flex-wrap justify-center gap-1 p-1.5 rounded-2xl bg-slate-200/75 border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setMode('image');
                setErrorMessage('');
              }}
              className={`inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-display font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                mode === 'image'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ImageIcon className="w-4 h-4 text-blue-600" />
              <span>Single Photo</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('bulk');
                setErrorMessage('');
              }}
              className={`inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-display font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                mode === 'bulk'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Bulk Photos (Up to 25)</span>
              {bulkItems.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-md bg-indigo-600 text-white text-[10px] font-mono">
                  {bulkItems.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('video');
                setErrorMessage('');
              }}
              className={`inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-display font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                mode === 'video'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Video className="w-4 h-4 text-emerald-600" />
              <span>HD Video Remover</span>
            </button>
          </div>
        </div>

        {/* Security / Format Error Message */}
        {errorMessage && (
          <div className="mb-6 rounded-2xl bg-red-50 border border-red-200 p-4 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="text-xs text-red-900">
                <p className="font-bold text-sm">Notice</p>
                <p className="mt-0.5 text-red-700">{errorMessage}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage('')}
              className="text-red-400 hover:text-red-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ============================================================
            MODE 1: SINGLE PHOTO WATERMARK REMOVER
           ============================================================ */}
        {mode === 'image' && (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-lg shadow-slate-900/[0.03] overflow-hidden">
            {!imageFile ? (
              <div className="p-6 sm:p-9">
                {/* Upload Dropzone */}
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleFileSelect(e.dataTransfer.files);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/30 rounded-2xl p-9 sm:p-12 text-center cursor-pointer transition-all group"
                >
                  <div className="w-15 h-15 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform">
                    <Upload className="w-7 h-7" />
                  </div>
                  <h2 className="font-display font-bold text-xl text-slate-900">
                    Click to Upload Photo or Drag & Drop
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Supports Gemini, Imagen 3, Nano Banana & Nanonets (PNG, JPG, WebP)
                  </p>
                  <div className="mt-5 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 group-hover:bg-blue-700 text-white font-display font-bold text-sm shadow-sm transition-colors">
                    <Upload className="w-4 h-4" />
                    <span>Select Photo</span>
                  </div>
                </div>

                {/* IDEA #1: Quick Action Bar -> Paste (Ctrl+V), Image URL, Bulk, or Sample */}
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={handleClipboardButtonClick}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                  >
                    <ClipboardPaste className="w-3.5 h-3.5 text-blue-600" />
                    <span>Paste Image (Ctrl+V)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowUrlBar(!showUrlBar)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                  >
                    <Link2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Paste Image URL</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('bulk')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100/80 text-xs font-semibold text-indigo-700 transition-colors cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Bulk Clean Multiple Photos</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleTrySampleImage}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100/80 text-xs font-semibold text-blue-700 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Try Sample Photo</span>
                  </button>
                </div>

                {/* Collapsible URL Input Bar */}
                {showUrlBar && (
                  <form
                    onSubmit={handleFetchImageUrl}
                    className="mt-4 flex flex-col sm:flex-row gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-200"
                  >
                    <input
                      type="url"
                      required
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      placeholder="https://example.com/gemini-image.png"
                      className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                    <button
                      type="submit"
                      disabled={isLoadingUrl}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-display font-bold text-xs transition-colors cursor-pointer shrink-0"
                    >
                      {isLoadingUrl ? 'Loading...' : 'Load Image URL'}
                    </button>
                  </form>
                )}

                {/* VISIBLE BUILT-IN POWER TOOLS BAR (So Users See Format, Scale & AI Metadata Shield Upfront!) */}
                <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                  <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50/90 border border-slate-200/70 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={stripAiMetadata}
                      onChange={(e) => setStripAiMetadata(e.target.checked)}
                      className="w-4 h-4 mt-0.5 accent-blue-600 rounded cursor-pointer"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                        <span>AI Metadata Shield</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                        Strips hidden EXIF & &quot;Made with AI&quot; C2PA tags
                      </p>
                    </div>
                  </label>

                  <div className="p-3 rounded-xl bg-slate-50/90 border border-slate-200/70">
                    <div className="text-xs font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
                      <span>Output Format</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      {(
                        [
                          { mime: 'image/png', label: 'PNG' },
                          { mime: 'image/webp', label: 'WebP' },
                          { mime: 'image/jpeg', label: 'JPG' },
                        ] as const
                      ).map((fmt) => (
                        <button
                          key={fmt.mime}
                          type="button"
                          onClick={() => setExportMime(fmt.mime)}
                          className={`py-1 rounded-md font-bold text-[11px] transition-colors cursor-pointer ${
                            exportMime === fmt.mime
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-slate-600 border border-slate-200'
                          }`}
                        >
                          {fmt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50/90 border border-slate-200/70">
                    <div className="text-xs font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
                      <Maximize2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Output Resolution</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {(
                        [
                          { scale: 1, label: '100% Native' },
                          { scale: 1.5, label: '1.5× Upscale' },
                        ] as const
                      ).map((sc) => (
                        <button
                          key={sc.scale}
                          type="button"
                          onClick={() => setExportScale(sc.scale)}
                          className={`py-1 rounded-md font-bold text-[11px] transition-colors cursor-pointer ${
                            exportScale === sc.scale
                              ? 'bg-slate-900 text-white'
                              : 'bg-white text-slate-600 border border-slate-200'
                          }`}
                        >
                          {sc.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* SINGLE IMAGE PREVIEW -> PROCESS BUTTON -> CLEAN OUTPUT & DOWNLOAD */
              <div className="p-6 sm:p-8 space-y-6">
                {/* Top File Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {imageFile?.name}
                      </p>
                      <p className="text-xs text-slate-500 tabular-nums">
                        {imgDimensions.width} × {imgDimensions.height} px · Original Resolution
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                    >
                      Change Photo
                    </button>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-red-50 hover:text-red-600 text-slate-500 transition-colors cursor-pointer"
                      title="Remove photo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Clean Image Display */}
                <div className="relative rounded-2xl bg-slate-950/5 border border-slate-200/80 p-3 flex items-center justify-center min-h-[280px] max-h-[500px] overflow-hidden">
                  <img
                    src={
                      cleanImageOutput && !showImageCompare
                        ? cleanImageOutput.url
                        : sourcePreviewUrl
                    }
                    alt="Preview"
                    className="max-w-full max-h-[460px] w-auto h-auto object-contain rounded-xl shadow-xs"
                  />

                  {/* Status Badge */}
                  <div className="absolute top-5 left-5 flex flex-wrap gap-2">
                    {cleanImageOutput ? (
                      <>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold shadow-sm">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {showImageCompare
                            ? 'Original (With Watermark)'
                            : 'Watermark Removed (HD)'}
                        </span>
                        {stripAiMetadata && !showImageCompare && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900/85 text-emerald-300 text-[11px] font-semibold backdrop-blur-xs">
                            <ShieldCheck className="w-3 h-3" />
                            AI EXIF/C2PA Stripped
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-xs text-white text-xs font-semibold">
                        Original Uploaded Photo
                      </span>
                    )}
                  </div>

                  {/* Simple Compare Original Toggle */}
                  {cleanImageOutput && (
                    <button
                      type="button"
                      onClick={() => setShowImageCompare(!showImageCompare)}
                      className="absolute bottom-5 right-5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-semibold backdrop-blur-xs transition-colors cursor-pointer"
                    >
                      {showImageCompare ? 'Show Clean Result' : 'Compare Original'}
                    </button>
                  )}
                </div>

                {/* IDEA #4 & #6: Options Strip */}
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={stripAiMetadata}
                      onChange={(e) => setStripAiMetadata(e.target.checked)}
                      className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                    />
                    <span>Strip Hidden AI Metadata (EXIF / C2PA Shield)</span>
                  </label>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex rounded-lg bg-white border border-slate-200 p-0.5">
                      {(
                        [
                          { mime: 'image/png', label: 'PNG' },
                          { mime: 'image/webp', label: 'WebP' },
                          { mime: 'image/jpeg', label: 'JPG' },
                        ] as const
                      ).map((fmt) => (
                        <button
                          key={fmt.mime}
                          type="button"
                          onClick={() => setExportMime(fmt.mime)}
                          className={`px-2.5 py-1 rounded-md font-bold text-[11px] transition-colors cursor-pointer ${
                            exportMime === fmt.mime
                              ? 'bg-blue-600 text-white'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {fmt.label}
                        </button>
                      ))}
                    </div>

                    <div className="inline-flex rounded-lg bg-white border border-slate-200 p-0.5">
                      {(
                        [
                          { scale: 1, label: '100% Size' },
                          { scale: 1.5, label: '1.5× HD' },
                        ] as const
                      ).map((sc) => (
                        <button
                          key={sc.scale}
                          type="button"
                          onClick={() => setExportScale(sc.scale)}
                          className={`px-2.5 py-1 rounded-md font-bold text-[11px] transition-colors cursor-pointer ${
                            exportScale === sc.scale
                              ? 'bg-slate-900 text-white'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {sc.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ACTION AREA */}
                {!cleanImageOutput ? (
                  <a
                    href={processAdUrl}
                    target={processAdUrl ? '_blank' : undefined}
                    rel="noopener noreferrer"
                    onClick={() => {
                      if (!isImageProcessing) {
                        recordMonetizedAction(false);
                        runImageWatermarkRemoval();
                      }
                    }}
                    className={`w-full py-4 px-6 rounded-2xl font-display font-bold text-base flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-md ${
                      isImageProcessing
                        ? 'bg-slate-400 text-white pointer-events-none'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'
                    }`}
                  >
                    {isImageProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Removing Watermark...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-5 h-5" />
                        <span>Remove Watermark Now</span>
                      </>
                    )}
                  </a>
                ) : (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="p-4 rounded-2xl bg-emerald-50/90 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3 text-center sm:text-left">
                        <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mx-auto sm:mx-0">
                          <Check className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-display font-bold text-base text-slate-900">
                            Watermark Removed Successfully!
                          </h3>
                          <p className="text-xs text-slate-600">
                            {cleanImageOutput.formatLabel} ({cleanImageOutput.sizeKb}{' '}
                            KB) · {cleanImageOutput.outWidth}×
                            {cleanImageOutput.outHeight}px
                            {stripAiMetadata ? ' · AI Metadata Cleaned' : ''}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          initiateFileDownload({
                            url: cleanImageOutput.url,
                            fileName: cleanImageOutput.fileName,
                            label: cleanImageOutput.fileName,
                            subLabel: `${cleanImageOutput.formatLabel} · ${cleanImageOutput.outWidth}×${cleanImageOutput.outHeight}px (${cleanImageOutput.sizeKb} KB)`,
                          })
                        }
                        className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-display font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer shrink-0"
                      >
                        <Download className="w-4 h-4" />
                        <span>
                          Download Clean {cleanImageOutput.formatLabel}
                        </span>
                      </button>
                    </div>

                    {/* Optional Collapsed Fine-Tune Accordion */}
                    <div className="border border-slate-200 rounded-2xl overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setShowFineTune(!showFineTune)}
                        className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/80 flex items-center justify-between text-xs font-semibold text-slate-600 transition-colors cursor-pointer"
                      >
                        <span className="inline-flex items-center gap-2">
                          <Sliders className="w-3.5 h-3.5 text-blue-600" />
                          <span>
                            Watermark still slightly visible? Click to fine-tune position
                          </span>
                        </span>
                        {showFineTune ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>

                      {showFineTune && (
                        <div className="p-4 bg-white space-y-4 border-t border-slate-200">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-slate-600">
                              Quick Position Preset:
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  setImgTuner(
                                    getAdaptiveImagePreset(
                                      'new',
                                      imgDimensions.width,
                                      imgDimensions.height
                                    )
                                  )
                                }
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-800 cursor-pointer"
                              >
                                Gemini / Nano
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setImgTuner(
                                    getAdaptiveImagePreset(
                                      'classic',
                                      imgDimensions.width,
                                      imgDimensions.height
                                    )
                                  )
                                }
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-800 cursor-pointer"
                              >
                                Imagen 3 Corner
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setImgTuner(
                                    getAdaptiveImagePreset(
                                      'nanonets',
                                      imgDimensions.width,
                                      imgDimensions.height
                                    )
                                  )
                                }
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-800 cursor-pointer"
                              >
                                Nanonets
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-600">
                                  Strength (Alpha Gain)
                                </span>
                                <span className="font-mono font-semibold">
                                  {imgTuner.gain.toFixed(2)}×
                                </span>
                              </div>
                              <input
                                type="range"
                                min="0.20"
                                max="1.60"
                                step="0.02"
                                value={imgTuner.gain}
                                onChange={(e) =>
                                  setImgTuner((p) => ({
                                    ...p,
                                    gain: parseFloat(e.target.value),
                                  }))
                                }
                                className="w-full"
                              />
                            </div>
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-600">Logo Size</span>
                                <span className="font-mono font-semibold">
                                  {Math.round(imgTuner.sizeScale * 100)}%
                                </span>
                              </div>
                              <input
                                type="range"
                                min="0.50"
                                max="2.00"
                                step="0.02"
                                value={imgTuner.sizeScale}
                                onChange={(e) =>
                                  setImgTuner((p) => ({
                                    ...p,
                                    sizeScale: parseFloat(e.target.value),
                                  }))
                                }
                                className="w-full"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ============================================================
            MODE 2: DEDICATED BULK MULTI-PHOTO CLEANER TAB (IDEA #2)
           ============================================================ */}
        {mode === 'bulk' && (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-lg shadow-slate-900/[0.03] overflow-hidden">
            {bulkItems.length === 0 ? (
              <div className="p-6 sm:p-10">
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleFileSelect(e.dataTransfer.files, true);
                  }}
                  onClick={() => bulkInputRef.current?.click()}
                  className="border-2 border-dashed border-indigo-300 hover:border-indigo-500 hover:bg-indigo-50/30 rounded-2xl p-10 sm:p-12 text-center cursor-pointer transition-all group"
                >
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform">
                    <Layers className="w-8 h-8" />
                  </div>
                  <h2 className="font-display font-bold text-xl text-slate-900">
                    Bulk Clean Up to 25 AI Photos at Once
                  </h2>
                  <p className="text-sm text-slate-500 mt-1.5 max-w-md mx-auto">
                    Select multiple Gemini, Imagen 3, Nano Banana, or Nanonets images together and remove all watermarks in one click.
                  </p>
                  <div className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 group-hover:bg-indigo-700 text-white font-display font-bold text-sm shadow-sm transition-colors">
                    <Upload className="w-4 h-4" />
                    <span>Select Multiple Photos</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
                  <span>Want to see how bulk mode works?</span>
                  <button
                    type="button"
                    onClick={handleTryBulkSample}
                    className="font-semibold text-indigo-600 hover:text-indigo-700 underline underline-offset-4 cursor-pointer"
                  >
                    Load 3 Sample AI Photos
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 sm:p-8 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="font-display font-bold text-base text-slate-900">
                        Bulk Watermark Queue ({bulkItems.length} Photos)
                      </h2>
                      <p className="text-xs text-slate-500">
                        {completedBulkCount} of {bulkItems.length} photos cleaned · AI Metadata Shield ON
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => bulkInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                    >
                      + Add More Photos
                    </button>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-red-50 hover:text-red-600 text-slate-500 transition-colors cursor-pointer"
                      title="Clear all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Format Selection Bar for Bulk */}
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
                  <span className="font-semibold text-slate-700">
                    Output Format for All Photos:
                  </span>
                  <div className="flex items-center gap-1.5">
                    {(
                      [
                        { mime: 'image/png', label: 'PNG (Lossless)' },
                        { mime: 'image/webp', label: 'WebP (Fast)' },
                        { mime: 'image/jpeg', label: 'JPG (Small)' },
                      ] as const
                    ).map((fmt) => (
                      <button
                        key={fmt.mime}
                        type="button"
                        onClick={() => setExportMime(fmt.mime)}
                        className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                          exportMime === fmt.mime
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white text-slate-600 border border-slate-200'
                        }`}
                      >
                        {fmt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bulk Queue List */}
                <div className="divide-y divide-slate-100 max-h-[340px] overflow-y-auto pr-1">
                  {bulkItems.map((item) => (
                    <div
                      key={item.id}
                      className="py-3 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {item.file.name}
                        </p>
                        <p className="text-xs text-slate-500 tabular-nums">
                          {item.dimensions
                            ? `${item.dimensions}px · ${item.sizeKb} KB · Clean HD`
                            : `${(item.file.size / 1024).toFixed(1)} KB`}
                        </p>
                      </div>

                      <div className="shrink-0">
                        {item.status === 'ready' && (
                          <span className="text-xs font-medium text-slate-400">
                            Ready
                          </span>
                        )}
                        {item.status === 'processing' && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Cleaning...
                          </span>
                        )}
                        {item.status === 'error' && (
                          <span className="text-xs font-semibold text-red-600">
                            {item.errorMsg}
                          </span>
                        )}
                        {item.status === 'done' && item.cleanUrl && (
                          <button
                            type="button"
                            onClick={() =>
                              initiateFileDownload({
                                url: item.cleanUrl!,
                                fileName: item.cleanName!,
                                label: item.cleanName!,
                                subLabel: `${item.dimensions}px · ${item.sizeKb} KB · AI Metadata Stripped`,
                              })
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Save</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bulk Primary Action Button */}
                {completedBulkCount < bulkItems.length ? (
                  <a
                    href={processAdUrl}
                    target={processAdUrl ? '_blank' : undefined}
                    rel="noopener noreferrer"
                    onClick={() => {
                      if (!isBulkProcessing) {
                        recordMonetizedAction(false);
                        runBulkWatermarkRemoval();
                      }
                    }}
                    className={`w-full py-4 px-6 rounded-2xl font-display font-bold text-base flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-md ${
                      isBulkProcessing
                        ? 'bg-slate-400 text-white pointer-events-none'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
                    }`}
                  >
                    {isBulkProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Cleaning All Photos...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-5 h-5" />
                        <span>
                          Remove Watermark from All ({bulkItems.length} Photos)
                        </span>
                      </>
                    )}
                  </a>
                ) : (
                  <a
                    href={downloadAdUrl}
                    target={downloadAdUrl ? '_blank' : undefined}
                    rel="noopener noreferrer"
                    onClick={handleDownloadAllBulk}
                    className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-display font-bold text-base flex items-center justify-center gap-2.5 shadow-md transition-colors cursor-pointer"
                  >
                    <Download className="w-5 h-5" />
                    <span>Download All {completedBulkCount} Clean Photos</span>
                  </a>
                )}
              </div>
            )}
          </div>
        )}

        {/* ============================================================
            MODE 3: SIMPLE VIDEO WATERMARK REMOVER CARD
           ============================================================ */}
        {mode === 'video' && (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-lg shadow-slate-900/[0.03] overflow-hidden">
            {!videoFile ? (
              /* Step 1: Clean Video Upload Box */
              <div className="p-6 sm:p-10">
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleFileSelect(e.dataTransfer.files);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/30 rounded-2xl p-10 sm:p-14 text-center cursor-pointer transition-all group"
                >
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform">
                    <Video className="w-8 h-8" />
                  </div>
                  <h2 className="font-display font-bold text-xl text-slate-900">
                    Click to Upload Video or Drag & Drop
                  </h2>
                  <p className="text-sm text-slate-500 mt-1.5">
                    Supports Gemini Omni, Google Flow, Veo 3 & Nanonets videos (MP4, WebM, MOV)
                  </p>
                  <div className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 group-hover:bg-emerald-700 text-white font-display font-bold text-sm shadow-sm transition-colors">
                    <Upload className="w-4 h-4" />
                    <span>Select Video</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Step 2 & 3: Video Preview -> Process Button -> Clean Output & Download */
              <div className="p-6 sm:p-8 space-y-6">
                {/* Top File Info */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                      <Video className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {videoFile.name}
                      </p>
                      <p className="text-xs text-slate-500 tabular-nums">
                        {vidDimensions.width} × {vidDimensions.height} px
                        {vidDuration > 0 ? ` · ${vidDuration.toFixed(1)}s` : ''} · Audio Preserved
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isVideoProcessing}
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                    >
                      Change Video
                    </button>
                    <button
                      type="button"
                      disabled={isVideoProcessing}
                      onClick={handleReset}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-red-50 hover:text-red-600 text-slate-500 transition-colors cursor-pointer"
                      title="Remove video"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Video Player */}
                <div className="relative rounded-2xl bg-slate-950 overflow-hidden">
                  <video
                    key={cleanVideoOutput ? cleanVideoOutput.url : videoPreviewUrl}
                    src={cleanVideoOutput ? cleanVideoOutput.url : videoPreviewUrl}
                    controls
                    className="w-full max-h-[420px] mx-auto block"
                  />
                  <div className="absolute top-4 left-4 pointer-events-none">
                    {cleanVideoOutput ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold shadow-sm">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Watermark Removed (HD Video)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 text-white text-xs font-semibold">
                        Original Uploaded Video
                      </span>
                    )}
                  </div>
                </div>

                {/* Video Action Area */}
                {!cleanVideoOutput ? (
                  <div className="space-y-4">
                    <a
                      href={processAdUrl}
                      target={processAdUrl ? '_blank' : undefined}
                      rel="noopener noreferrer"
                      onClick={() => {
                        if (!isVideoProcessing) {
                          recordMonetizedAction(false);
                          runVideoWatermarkRemoval();
                        }
                      }}
                      className={`w-full py-4 px-6 rounded-2xl font-display font-bold text-base flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-md ${
                        isVideoProcessing
                          ? 'bg-slate-800 text-white pointer-events-none'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                      }`}
                    >
                      {isVideoProcessing ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>
                            {vidProgress.stage || 'Removing Video Watermark...'}
                          </span>
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-5 h-5" />
                          <span>Remove Video Watermark Now</span>
                        </>
                      )}
                    </a>

                    {isVideoProcessing && (
                      <div className="space-y-1.5">
                        <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            style={{
                              width: `${Math.max(
                                4,
                                Math.round(vidProgress.progress * 100)
                              )}%`,
                            }}
                            className="h-full bg-emerald-600 transition-all duration-200"
                          />
                        </div>
                        <p className="text-center text-xs font-mono text-slate-500">
                          {Math.round(vidProgress.progress * 100)}% completed — keeping 100% original video & audio quality
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Video Output Ready -> Big Download Button */
                  <div className="p-4 rounded-2xl bg-emerald-50/90 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-200">
                    <div className="flex items-center gap-3 text-center sm:text-left">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mx-auto sm:mx-0">
                        <Check className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-base text-slate-900">
                          Clean Video Ready to Download!
                        </h3>
                        <p className="text-xs text-slate-600">
                          MP4 ({cleanVideoOutput.sizeMb} MB) · {vidDimensions.width}×
                          {vidDimensions.height}px · Audio Intact
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        initiateFileDownload({
                          url: cleanVideoOutput.url,
                          fileName: cleanVideoOutput.fileName,
                          label: cleanVideoOutput.fileName,
                          subLabel: `MP4 Video (${cleanVideoOutput.sizeMb} MB) · ${vidDimensions.width}×${vidDimensions.height}px`,
                        })
                      }
                      className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-display font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer shrink-0"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Clean Video</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ============================================================
          IDEA #7: SMART 3-SECOND "PREPARING YOUR HD FILE" AD MODAL
         ============================================================ */}
      {pendingDownload && (
        <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>100% Lossless HD Export</span>
              </div>
              <button
                type="button"
                onClick={() => setPendingDownload(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="font-display font-extrabold text-xl text-slate-900">
                {countdownLeft > 0
                  ? `Preparing Your Clean HD File (${countdownLeft}s)...`
                  : 'Your Clean HD File is Ready!'}
              </h3>
              <p className="text-xs text-slate-500 truncate px-2">
                {pendingDownload.label} · {pendingDownload.subLabel}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                style={{
                  width:
                    countdownLeft > 0
                      ? `${Math.max(
                          20,
                          100 -
                            (countdownLeft /
                              Math.max(
                                1,
                                monetization.interstitialCountdownSec || 3
                              )) *
                              100
                        )}%`
                      : '100%',
                }}
                className="h-full bg-emerald-600 transition-all duration-500"
              />
            </div>

            {/* Clean Sponsor / Partner Card inside the 3s Modal for Extra Revenue */}
            {monetization.enabled && processAdUrl && (
              <a
                href={processAdUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => recordMonetizedAction(false)}
                className="block p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 hover:border-blue-400 transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-blue-600">
                    Sponsored Partner keeps KlearPix 100% Free
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-blue-600 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-xs font-bold text-slate-900">
                  Explore Featured AI Creative Tools & High-Speed Cloud Resources →
                </p>
              </a>
            )}

            {/* Final Download Button (Triggers Direct Link #2 + Saves File) */}
            {countdownLeft > 0 ? (
              <button
                type="button"
                disabled
                className="w-full py-3.5 px-5 rounded-2xl bg-slate-200 text-slate-500 font-display font-bold text-sm flex items-center justify-center gap-2 cursor-not-allowed"
              >
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying Bit-Exact Stream ({countdownLeft}s)...</span>
              </button>
            ) : (
              <a
                href={downloadAdUrl}
                target={downloadAdUrl ? '_blank' : undefined}
                rel="noopener noreferrer"
                onClick={() => {
                  recordMonetizedAction(true);
                  triggerLocalSave(pendingDownload.url, pendingDownload.fileName);
                  setPendingDownload(null);
                }}
                className="w-full py-3.5 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-display font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Save Clean HD File to Device</span>
              </a>
            )}

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <Lock className="w-3 h-3" />
              <span>Processed 100% locally in your browser · Zero quality loss</span>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Feature Showcase, Supported Models & FAQ */}
      <InfoSections
        imgEngine={imgEngine}
        onSelectTab={(tab) => {
          setMode(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onTriggerAction={(action) => {
          if (action === 'paste') {
            setMode('image');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            handleClipboardButtonClick();
          } else if (action === 'url') {
            setMode('image');
            setShowUrlBar(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else if (action === 'bulk_demo') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            handleTryBulkSample();
          } else if (action === 'sample_image') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            handleTrySampleImage();
          }
        }}
      />
    </div>
  );
}
