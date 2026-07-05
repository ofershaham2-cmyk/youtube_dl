import CryptoJS from "crypto-js";

// Hardcoded key reverse-engineered from DownSub frontend.
const DEFAULT_KEY = "zthxw34cdp6wfyxmpad38v52t3hsz6c5";

const API_INFO = "https://get-info.downsub.com/";
const API_SUBTITLE = "https://subtitle.downsub.com/";

export type SubtitleFormat = "srt" | "vtt" | "txt";

export interface SubtitleEntry {
  name: string;
  code: string;
  url: string;
}

export interface VideoInfo {
  state: number;
  title: string;
  source?: string;
  subtitles: SubtitleEntry[];
  subtitlesAutoTrans: SubtitleEntry[];
  urlEncrypt?: string;
  raw: unknown;
}

function base64url(input: string): string {
  // input is a binary string
  return btoa(input).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * CryptoJS-compatible AES encryption, wrapped as DownSub expects:
 * 1. JSON.stringify the plaintext (adds quotes)
 * 2. AES-256-CBC via OpenSSL EVP_BytesToKey (crypto-js default)
 * 3. Serialize as {ct, iv, s} JSON
 * 4. base64url-encode
 */
export function encryptId(plaintext: string, key: string = DEFAULT_KEY): string {
  const wrapped = JSON.stringify(plaintext);
  const encrypted = CryptoJS.AES.encrypt(wrapped, key);
  const payload = {
    ct: encrypted.ciphertext.toString(CryptoJS.enc.Base64),
    iv: encrypted.iv.toString(CryptoJS.enc.Hex),
    s: encrypted.salt.toString(CryptoJS.enc.Hex),
  };
  return base64url(JSON.stringify(payload));
}

/** Extract the 11-char YouTube video ID from most common URL shapes. */
export function extractVideoId(input: string): string | null {
  const s = input.trim();
  // Bare ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;
  try {
    const u = new URL(s);
    if (u.hostname === "youtu.be") {
      const id = u.pathname.slice(1).split("/")[0];
      return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }
    if (/(^|\.)youtube\.com$/.test(u.hostname)) {
      const v = u.searchParams.get("v");
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
      const parts = u.pathname.split("/").filter(Boolean);
      const idx = parts.findIndex((p) => p === "shorts" || p === "embed" || p === "v");
      if (idx >= 0 && parts[idx + 1] && /^[a-zA-Z0-9_-]{11}$/.test(parts[idx + 1])) {
        return parts[idx + 1];
      }
    }
  } catch {
    // fallthrough
  }
  return null;
}

export async function fetchVideoInfo(videoUrlOrId: string): Promise<VideoInfo> {
  const videoId = extractVideoId(videoUrlOrId);
  if (!videoId) throw new Error("Could not extract a YouTube video ID from input");
  const encrypted = encryptId(videoId);
  const res = await fetch(API_INFO + encrypted, {
    signal: AbortSignal.timeout(10_000),
    headers: {
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      accept: "application/json, text/plain, */*",
      origin: "https://downsub.com",
      referer: "https://downsub.com/",
    },
  });
  if (!res.ok) throw new Error(`DownSub info API returned HTTP ${res.status}`);
  const raw = (await res.json()) as {
    state?: number;
    title?: string;
    source?: string;
    subtitles?: SubtitleEntry[];
    subtitlesAutoTrans?: SubtitleEntry[];
    urlEncrypt?: string;
  };
  return {
    state: raw.state ?? 3,
    title: raw.title ?? "",
    source: raw.source,
    subtitles: raw.subtitles ?? [],
    subtitlesAutoTrans: raw.subtitlesAutoTrans ?? [],
    urlEncrypt: raw.urlEncrypt,
    raw,
  };
}

export function buildSubtitleDownloadUrl(params: {
  subtitleUrl: string;
  format: SubtitleFormat;
  title: string;
  language?: string;
}): string {
  const { subtitleUrl, format, title, language } = params;
  let base = `${API_SUBTITLE}${format}/`;
  if (subtitleUrl) base += `${subtitleUrl}/`;
  const qs = new URLSearchParams();
  qs.set("title", title || "subtitle");
  if (language) qs.set("language", language);
  return `${base}?${qs.toString()}`;
}

export function pickSubtitle(
  info: VideoInfo,
  language: string,
  opts: { includeAutoTrans?: boolean } = {},
): { entry: SubtitleEntry; isAutoTrans: boolean } | null {
  const norm = language.toLowerCase();
  const match = (e: SubtitleEntry) =>
    e.code?.toLowerCase() === norm || e.name?.toLowerCase() === norm;
  const manual = info.subtitles.find(match);
  if (manual) return { entry: manual, isAutoTrans: false };
  if (opts.includeAutoTrans !== false) {
    const auto = info.subtitlesAutoTrans.find(match);
    if (auto) return { entry: auto, isAutoTrans: true };
  }
  return null;
}

export async function fetchSubtitle(params: {
  videoUrlOrId: string;
  format: SubtitleFormat;
  language: string;
  includeAutoTrans?: boolean;
}): Promise<{
  title: string;
  format: SubtitleFormat;
  language: string;
  languageName: string;
  isAutoTranslated: boolean;
  downloadUrl: string;
  content: string;
}> {
  const info = await fetchVideoInfo(params.videoUrlOrId);
  if (info.state === 3) throw new Error("DownSub could not process this video");
  const picked = pickSubtitle(info, params.language, {
    includeAutoTrans: params.includeAutoTrans,
  });
  if (!picked) {
    const available = [
      ...info.subtitles.map((s) => s.code),
      ...info.subtitlesAutoTrans.map((s) => `${s.code} (auto)`),
    ];
    throw new Error(
      `No subtitle for language "${params.language}". Available: ${available.join(", ") || "none"}`,
    );
  }
  const languageParam = picked.isAutoTrans ? picked.entry.code : undefined;
  const downloadUrl = buildSubtitleDownloadUrl({
    subtitleUrl: picked.entry.url,
    format: params.format,
    title: info.title || "subtitle",
    language: languageParam,
  });
  const res = await fetch(downloadUrl, {
    signal: AbortSignal.timeout(10_000),
    headers: {
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      referer: "https://downsub.com/",
    },
  });
  if (!res.ok) throw new Error(`Subtitle download failed: HTTP ${res.status}`);
  const content = await res.text();
  return {
    title: info.title,
    format: params.format,
    language: picked.entry.code,
    languageName: picked.entry.name,
    isAutoTranslated: picked.isAutoTrans,
    downloadUrl,
    content,
  };
}