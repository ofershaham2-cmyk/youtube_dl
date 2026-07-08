import { afterEach, describe, expect, it, vi } from "vitest";

import { Route as subtitlesRoute } from "../src/routes/api/subtitles";
import { Route as playlistRoute } from "../src/routes/api/playlist";
import { Route as videoInfoRoute } from "../src/routes/api/video-info";
import { Route as openApiRoute } from "../src/routes/api/openapi[.]json";
import { Route as transcriptSupportedRoute } from "../src/routes/api/transcript-supported-languages";
import { Route as defaultTranscriptRoute } from "../src/routes/api/default-transcript-languages";
import { Route as translateTranscriptRoute } from "../src/routes/api/translate-transcript";

const originalFetch = globalThis.fetch;

afterEach(() => {
  vi.restoreAllMocks();
  globalThis.fetch = originalFetch;
});

describe("API endpoints", () => {
  it("returns a 400 for subtitles without a url", async () => {
    const response = await subtitlesRoute.options.server?.handlers.GET!({ request: new Request("http://localhost/api/subtitles") } as never);
    expect(response.status).toBe(400);
  });

  it("documents the playlist endpoint in the OpenAPI spec", async () => {
    const response = await openApiRoute.options.server?.handlers.GET!({ request: new Request("http://localhost/api/openapi.json") } as never);
    const spec = await response.json();

    expect(response.status).toBe(200);
    expect(spec.paths["/api/playlist"]).toBeDefined();
  });

  it("returns video info metadata for a valid request", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        state: 200,
        title: "demo",
        subtitles: [{ code: "en", name: "English", url: "manual" }],
        subtitlesAutoTrans: [],
      }),
    } as Response);

    const response = await videoInfoRoute.options.server?.handlers.GET!({ request: new Request("http://localhost/api/video-info?url=dQw4w9WgXcQ") } as never);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.title).toBe("demo");
  });

  it("returns supported transcript languages", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        state: 200,
        title: "demo",
        subtitles: [{ code: "en", name: "English", url: "manual" }],
        subtitlesAutoTrans: [{ code: "fr", name: "French", url: "auto" }],
      }),
    } as Response);

    const response = await transcriptSupportedRoute.options.server?.handlers.GET!({ request: new Request("http://localhost/api/transcript-supported-languages?videoID=dQw4w9WgXcQ") } as never);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual([
      { code: "en", name: "English", source: "manual", isDefault: false },
      { code: "fr", name: "French", source: "auto", isDefault: false },
    ]);
  });

  it("returns default transcript languages", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        state: 200,
        title: "demo",
        subtitles: [{ code: "en", name: "English", url: "manual", isDefault: true }],
        subtitlesAutoTrans: [{ code: "fr", name: "French", url: "auto" }],
      }),
    } as Response);

    const response = await defaultTranscriptRoute.options.server?.handlers.GET!({ request: new Request("http://localhost/api/default-transcript-languages?videoID=dQw4w9WgXcQ") } as never);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual([{ code: "en", name: "English", source: "manual", isDefault: true }]);
  });

  it("translates a transcript when asked", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          state: 200,
          title: "demo",
          subtitles: [{ code: "en", name: "English", url: "manual" }],
          subtitlesAutoTrans: [],
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        text: async () => "translated subtitle",
      } as Response);

    const response = await translateTranscriptRoute.options.server?.handlers.GET!({
      request: new Request("http://localhost/api/translate-transcript?videoID=dQw4w9WgXcQ&language=en&targetLanguage=es&type=srt"),
    } as never);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.translatedLanguage).toBe("es");
    expect(payload.content).toBe("translated subtitle");
  });
});
