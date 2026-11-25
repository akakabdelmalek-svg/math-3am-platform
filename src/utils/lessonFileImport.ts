import JSZip from 'jszip';
import type { CourseAttachmentKind, CourseAttachmentMeta } from '../types/math.ts';

export const MAX_FIRESTORE_ATTACHMENT_BYTES = 6_200_000;
export const ATTACHMENT_CHUNK_CHARS = 650_000;

export function dataUrlToObjectUrl(dataUrl: string, fallbackMime = 'application/octet-stream'): string | null {
  try {
    const commaIdx = dataUrl.indexOf(',');
    if (commaIdx === -1 || !dataUrl.startsWith('data:')) return null;
    const header = dataUrl.slice(5, commaIdx);
    const body = dataUrl.slice(commaIdx + 1);
    const mime = header.split(';')[0] || fallbackMime;
    const isBase64 = header.includes(';base64');
    const binary = isBase64 ? atob(body) : decodeURIComponent(body);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: mime });
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

export function splitDataUrlChunks(dataUrl: string, chunkChars = ATTACHMENT_CHUNK_CHARS): string[] {
  if (!dataUrl) return [];
  const chunks: string[] = [];
  for (let i = 0; i < dataUrl.length; i += chunkChars) {
    chunks.push(dataUrl.slice(i, i + chunkChars));
  }
  return chunks;
}

export interface PendingLessonAttachment {
  meta: CourseAttachmentMeta;
  dataUrl: string;
}

export interface ImportedLessonFileResult {
  fileKind: CourseAttachmentKind;
  attachment?: PendingLessonAttachment;
  extractedText?: string;
  warning?: string;
}

export function detectLessonFileKind(fileName: string, mimeType = ''): CourseAttachmentKind {
  const lowerName = (fileName || '').toLowerCase();
  const lowerMime = (mimeType || '').toLowerCase();

  if (
    /\.(jpe?g|png|webp|gif)$/i.test(lowerName) ||
    lowerMime.startsWith('image/')
  ) {
    return 'image';
  }
  if (lowerName.endsWith('.pdf') || lowerMime === 'application/pdf') {
    return 'pdf';
  }
  if (
    /\.(docx?|odt)$/i.test(lowerName) ||
    lowerMime.includes('wordprocessingml') ||
    lowerMime.includes('msword')
  ) {
    return 'word';
  }
  if (
    /\.(pptx?|odp)$/i.test(lowerName) ||
    lowerMime.includes('presentationml') ||
    lowerMime.includes('powerpoint')
  ) {
    return 'powerpoint';
  }
  return 'other';
}

export function formatFileSizeArabic(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 ك.ب';
  if (bytes < 1024) return `${bytes} بايت`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} ك.ب`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} م.ب`;
}

function decodeXmlEntities(raw: string): string {
  return raw
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

export function extractTextFromDocxXml(xmlString: string): string {
  if (!xmlString) return '';
  const paragraphs = xmlString.split(/<\/w:p>/i);
  const lines: string[] = [];

  for (const para of paragraphs) {
    const matches = Array.from(para.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/gi));
    if (matches.length === 0) continue;
    const text = decodeXmlEntities(matches.map((m) => m[1]).join('')).trim();
    if (text) lines.push(text);
  }
  return lines.join('\n').trim();
}

export function extractTextFromPptxSlideXml(xmlString: string): string {
  if (!xmlString) return '';
  const paragraphs = xmlString.split(/<\/a:p>/i);
  const lines: string[] = [];

  for (const para of paragraphs) {
    const matches = Array.from(para.matchAll(/<a:t[^>]*>([\s\S]*?)<\/a:t>/gi));
    if (matches.length === 0) continue;
    const text = decodeXmlEntities(matches.map((m) => m[1]).join('')).trim();
    if (text) lines.push(text);
  }
  return lines.join('\n').trim();
}

