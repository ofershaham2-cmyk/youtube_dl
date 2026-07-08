import { describe, expect, it, vi } from "vitest";

import {
  buildSubtitleDownloadUrl,
  extractPlaylistVideoIds,
  fetchVideoInfo,
  getDefaultTranscriptLanguages,
  getTranscriptSupportedLanguages,
  pickSubtitle,
} from "./downsub";

describe("downsub helpers", () => {
  it("builds a subtitle download URL with translation params", () => {
    const url = buildSubtitleDownloadUrl({
      subtitleUrl: "abc",
      format: "srt",
      title: "demo",
      language: "en",
      firstLanguage: "en",
      secondLanguage: "es",
      defaultLanguage: "en",
    });

    expect(url).toContain("firstLanguage=en");
    expect(url).toContain("secondLanguage=es");
    expect(url).toContain("defaultLanguage=en");
  });

  it("selects a subtitle from available manual and auto-translated entries", () => {
    const info = {
      state: 200,
      title: "demo",
      subtitles: [{ code: "en", name: "English", url: "manual" }],
      subtitlesAutoTrans: [{ code: "fr", name: "French", url: "auto" }],
      raw: {},
    };

    expect(pickSubtitle(info, "en")).toEqual({ entry: info.subtitles[0], isAutoTrans: false });
    expect(pickSubtitle(info, "fr")).toEqual({ entry: info.subtitlesAutoTrans[0], isAutoTrans: true });
  });

  it("returns the supported and default transcript languages from video info", () => {
    const info = {
      state: 200,
      title: "demo",
      subtitles: [{ code: "en", name: "English", url: "manual" }],
      subtitlesAutoTrans: [{ code: "fr", name: "French", url: "auto" }],
      raw: {
        subtitles: [{ code: "en", name: "English", url: "manual", isDefault: true }],
      },
    };

    expect(getTranscriptSupportedLanguages(info as never)).toEqual([
      { code: "en", name: "English", source: "manual", isDefault: false },
      { code: "fr", name: "French", source: "auto", isDefault: false },
    ]);

    expect(getDefaultTranscriptLanguages(info as never)).toEqual([
      { code: "en", name: "English", source: "manual", isDefault: true },
    ]);
  });
});

describe("extractPlaylistVideoIds", () => {
  it("extracts unique video IDs from a playlist page", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      text: async () => '<html><a href="/watch?v=abc123def45">one</a><a href="https://www.youtube.com/watch?v=abc123def45">dup</a><a href="https://www.youtube.com/watch?v=xyz987zyx54">two</a></html>',
    } as Response);

    const ids = await extractPlaylistVideoIds("https://www.youtube.com/playlist?list=PL123");

    expect(ids).toEqual(["abc123def45", "xyz987zyx54"]);
    expect(fetchSpy).toHaveBeenCalled();
  });
});

describe("fetchVideoInfo", () => {
  it("retries when the DownSub info endpoint returns a transient 503", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({}),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          state: 200,
          title: "demo",
          subtitles: [{ code: "en", name: "English", url: "manual" }],
          subtitlesAutoTrans: [],
        }),
      } as Response);

    const info = await fetchVideoInfo("https://www.youtube.com/watch?v=dQw4w9WgXcQ");

    expect(info.title).toBe("demo");
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("extracts a video ID and calls the DownSub info endpoint", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        state: 200,
        title: "demo",
        subtitles: [{ code: "en", name: "English", url: "manual" }],
        subtitlesAutoTrans: [],
      }),
    } as Response);

    const info = await fetchVideoInfo("https://www.youtube.com/watch?v=dQw4w9WgXcQ");

    expect(info.title).toBe("demo");
    expect(fetchSpy).toHaveBeenCalled();
  });
});
