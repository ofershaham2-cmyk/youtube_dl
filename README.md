https://github.com/btroops/downsub_crawler

To actually get subtitles back, you have two realistic paths:

Run downsub_crawler as a small Python service on a residential/uncontested host (Render, Fly.io) and I'll swap the fetch to proxy it — CF bypass tooling (FlareSolverr, cloudscraper) does not run on Cloudflare Workers.
Switch to a source that doesn't cloak, e.g. YouTube's timedtext endpoint or a hosted RapidAPI subtitle provider.

https://dashboard.render.com/web/srv-d94p5req1p3s73c3n08g

https://youtube-dl-jrte.onrender.com/

https://b0a5483b-2a0b-4a85-8be4-b826cbbc969e.lovableproject.com/api/subtitles?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DdQw4w9WgXcQ&type=srt&language=en
https://youtube-dl-jrte.onrender.com/api/subtitles?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DdQw4w9WgXcQ&type=srt&language=en

CLI playlist entrypoint:

npm run playlist -- --playlist "https://www.youtube.com/playlist?list=YOUR_PLAYLIST_ID" [--language en] [--type srt]
