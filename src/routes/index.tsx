import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [url, setUrl] = useState("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  const [type, setType] = useState<"srt" | "vtt" | "txt">("srt");
  const [language, setLanguage] = useState("en");
  const [videoId, setVideoId] = useState("dQw4w9WgXcQ");
  const [targetLanguage, setTargetLanguage] = useState("es");
  const [loading, setLoading] = useState(false);
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const [result, setResult] = useState<string>("");
  const [transcriptResult, setTranscriptResult] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [transcriptError, setTranscriptError] = useState<string>("");

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult("");
    try {
      const qs = new URLSearchParams({ url, type, language });
      const res = await fetch(`/api/subtitles?${qs.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setResult(data.content);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function runTranscriptAction(action: "supported" | "defaults" | "translate") {
    setTranscriptLoading(true);
    setTranscriptError("");
    setTranscriptResult("");
    try {
      const params = new URLSearchParams({ videoID: videoId });
      if (action === "translate") {
        params.set("language", language);
        params.set("targetLanguage", targetLanguage);
        params.set("type", type);
      }

      const endpoint =
        action === "supported"
          ? "/api/transcript-supported-languages"
          : action === "defaults"
            ? "/api/default-transcript-languages"
            : "/api/translate-transcript";

      const res = await fetch(`${endpoint}?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setTranscriptResult(JSON.stringify(data, null, 2));
    } catch (err) {
      setTranscriptError((err as Error).message);
    } finally {
      setTranscriptLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">DownSub Subtitle API</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Fetch YouTube subtitles by URL, format and language. See the full API at{" "}
            <a className="underline" href="/docs">/docs</a> (Swagger UI) or{" "}
            <a className="underline" href="/api/openapi.json">/api/openapi.json</a>.
          </p>
        </header>

        <form onSubmit={run} className="space-y-4 rounded-lg border p-6">
          <div>
            <label className="block text-sm font-medium">YouTube URL</label>
            <input
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Format</label>
              <select
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={type}
                onChange={(e) => setType(e.target.value as "srt" | "vtt" | "txt")}
              >
                <option value="srt">SRT</option>
                <option value="vtt">VTT</option>
                <option value="txt">TXT</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Language code</label>
              <input
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                placeholder="en"
                required
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {loading ? "Fetching…" : "Fetch subtitles"}
            </button>
            <a
              className="rounded-md border px-4 py-2 text-sm font-medium"
              href={`/api/subtitles?${new URLSearchParams({ url, type, language, download: "1" }).toString()}`}
            >
              Download file
            </a>
          </div>
        </form>

        {error && (
          <div className="mt-6 rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}
        {result && (
          <pre className="mt-6 max-h-[500px] overflow-auto rounded-md border bg-muted p-4 text-xs whitespace-pre-wrap">
            {result}
          </pre>
        )}

        <section className="mt-8 rounded-lg border p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Transcript endpoints</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Inspect available transcript languages or request a translated version.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium">Video ID</label>
              <input
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={videoId}
                onChange={(e) => setVideoId(e.target.value)}
                placeholder="dQw4w9WgXcQ"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Target language</label>
              <input
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                placeholder="es"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => runTranscriptAction("supported")}
              disabled={transcriptLoading}
              className="rounded-md border px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {transcriptLoading ? "Loading…" : "List supported languages"}
            </button>
            <button
              type="button"
              onClick={() => runTranscriptAction("defaults")}
              disabled={transcriptLoading}
              className="rounded-md border px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {transcriptLoading ? "Loading…" : "List default languages"}
            </button>
            <button
              type="button"
              onClick={() => runTranscriptAction("translate")}
              disabled={transcriptLoading}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {transcriptLoading ? "Translating…" : "Translate transcript"}
            </button>
          </div>

          {transcriptError && (
            <div className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
              {transcriptError}
            </div>
          )}
          {transcriptResult && (
            <pre className="mt-4 max-h-[400px] overflow-auto rounded-md border bg-muted p-4 text-xs whitespace-pre-wrap">
              {transcriptResult}
            </pre>
          )}
        </section>
      </div>
    </div>
  );
}
