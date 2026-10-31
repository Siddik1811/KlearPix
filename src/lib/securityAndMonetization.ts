export interface SecurityAuditResult {
  valid: boolean;
  detectedFormat: string;
  signatureHex: string;
  reason?: string;
}

const MAX_IMAGE_BYTES = 50 * 1024 * 1024; // 50 MB max image size (DoS protection)
const MAX_VIDEO_BYTES = 300 * 1024 * 1024; // 300 MB max video size (DoS protection)

/**
 * Strips SQL Injection (' OR 1=1, UNION SELECT, --), XSS (<script>, javascript:),
 * and HTML/command injection characters from any user text input.
 */
export function sanitizeUserTextInput(input: string, maxLength = 250): string {
  if (!input) return '';
  return input
    .replace(/[<>"'`;&|\\]/g, '')
    .replace(/\b(SELECT|UNION|INSERT|UPDATE|DELETE|DROP|ALTER|EXEC|SCRIPT|ALERT)\b/gi, '')
    .replace(/--/g, '')
    .trim()
    .slice(0, maxLength);
}

/**
 * Inspects the binary magic bytes of an uploaded file to prevent disguised executables (.exe, ELF),
 * polyglot malware payloads, PHP/HTML shells, or script-injected SVG files from being processed.
 */
export async function verifyFileMagicBytes(
  file: File,
  expectedCategory: 'image' | 'video'
): Promise<SecurityAuditResult> {
  try {
    // 1. DoS / Zip-Bomb File Size Guard
    const maxBytes = expectedCategory === 'image' ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
    if (file.size <= 0 || file.size > maxBytes) {
      return {
        valid: false,
        detectedFormat: 'Size Limit Exceeded',
        signatureHex: 'SIZE_BLOCK',
        reason: `File size exceeds safe memory limit (${
          expectedCategory === 'image' ? '50 MB' : '300 MB'
        }).`,
      };
    }

    const slice = file.slice(0, 32);
    const buffer = await slice.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const hex = Array.from(bytes.slice(0, 8))
      .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
      .join(' ');

    if (bytes.length < 8) {
      return {
        valid: false,
        detectedFormat: 'Unknown',
        signatureHex: hex,
        reason: 'File is too small or corrupted.',
      };
    }

    // 2. Explicit Malware / Executable / Script Signature Firewall
    // Windows EXE / DLL (MZ: 4D 5A)
    if (bytes[0] === 0x4d && bytes[1] === 0x5a) {
      return {
        valid: false,
        detectedFormat: 'Malware / Executable Blocked',
        signatureHex: hex,
        reason: 'Security Alert: Windows executable (.exe/.dll) disguised as media file was blocked.',
      };
    }

    // Linux ELF Binary (7F 45 4C 46)
    if (
      bytes[0] === 0x7f &&
      bytes[1] === 0x45 &&
      bytes[2] === 0x4c &&
      bytes[3] === 0x46
    ) {
      return {
        valid: false,
        detectedFormat: 'ELF Binary Blocked',
        signatureHex: hex,
        reason: 'Security Alert: Executable binary payload blocked.',
      };
    }

    // Check ASCII prefix for disguised HTML / SVG / PHP / JS scripts (<script, <?php, <svg, <!DOCTYPE)
    const asciiHeader = String.fromCharCode(...bytes.slice(0, 24)).toLowerCase();
    if (
      asciiHeader.includes('<script') ||
      asciiHeader.includes('<?php') ||
      asciiHeader.includes('<svg') ||
      asciiHeader.includes('<!doctype') ||
      asciiHeader.includes('<html')
    ) {
      return {
        valid: false,
        detectedFormat: 'Script Payload Blocked',
        signatureHex: hex,
        reason: 'Security Alert: Script or SVG/HTML injection file blocked.',
      };
    }

    if (expectedCategory === 'image') {
      // PNG: 89 50 4E 47 0D 0A 1A 0A
      const isPng =
        bytes[0] === 0x89 &&
        bytes[1] === 0x50 &&
        bytes[2] === 0x4e &&
        bytes[3] === 0x47;
      if (isPng) {
        return { valid: true, detectedFormat: 'PNG (Lossless Raster)', signatureHex: hex };
      }

      // JPEG: FF D8 FF
      const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
      if (isJpeg) {
        return { valid: true, detectedFormat: 'JPEG (Verified DCT)', signatureHex: hex };
      }

      // WebP: RIFF....WEBP (52 49 46 46 ... 57 45 42 50)
      const isRiff =
        bytes[0] === 0x52 &&
        bytes[1] === 0x49 &&
        bytes[2] === 0x46 &&
        bytes[3] === 0x46;
      const isWebp =
        bytes[8] === 0x57 &&
        bytes[9] === 0x45 &&
        bytes[10] === 0x42 &&
        bytes[11] === 0x50;
      if (isRiff && isWebp) {
        return { valid: true, detectedFormat: 'WebP (RIFF Container)', signatureHex: hex };
      }

      return {
        valid: false,
        detectedFormat: 'Rejected Payload',
        signatureHex: hex,
        reason:
          'Unsupported or unsafe file header. Only genuine PNG, JPG, and WebP raster files are permitted.',
      };
    } else {
      // Video checks:
      const boxType = String.fromCharCode(bytes[4], bytes[5], bytes[6], bytes[7]);
      if (['ftyp', 'moov', 'wide', 'mdat', 'free'].includes(boxType)) {
        return {
          valid: true,
          detectedFormat: `ISO Base Media (${boxType.toUpperCase()} / MP4-MOV)`,
          signatureHex: hex,
        };
      }

      // WebM / Matroska: 1A 45 DF A3
      const isEbml =
        bytes[0] === 0x1a &&
        bytes[1] === 0x45 &&
        bytes[2] === 0xdf &&
        bytes[3] === 0xa3;
      if (isEbml) {
        return { valid: true, detectedFormat: 'WebM (EBML Container)', signatureHex: hex };
      }

      return {
        valid: false,
        detectedFormat: 'Rejected Stream',
        signatureHex: hex,
        reason:
          'Invalid video container header. Only genuine MP4, WebM, and MOV streams are allowed.',
      };
    }
  } catch {
    return {
      valid: false,
      detectedFormat: 'Error',
      signatureHex: '00',
      reason: 'Could not read binary header for security verification.',
    };
  }
}

export function sanitizeFileName(rawName: string, suffix: string, ext: string): string {
  const base = rawName.replace(/\.[^/.]+$/, '');
  const clean = base.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 60) || 'media';
  return `${clean}_${suffix}.${ext}`;
}

export interface MonetizationConfig {
  enabled: boolean;
  networkName: 'Monetag' | 'Adsterra' | 'Custom Direct Link';
  imageDownloadAdUrl: string;
  videoExportAdUrl: string;
  triggerMode: 'every_download' | 'once_per_session' | 'interstitial_gate';
  smartCountdownModal: boolean;
  interstitialCountdownSec: number;
  totalAdTriggers: number;
  totalDownloads: number;
}

const STORAGE_KEY = 'clearmark_monetization_v2';
const ADMIN_CRED_KEY = 'clearmark_admin_creds_v1';
const ADMIN_SESSION_KEY = 'clearmark_admin_session_v1';

export const DEFAULT_MONETIZATION_CONFIG: MonetizationConfig = {
  enabled: true,
  networkName: 'Monetag',
  imageDownloadAdUrl: 'https://uplcm.com/4/12158181',
  videoExportAdUrl: 'https://uplcm.com/4/12158178',
  triggerMode: 'every_download',
  smartCountdownModal: true,
  interstitialCountdownSec: 3,
  totalAdTriggers: 0,
  totalDownloads: 0,
};

export function validateSafeImageUrl(rawUrl: string): { valid: boolean; reason?: string } {
  try {
    const cleaned = rawUrl.trim();
    if (/javascript:|data:|vbscript:|file:/i.test(cleaned)) {
      return { valid: false, reason: 'Unsafe script protocol blocked.' };
    }
    const parsed = new URL(cleaned);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return { valid: false, reason: 'Only HTTP/HTTPS URLs are allowed.' };
    }
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host.startsWith('192.168.') ||
      host.startsWith('10.') ||
      host.startsWith('172.16.') ||
      host.endsWith('.internal') ||
      host.endsWith('.local')
    ) {
      return { valid: false, reason: 'Private or local network URLs are blocked (SSRF Shield).' };
    }
    return { valid: true };
  } catch {
    return { valid: false, reason: 'Please enter a valid HTTPS URL.' };
  }
}

