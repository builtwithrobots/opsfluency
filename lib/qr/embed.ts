/**
 * Detects whether a URL belongs to a known embed-friendly provider and
 * rewrites it to the provider's official `/embed` form. Used by
 * `/app/external` so QR scans of YouTube and Loom links render inside
 * the worker PWA chrome instead of bouncing the user out to a new tab.
 *
 * Generic web pages stay unchanged — most sites set X-Frame-Options:
 * DENY, so the iframe will render blank in those cases. The wrapper
 * always shows an "Open in browser" fallback button to handle that.
 */

export type EmbedProvider = 'youtube' | 'loom' | 'vimeo' | 'generic';

export interface EmbedInfo {
  provider: EmbedProvider;
  /** URL to put in the iframe `src`. */
  embed_url: string;
  /** Original URL — useful for the "Open in browser" fallback. */
  original_url: string;
  /** Human host string for display chrome (e.g. "youtube.com"). */
  host: string;
}

const YOUTUBE_HOSTS = new Set(['youtube.com', 'm.youtube.com', 'music.youtube.com']);
const LOOM_HOSTS    = new Set(['loom.com']);
const VIMEO_HOSTS   = new Set(['vimeo.com', 'player.vimeo.com']);

function youTubeEmbed(id: string) {
  // youtube-nocookie.com is the privacy-enhanced domain — no tracking cookies.
  // rel=0 disables related-video carousel; modestbranding=1 hides YouTube logo.
  return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`;
}

function loomEmbed(id: string) {
  return `https://www.loom.com/embed/${id}`;
}

function vimeoEmbed(id: string) {
  return `https://player.vimeo.com/video/${id}`;
}

export function detectEmbed(rawUrl: string): EmbedInfo {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { provider: 'generic', embed_url: rawUrl, original_url: rawUrl, host: '' };
  }

  const host = parsed.hostname.toLowerCase().replace(/^www\./, '');

  // ── YouTube ────────────────────────────────────────────────────────────────
  if (YOUTUBE_HOSTS.has(host)) {
    const v = parsed.searchParams.get('v');
    if (v) return { provider: 'youtube', embed_url: youTubeEmbed(v), original_url: rawUrl, host };

    const shortsMatch = parsed.pathname.match(/^\/shorts\/([^/?]+)/);
    if (shortsMatch) return { provider: 'youtube', embed_url: youTubeEmbed(shortsMatch[1]), original_url: rawUrl, host };

    if (parsed.pathname.startsWith('/embed/')) {
      return { provider: 'youtube', embed_url: rawUrl, original_url: rawUrl, host };
    }
  }
  if (host === 'youtu.be') {
    const id = parsed.pathname.replace(/^\//, '').split('/')[0];
    if (id) return { provider: 'youtube', embed_url: youTubeEmbed(id), original_url: rawUrl, host };
  }

  // ── Loom ───────────────────────────────────────────────────────────────────
  if (LOOM_HOSTS.has(host)) {
    const shareMatch = parsed.pathname.match(/^\/share\/([^/?]+)/);
    if (shareMatch) return { provider: 'loom', embed_url: loomEmbed(shareMatch[1]), original_url: rawUrl, host };

    if (parsed.pathname.startsWith('/embed/')) {
      return { provider: 'loom', embed_url: rawUrl, original_url: rawUrl, host };
    }
  }

  // ── Vimeo ──────────────────────────────────────────────────────────────────
  if (VIMEO_HOSTS.has(host)) {
    // player.vimeo.com/video/ID — already in embed form
    if (parsed.pathname.startsWith('/video/')) {
      return { provider: 'vimeo', embed_url: rawUrl, original_url: rawUrl, host };
    }
    // vimeo.com/ID
    const m = parsed.pathname.match(/^\/(\d+)/);
    if (m) return { provider: 'vimeo', embed_url: vimeoEmbed(m[1]), original_url: rawUrl, host };
  }

  // ── Fall through: generic site, leave URL alone ────────────────────────────
  return { provider: 'generic', embed_url: rawUrl, original_url: rawUrl, host };
}
