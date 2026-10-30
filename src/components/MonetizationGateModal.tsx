import React from 'react';
import { Download, ExternalLink, ShieldCheck, X, CheckCircle2 } from 'lucide-react';
import { MonetizationConfig } from '../lib/securityAndMonetization';

interface MonetizationGateModalProps {
  isOpen: boolean;
  mediaType: 'image' | 'video';
  fileName: string;
  resolutionText: string;
  downloadUrl: string;
  config: MonetizationConfig;
  onClose: () => void;
  onCompleteDownload: () => void;
}

export const MonetizationGateModal: React.FC<MonetizationGateModalProps> = ({
  isOpen,
  mediaType,
  fileName,
  resolutionText,
  downloadUrl,
  config,
  onClose,
  onCompleteDownload,
}) => {
  if (!isOpen) return null;

  const targetAdUrl =
    mediaType === 'image' ? config.imageDownloadAdUrl : config.videoExportAdUrl;

  const triggerFileSave = () => {
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onCompleteDownload();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-ready-title"
    >
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-700">
                100% Lossless Quality Preserved
              </p>
              <h3
                id="export-ready-title"
                className="text-lg font-bold text-slate-900"
              >
                Your Clean {mediaType === 'image' ? 'Image' : 'MP4 Video'} is Ready
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">File Name:</span>
            <span className="font-mono font-medium text-slate-800 truncate max-w-[210px]">
              {fileName}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Original Resolution:</span>
            <span className="font-mono font-semibold text-emerald-700 tabular-nums">
              {resolutionText}
            </span>
          </div>
        </div>

        <div className="space-y-2.5">
          {/* Clicking this anchor opens the Direct Link in a new tab AND saves the lossless file */}
          <a
            href={targetAdUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              triggerFileSave();
            }}
            className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-xs whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            <span>
              Download Cleaned {mediaType === 'image' ? 'Image' : 'Video'} Now
            </span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </a>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Processed 100% locally in your browser with zero quality loss</span>
        </div>
      </div>
    </div>
  );
};