export function loadMonetizationConfig(): MonetizationConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_MONETIZATION_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_MONETIZATION_CONFIG,
      ...parsed,
      imageDownloadAdUrl: validateSafeImageUrl(parsed.imageDownloadAdUrl || '').valid
        ? parsed.imageDownloadAdUrl
        : DEFAULT_MONETIZATION_CONFIG.imageDownloadAdUrl,
      videoExportAdUrl: validateSafeImageUrl(parsed.videoExportAdUrl || '').valid
        ? parsed.videoExportAdUrl
        : DEFAULT_MONETIZATION_CONFIG.videoExportAdUrl,
    };
  } catch {
    return DEFAULT_MONETIZATION_CONFIG;
  }
}

export function saveMonetizationConfig(config: MonetizationConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Ignore storage errors
  }
}

export interface AdminCredentials {
  adminId: string;
  password: string;
}

export const DEFAULT_ADMIN_CREDENTIALS: AdminCredentials = {
  adminId: 'Admin',
  password: 'Siddikkhan_1811',
};

export function loadAdminCredentials(): AdminCredentials {
  try {
    const raw = localStorage.getItem(ADMIN_CRED_KEY);
    if (!raw) return DEFAULT_ADMIN_CREDENTIALS;
    const parsed = JSON.parse(raw);
    if (parsed?.adminId && parsed?.password) return parsed;
    return DEFAULT_ADMIN_CREDENTIALS;
  } catch {
    return DEFAULT_ADMIN_CREDENTIALS;
  }
}

export function saveAdminCredentials(creds: AdminCredentials): void {
  try {
    localStorage.setItem(
      ADMIN_CRED_KEY,
      JSON.stringify({
        adminId: sanitizeUserTextInput(creds.adminId, 64),
        password: creds.password.slice(0, 128),
      })
    );
  } catch {
    // Ignore storage errors
  }
}

export function isAdminLoggedIn(): boolean {
  try {
    return sessionStorage.getItem(ADMIN_SESSION_KEY) === 'authenticated';
  } catch {
    return false;
  }
}

export function setAdminLoggedIn(status: boolean): void {
  try {
    if (status) {
      sessionStorage.setItem(ADMIN_SESSION_KEY, 'authenticated');
    } else {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}
