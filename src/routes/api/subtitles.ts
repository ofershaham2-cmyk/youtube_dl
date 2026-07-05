import { createFileRoute } from "@tanstack/react-router";

import { fetchSubtitle, type SubtitleFormat } from "@/lib/downsub";

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

export const Route = createFileRoute("/api/subtitles")({
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
        const language = url.searchParams.get("language") ?? "en";
        const format = (url.searchParams.get("type") ?? "srt").toLowerCase() as SubtitleFormat;
        const download = url.searchParams.get("download") === "1";
        const includeAutoTrans = url.searchParams.get("autoTranslate") !== "0";

        if (!target) return json({ error: "Missing required query param: url" }, 400);
        if (!FORMATS.includes(format)) {
          return json(
            { error: `Invalid type. Must be one of: ${FORMATS.join(", ")}` },
            400,
          );
        }

        try {
          const result = await fetchSubtitle({
            videoUrlOrId: target,
            format,
            language,
            includeAutoTrans,
          });

          if (download) {
            const safeTitle = (result.title || "subtitle")
              .replace(/[^\w\s-]/g, "_")
              .slice(0, 80);
            return new Response(result.content, {
              status: 200,
              headers: {
                "content-type": "text/plain; charset=utf-8",
                "content-disposition": `attachment; filename="${safeTitle}.${result.language}.${result.format}"`,
                "access-control-allow-origin": "*",
              },
            });
          }
          return json(result);
        } catch (err) {
          const message = (err as Error).message || "Unknown error";
          console.error("[/api/subtitles] upstream failure:", err);
          return json(
            {
              error: "SUBTITLE_SERVICE_UNAVAILABLE",
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