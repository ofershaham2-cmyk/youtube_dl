#!/usr/bin/env node
import { fetchSubtitle, extractPlaylistVideoIds, type SubtitleFormat } from "../lib/downsub";

function printUsage(): void {
  console.error("Usage: npm run playlist -- --playlist <playlist-url-or-id> [--language en] [--type srt]");
}

function parseArgs(argv: string[]): { playlist?: string; language: string; type: SubtitleFormat } {
  const parsed: { playlist?: string; language: string; type: SubtitleFormat } = {
    language: "en",
    type: "srt",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--playlist") {
      parsed.playlist = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === "--language") {
      parsed.language = argv[i + 1] ?? parsed.language;
      i += 1;
      continue;
    }
    if (arg === "--type") {
      parsed.type = (argv[i + 1] ?? parsed.type).toLowerCase() as SubtitleFormat;
      i += 1;
      continue;
    }
    if (!arg.startsWith("--") && !parsed.playlist) {
      parsed.playlist = arg;
    }
  }

  return parsed;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (!args.playlist) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  const format = args.type.toLowerCase() as SubtitleFormat;
  if (!(["srt", "vtt", "txt"] as SubtitleFormat[]).includes(format)) {
    console.error(`Unsupported format: ${args.type}`);
    process.exitCode = 1;
    return;
  }

  try {
    const videoIds = await extractPlaylistVideoIds(args.playlist);
    if (videoIds.length === 0) {
      console.error("No videos were found in the provided playlist.");
      process.exitCode = 1;
      return;
    }

    for (const videoId of videoIds) {
      try {
        const result = await fetchSubtitle({
          videoUrlOrId: videoId,
          format,
          language: args.language,
        });
        console.log(`===== ${result.title || videoId} =====`);
        console.log(result.content);
        console.log();
      } catch (error) {
        console.error(`Failed for video ${videoId}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

main();
