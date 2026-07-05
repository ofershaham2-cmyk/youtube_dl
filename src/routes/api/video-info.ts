import { createFileRoute } from "@tanstack/react-router";

import { fetchVideoInfo } from "@/lib/downsub";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
    },
  });
}

export const Route = createFileRoute("/api/video-info")({
  server: {
    handlers: {
      OPTIONS: async () =>
        new Response(null, {
          status: 204,
          headers: {
            "access-control-allow-origin": "*",
            "access-control-allow-methods": "GET, OPTIONS",
            "access-control-allow-headers": "content-type",
          },
        }),
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const target = url.searchParams.get("url");
        if (!target) return json({ error: "Missing required query param: url" }, 400);
        try {
          const info = await fetchVideoInfo(target);
          return json({
            title: info.title,
            source: info.source,
            state: info.state,
            manualSubtitles: info.subtitles.map((s) => ({ code: s.code, name: s.name })),
            autoTranslatedSubtitles: info.subtitlesAutoTrans.map((s) => ({
              code: s.code,
              name: s.name,
            })),
          });
        } catch (err) {
          console.error("[/api/video-info] upstream failure:", err);
          return json(
            {
              error: "SUBTITLE_SERVICE_UNAVAILABLE",
              message: (err as Error).message || "Unknown error",
              fallback: true,
            },
            200,
          );
        }
      },
    },
  },
});