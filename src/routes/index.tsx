import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [url, setUrl] = useState("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  const [type, setType] = useState<"srt" | "vtt" | "txt">("srt");
  const [language, setLanguage] = useState("en");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState<string>("");

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
      </div>
    </div>
  );
}
