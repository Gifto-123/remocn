#!/usr/bin/env node
/**
 * export-sfx.mjs — CLI offline renderer for Remotion Whiteboard SFX.
 *
 * Reads a composition (.ts/.tsx exporting `ITEMS`) or JSON scene spec, extracts
 * coordinate/timestamp telemetry via `extractMotionTrace`, mixes optional
 * recorded `.wav` foley samples from `--foley-dir` (with Modal DSP fallback),
 * and writes a 48 kHz / 16-bit stereo mastered WAV (plus optional stems/trace).
 *
 * Usage:
 *   npm run export-sfx -- --from src/compositions/MasterAudioDemo.tsx --out public/audio/master-demo.wav --stems
 */

import fs from "node:fs";
import Module, {createRequire} from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const ts = require("typescript");

// Stub ESM-only browser/UI packages that aren't needed during headless audio export.
const origLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === "@remotion/media" || request === "@remotion/transitions") {
    return new Proxy(
      {},
      {
        get: (_, prop) => (prop === "__esModule" ? true : () => null),
      },
    );
  }
  return origLoad.call(this, request, parent, isMain);
};

// Register an in-process TS/TSX loader so extensionless imports in src/ work cleanly.
const loadTs = (module, filename) => {
  const norm = filename.replace(/\\/g, "/");
  // Compositions often import `../whiteboard/fonts` for Google Font side-effects;
  // skip browser font loading in headless Node audio export.
  if (norm.endsWith("/whiteboard/fonts.ts")) {
    module.exports = {};
    return;
  }
  const src = fs.readFileSync(filename, "utf8");
  const {outputText} = ts.transpileModule(src, {
    fileName: filename,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
    },
  });
  module._compile(outputText, filename);
};
require.extensions[".ts"] = loadTs;
require.extensions[".tsx"] = loadTs;

const args = process.argv.slice(2);
const flag = (name, fallback = undefined) => {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1) return fallback;
  const val = args[idx + 1];
  return val && !val.startsWith("--") ? val : "true";
};
const hasFlag = (name) => args.includes(`--${name}`);

if (hasFlag("help") || args.length === 0) {
  console.log(`
Usage:
  npm run export-sfx -- --from <composition.tsx | scene.json> [options]

Options:
  --from <path>        TS/TSX exporting ITEMS or SCENES (or JSON spec). Required.
  --out <path>         Output master WAV path (default: public/audio/sfx-master.wav)
  --aspect <ratio>     16:9 (1920x1080) or 9:16 (1080x1920)
  --preset <name>      youtubeLong, youtubeLong60, youtubeLong4k, youtubeShort
  --width <px>         Override viewport width
  --height <px>        Override viewport height
  --foley-dir <dir>    Directory with optional marker.wav, eraser.wav, whoosh.wav, pop.wav, ping.wav, penTap.wav
  --stems              Also export -draw.wav, -motion.wav, -accents.wav
  --trace              Also export -trace.json motion telemetry
  --seed <n>           Random seed (default: 1)
  --master <n>         Master volume multiplier (default: 1)
  --fps <n>            Override FPS (default: auto or 30)
  --delay <n>          Override scene start frame (default: auto or 0)
`);
  process.exit(0);
}

const fromArg = flag("from");
if (!fromArg) {
  console.error("Missing required --from <path> argument.");
  process.exit(1);
}

const cwd = process.cwd();
const fromPath = path.resolve(cwd, fromArg);
const outPath = path.resolve(
  cwd,
  flag("out", "public/audio/sfx-master.wav"),
);
const foleyDir = flag("foley-dir");
const exportStems = hasFlag("stems");
const exportTrace = hasFlag("trace");
const seed = Number(flag("seed", "1"));
const master = Number(flag("master", "1"));

const {
  CANVAS_PRESETS,
  presetForAspect,
  extractMotionTrace,
  extractMultiSceneTrace,
  renderMasterAudio,
  decodeWavBytes,
  encodeWavBytes,
} = require(path.resolve(cwd, "src/whiteboard/index.ts"));