async function extractDocxOrPptxText(
  file: File,
  kind: 'word' | 'powerpoint'
): Promise<string> {
  try {
    const buffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(buffer);
    if (kind === 'word') {
      const docXml = await zip.file('word/document.xml')?.async('string');
      return docXml ? extractTextFromDocxXml(docXml).slice(0, 3500) : '';
    }

    const slideNames = Object.keys(zip.files)
      .filter((name) => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
      .sort((a, b) => {
        const na = Number(a.match(/slide(\d+)\.xml/i)?.[1] || 0);
        const nb = Number(b.match(/slide(\d+)\.xml/i)?.[1] || 0);
        return na - nb;
      });

    const slideTexts: string[] = [];
    for (let i = 0; i < slideNames.length; i++) {
      const xml = await zip.file(slideNames[i])?.async('string');
      if (!xml) continue;
      const text = extractTextFromPptxSlideXml(xml);
      if (text) {
        slideTexts.push(`الشريحة ${i + 1}:\n${text}`);
      }
    }
    return slideTexts.join('\n\n').slice(0, 3500);
  } catch {
    return '';
  }
}

function readBlobAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('تعذر قراءة الملف.'));
    reader.readAsDataURL(blob);
  });
}

async function compressImageForFirestore(file: File): Promise<{ dataUrl: string; sizeBytes: number; mimeType: string }> {
  const rawDataUrl = await readBlobAsDataUrl(file);
  if (file.size <= 350_000) {
    return {
      dataUrl: rawDataUrl,
      sizeBytes: file.size,
      mimeType: file.type || 'image/jpeg',
    };
  }

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('تعذر معالجة الصورة.'));
    el.src = rawDataUrl;
  });

  const maxW = 1280;
  const scale = img.width > maxW ? maxW / img.width : 1;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return { dataUrl: rawDataUrl, sizeBytes: file.size, mimeType: file.type || 'image/jpeg' };
  }
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  let quality = 0.8;
  let dataUrl = canvas.toDataURL('image/jpeg', quality);
  while (dataUrl.length > 850_000 && quality > 0.4) {
    quality -= 0.15;
    dataUrl = canvas.toDataURL('image/jpeg', quality);
  }

  const approxBytes = Math.round((dataUrl.length * 3) / 4);
  return {
    dataUrl,
    sizeBytes: approxBytes,
    mimeType: 'image/jpeg',
  };
}

export async function processLessonImportFile(file: File): Promise<ImportedLessonFileResult> {
  const fileKind = detectLessonFileKind(file.name, file.type);
  const attId = `att_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  if (fileKind === 'image') {
    const compressed = await compressImageForFirestore(file);
    if (compressed.dataUrl.length > 940_000) {
      return {
        fileKind,
        warning: `الصورة "${file.name}" كبيرة جداً بعد الضغط. يرجى اختيار صورة أصغر.`,
      };
    }
    return {
      fileKind,
      attachment: {
        meta: {
          id: attId,
          fileName: file.name.slice(0, 180),
          fileKind: 'image',
          mimeType: compressed.mimeType,
          sizeBytes: compressed.sizeBytes,
        },
        dataUrl: compressed.dataUrl,
      },
    };
  }

  let extractedText = '';
  if ((fileKind === 'word' || fileKind === 'powerpoint') && /\.(docx|pptx)$/i.test(file.name)) {
    extractedText = await extractDocxOrPptxText(file, fileKind);
  } else if (/\.(txt|md|csv)$/i.test(file.name) && file.size <= 300_000) {
    extractedText = (await file.text()).slice(0, 3500);
  }

  if (file.size <= MAX_FIRESTORE_ATTACHMENT_BYTES) {
    const dataUrl = await readBlobAsDataUrl(file);
    return {
      fileKind,
      extractedText: extractedText || undefined,
      attachment: {
        meta: {
          id: attId,
          fileName: file.name.slice(0, 180),
          fileKind,
          mimeType: file.type || 'application/octet-stream',
          sizeBytes: file.size,
        },
        dataUrl,
      },
    };
  }

  return {
    fileKind,
    extractedText: extractedText || undefined,
    warning: extractedText
      ? `تم استخراج النص من "${file.name}" إلى ملخص الدرس، لكن حجم الملف (${formatFileSizeArabic(file.size)}) يتجاوز الحد الأقصى (6.2 م.ب) — يمكنك إرفاق رابطه عبر Google Drive.`
      : `حجم الملف "${file.name}" (${formatFileSizeArabic(file.size)}) يتجاوز الحد الأقصى (6.2 م.ب). يمكنك ضغطه أو إرفاق رابطه في خانة PDF / Drive.`,
  };
}
