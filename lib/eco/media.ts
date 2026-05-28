import type { StimulusAsset } from "@/lib/eco/types";

const youtubePathPrefixes = new Set(["embed", "live", "shorts", "v"]);

function cleanYoutubeId(value?: string | null) {
  const id = value?.trim();
  if (!id || !/^[A-Za-z0-9_-]{6,}$/.test(id)) return null;
  return id;
}

export function getYoutubeVideoId(rawUrl: string) {
  try {
    const url = new URL(rawUrl);
    const host = url.hostname.replace(/^(www\.|m\.)/, "");

    if (host === "youtu.be") {
      return cleanYoutubeId(url.pathname.split("/").filter(Boolean)[0]);
    }

    if (host === "youtube.com" || host === "youtube-nocookie.com") {
      const watchId = cleanYoutubeId(url.searchParams.get("v"));
      if (watchId) return watchId;

      const [prefix, id] = url.pathname.split("/").filter(Boolean);
      if (youtubePathPrefixes.has(prefix)) return cleanYoutubeId(id);
    }
  } catch {
    return null;
  }

  return null;
}

export function getYoutubeThumbnailUrl(rawUrl: string) {
  const videoId = getYoutubeVideoId(rawUrl);
  return videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null;
}

export function getPrimaryStimulusAsset(
  assets: StimulusAsset[],
  issueId: string,
) {
  const issueAssets = assets
    .filter((asset) => asset.issueId === issueId && asset.isPublished)
    .sort((left, right) => left.orderIndex - right.orderIndex);

  return (
    issueAssets.find((asset) => Boolean(getYoutubeThumbnailUrl(asset.url))) ??
    issueAssets.find((asset) => asset.assetType === "image") ??
    issueAssets[0]
  );
}
