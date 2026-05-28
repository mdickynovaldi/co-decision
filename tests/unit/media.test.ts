import { describe, expect, it } from "vitest";

import {
  getPrimaryStimulusAsset,
  getYoutubeThumbnailUrl,
  getYoutubeVideoId,
} from "@/lib/eco/media";
import type { StimulusAsset } from "@/lib/eco/types";

describe("media helpers", () => {
  it.each([
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://youtu.be/dQw4w9WgXcQ?t=12", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/embed/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://m.youtube.com/shorts/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
  ])("reads the YouTube video id from %s", (url, videoId) => {
    expect(getYoutubeVideoId(url)).toBe(videoId);
  });

  it("builds a stable YouTube thumbnail URL", () => {
    expect(getYoutubeThumbnailUrl("https://youtu.be/dQw4w9WgXcQ")).toBe(
      "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    );
  });

  it("prefers the YouTube asset for the selected issue", () => {
    const assets: StimulusAsset[] = [
      {
        id: "document-asset",
        issueId: "issue-a",
        assetType: "document",
        title: "Dokumen",
        url: "https://example.com/document.pdf",
        orderIndex: 1,
        isPublished: true,
      },
      {
        id: "youtube-asset",
        issueId: "issue-a",
        assetType: "video",
        title: "Video",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        orderIndex: 2,
        isPublished: true,
      },
      {
        id: "other-issue",
        issueId: "issue-b",
        assetType: "video",
        title: "Video lain",
        url: "https://youtu.be/aaaaaaaaaaa",
        orderIndex: 1,
        isPublished: true,
      },
    ];

    expect(getPrimaryStimulusAsset(assets, "issue-a")?.id).toBe(
      "youtube-asset",
    );
  });
});
