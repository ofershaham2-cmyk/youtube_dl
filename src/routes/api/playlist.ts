import { createFileRoute } from "@tanstack/react-router";

import { fetchSubtitle, extractPlaylistVideoIds, type SubtitleFormat } from "@/lib/downsub";

const FORMATS: SubtitleFormat[] = ["srt", "vtt", "txt"];

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
    },
  });
}

export const Route = createFileRoute("/api/playlist")({
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
        const target = url.searchParams.get("playlist") ?? url.searchParams.get("url");
        const language = url.searchParams.get("language") ?? "en";
        const format = (url.searchParams.get("type") ?? "srt").toLowerCase() as SubtitleFormat;
        const includeAutoTrans = url.searchParams.get("autoTranslate") !== "0";

        if (!target) return json({ error: "Missing required query param: playlist" }, 400);
        if (!FORMATS.includes(format)) {
          return json(
            { error: `Invalid type. Must be one of: ${FORMATS.join(", ")}` },
            400,
          );
        }

        try {
          const videoIds = await extractPlaylistVideoIds(target);
          const results = [] as Array<{
            videoId: string;
            title: string;
            language: string;
            content: string;
            format: SubtitleFormat;
            error?: string;
          }>;

          for (const videoId of videoIds) {
            try {
              const result = await fetchSubtitle({
                videoUrlOrId: videoId,
                format,
                language,
                includeAutoTrans,
              });
              results.push({
                videoId,
                title: result.title,
                language: result.language,
                content: result.content,
                format: result.format,
              });
            } catch (err) {
              results.push({
                videoId,
                title: "",
                language,
                content: "",
                format,
                error: (err as Error).message || "Unknown error",
              });
            }
          }

          return json({ playlist: target, language, format, results });
        } catch (err) {
          const message = (err as Error).message || "Unknown error";
          console.error("[/api/playlist] upstream failure:", err);
          return json(
            {
              error: "PLAYLIST_SERVICE_UNAVAILABLE",
              message,
              fallback: true,
              hint:
                "DownSub blocks requests from Cloudflare Worker IPs. Run downsub_crawler as a self-hosted proxy and point this endpoint at it.",
            },
            200,
          );
        }
      },
    },
  },
});
