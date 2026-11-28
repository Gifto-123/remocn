// Converts public/narration/<id>/<id>.json (whisper.cpp JSON with token timestamps)
// into public/narration/<id>/<id>.captions.json (Remotion Caption[]).
//
//   npm run captions            -> every folder in public/narration
//   npm run captions -- scene1  -> only scene1
import {existsSync, readdirSync, readFileSync, statSync, writeFileSync} from "node:fs";
import path from "node:path";
import {toCaptions} from "@remotion/install-whisper-cpp";

const root = path.join(process.cwd(), "public", "narration");
const only = process.argv[2];

const ids = only
  ? [only]
  : readdirSync(root).filter((name) => statSync(path.join(root, name)).isDirectory());

for (const id of ids) {
  const input = path.join(root, id, `${id}.json`);
  if (!existsSync(input)) {
    console.warn(`skip ${id}: ${path.relative(process.cwd(), input)} not found`);
    continue;
  }

  const whisperCppOutput = JSON.parse(readFileSync(input, "utf8"));
  const {captions} = toCaptions({whisperCppOutput});

  const output = path.join(root, id, `${id}.captions.json`);
  writeFileSync(output, JSON.stringify(captions, null, 2));
  console.log(`${id}: ${captions.length} captions -> ${path.relative(process.cwd(), output)}`);
}