// Load scene spec from JSON or TS/TSX module
let spec = {};
if (fromPath.endsWith(".json")) {
  spec = JSON.parse(fs.readFileSync(fromPath, "utf8"));
} else {
  const mod = require(fromPath);
  const pickExport = (suffix, fallback) => {
    const key = Object.keys(mod).find((k) => k.endsWith(suffix));
    return key !== undefined ? mod[key] : fallback;
  };
  spec = {
    scenes: mod.SCENES ?? mod.scenes,
    items: mod.ITEMS ?? mod.SCENE_ITEMS ?? mod.items,
    delay: mod.DELAY ?? mod.delay ?? 0,
    fps: pickExport("_FPS", 30),
    viewportWidth: pickExport("_WIDTH", undefined),
    viewportHeight: pickExport("_HEIGHT", undefined),
    totalFrames: pickExport("_DURATION", undefined),
    cameraKeyframes: mod.KEYFRAMES ?? mod.cameraKeyframes,
  };
}

const hasScenes = Array.isArray(spec.scenes) && spec.scenes.length > 0;
const hasItems = Array.isArray(spec.items) && spec.items.length > 0;
if (!hasScenes && !hasItems) {
  console.error(
    `No ITEMS or SCENES array found in ${fromArg}. Export \`ITEMS\` / \`SCENES\` or provide JSON.`,
  );
  process.exit(1);
}

const presetFlag = flag("preset");
const aspectFlag = flag("aspect");
const presetObj = presetFlag
  ? CANVAS_PRESETS[presetFlag]
  : aspectFlag
    ? presetForAspect(aspectFlag)
    : undefined;

const fps = Number(flag("fps", String(presetObj?.fps ?? spec.fps ?? 30)));
const viewportWidth = Number(
  flag("width", String(presetObj?.width ?? spec.viewportWidth ?? 1080)),
);
const viewportHeight = Number(
  flag("height", String(presetObj?.height ?? spec.viewportHeight ?? 1920)),
);
const delay = Number(flag("delay", String(spec.delay ?? 0)));

// Load optional foley WAVs from --foley-dir
const foley = {};
const loadedFoleyNames = [];
if (foleyDir) {
  const dir = path.resolve(cwd, foleyDir);
  for (const key of ["marker", "eraser", "whoosh", "pop", "ping", "penTap"]) {
    const candidate = path.join(dir, `${key}.wav`);
    if (fs.existsSync(candidate)) {
      foley[key] = decodeWavBytes(new Uint8Array(fs.readFileSync(candidate)));
      loadedFoleyNames.push(key);
    }
  }
}

const trace = hasScenes
  ? extractMultiSceneTrace({
      scenes: spec.scenes,
      fps,
      viewportWidth,
      viewportHeight,
    })
  : extractMotionTrace({
      items: spec.items,
      delay,
      fps,
      viewportWidth,
      viewportHeight,
      totalFrames: spec.totalFrames,
      cameraKeyframes: spec.cameraKeyframes,
    });

const result = renderMasterAudio(trace, {
  seed,
  master,
  foley: loadedFoleyNames.length > 0 ? foley : undefined,
});

fs.mkdirSync(path.dirname(outPath), {recursive: true});
fs.writeFileSync(outPath, result.wavBytes);

const base = outPath.replace(/\.wav$/i, "");
if (exportStems) {
  fs.writeFileSync(`${base}-draw.wav`, encodeWavBytes(result.stems.draw, seed));
  fs.writeFileSync(`${base}-motion.wav`, encodeWavBytes(result.stems.motion, seed));
  fs.writeFileSync(`${base}-accents.wav`, encodeWavBytes(result.stems.accents, seed));
}
if (exportTrace) {
  fs.writeFileSync(`${base}-trace.json`, JSON.stringify(trace, null, 2));
}

console.log(`Exported studio SFX master: ${path.relative(cwd, outPath)}`);
console.log(
  `  Duration: ${result.stats.durationSeconds.toFixed(2)}s (${trace.totalFrames} frames @ ${fps} fps)`,
);
console.log(
  `  Cues: ${result.stats.cueCount} | Peak: ${result.stats.peakDb} dBFS | RMS: ${result.stats.rmsDb} dBFS`,
);
console.log(
  `  Foley bank: ${loadedFoleyNames.length > 0 ? loadedFoleyNames.join(", ") : "none (modal DSP)"}`,
);
if (exportStems) {
  console.log(`  Stems: ${path.relative(cwd, `${base}-{draw,motion,accents}.wav`)}`);
}
if (exportTrace) {
  console.log(`  Trace: ${path.relative(cwd, `${base}-trace.json`)}`);
}
