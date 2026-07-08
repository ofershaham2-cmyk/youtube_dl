import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/openapi.json")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = new URL(request.url).origin;
        const spec = {
          openapi: "3.0.3",
          info: {
            title: "DownSub Subtitle API",
            version: "1.0.0",
            description:
              "Fetch YouTube subtitles by URL, type (srt/vtt/txt) and language. Ports the DownSub crawler flow (https://github.com/btroops/downsub_crawler) to a TanStack Start server.",
          },
          servers: [{ url: origin }],
          paths: {
            "/api/video-info": {
              get: {
                summary: "List available subtitle tracks for a YouTube video",
                parameters: [
                  {
                    name: "url",
                    in: "query",
                    required: true,
                    schema: { type: "string" },
                    description: "YouTube video URL or 11-char video ID",
                    example: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                  },
                ],
                responses: {
                  "200": { description: "Video info with manual + auto-translated tracks" },
                  "400": { description: "Missing url parameter" },
                  "502": { description: "Upstream DownSub error" },
                },
              },
            },
            "/api/transcript-supported-languages": {
              get: {
                summary: "List supported transcript languages for a YouTube video",
                parameters: [
                  {
                    name: "videoID",
                    in: "query",
                    required: true,
                    schema: { type: "string" },
                    description: "YouTube video ID",
                    example: "dQw4w9WgXcQ",
                  },
                ],
                responses: {
                  "200": { description: "Supported transcript languages" },
                  "400": { description: "Missing videoID parameter" },
                  "502": { description: "Upstream DownSub error" },
                },
              },
            },
            "/api/default-transcript-languages": {
              get: {
                summary: "List the default transcript languages for a YouTube video",
                parameters: [
                  {
                    name: "videoID",
                    in: "query",
                    required: true,
                    schema: { type: "string" },
                    description: "YouTube video ID",
                    example: "dQw4w9WgXcQ",
                  },
                ],
                responses: {
                  "200": { description: "Default transcript languages" },
                  "400": { description: "Missing videoID parameter" },
                  "502": { description: "Upstream DownSub error" },
                },
              },
            },
            "/api/translate-transcript": {
              get: {
                summary: "Translate a transcript for a YouTube video",
                parameters: [
                  {
                    name: "videoID",
                    in: "query",
                    required: true,
                    schema: { type: "string" },
                    description: "YouTube video ID",
                    example: "dQw4w9WgXcQ",
                  },
                  {
                    name: "language",
                    in: "query",
                    required: false,
                    schema: { type: "string", default: "en" },
                    description: "Source transcript language",
                  },
                  {
                    name: "targetLanguage",
                    in: "query",
                    required: true,
                    schema: { type: "string" },
                    description: "Target translation language",
                    example: "es",
                  },
                  {
                    name: "type",
                    in: "query",
                    required: false,
                    schema: { type: "string", enum: ["srt", "vtt", "txt"], default: "srt" },
                    description: "Subtitle file format",
                  },
                ],
                responses: {
                  "200": { description: "Translated transcript content" },
                  "400": { description: "Missing videoID or targetLanguage parameter" },
                  "502": { description: "Upstream DownSub error" },
                },
              },
            },
            "/api/playlist": {
              get: {
                summary: "Fetch subtitle tracks for every video in a YouTube playlist",
                parameters: [
                  {
                    name: "playlist",
                    in: "query",
                    required: true,
                    schema: { type: "string" },
                    description: "YouTube playlist URL or playlist ID",
                    example: "https://www.youtube.com/playlist?list=PLWQv2HCp7bQva9vVwfZspuwBG1imP4HkI",
                  },
                  {
                    name: "type",
                    in: "query",
                    required: false,
                    schema: { type: "string", enum: ["srt", "vtt", "txt"], default: "srt" },
                    description: "Subtitle file format",
                  },
                  {
                    name: "language",
                    in: "query",
                    required: false,
                    schema: { type: "string", default: "en" },
                    description: "Language code (e.g. en, es, fr, zh-CN)",
                  },
                  {
                    name: "autoTranslate",
                    in: "query",
                    required: false,
                    schema: { type: "string", enum: ["0", "1"], default: "1" },
                    description: "Allow YouTube auto-translated tracks as a fallback",
                  },
                ],
                responses: {
                  "200": { description: "Playlist subtitle results for each discovered video" },
                  "400": { description: "Bad request" },
                  "502": { description: "Upstream DownSub error" },
                },
              },
            },
            "/api/subtitles": {
              get: {
                summary: "Fetch a subtitle track as JSON or file download",
                parameters: [
                  {
                    name: "url",
                    in: "query",
                    required: true,
                    schema: { type: "string" },
                    description: "YouTube video URL or 11-char video ID",
                    example: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                  },
                  {
                    name: "type",
                    in: "query",
                    required: false,
                    schema: { type: "string", enum: ["srt", "vtt", "txt"], default: "srt" },
                    description: "Subtitle file format",
                  },
                  {
                    name: "language",
                    in: "query",
                    required: false,
                    schema: { type: "string", default: "en" },
                    description: "Language code (e.g. en, es, fr, zh-CN)",
                  },
                  {
                    name: "autoTranslate",
                    in: "query",
                    required: false,
                    schema: { type: "string", enum: ["0", "1"], default: "1" },
                    description: "Allow YouTube auto-translated tracks as a fallback",
                  },
                  {
                    name: "download",
                    in: "query",
                    required: false,
                    schema: { type: "string", enum: ["0", "1"], default: "0" },
                    description: "If 1, respond with a file download instead of JSON",
                  },
                ],
                responses: {
                  "200": { description: "Subtitle content (JSON or plain text)" },
                  "400": { description: "Bad request" },
                  "502": { description: "Upstream DownSub error" },
                },
              },
            },
          },
        };
        return new Response(JSON.stringify(spec, null, 2), {
          status: 200,
          headers: {
            "content-type": "application/json; charset=utf-8",
            "access-control-allow-origin": "*",
          },
        });
      },
    },
  },
});