# Response style: reply in ultra-concise telegraphic style with zero conversational filler, explanations, or pleasantries—output only code diffs and essential commands.

## Scene workflow

- Trigger: when the user types `start <scene>` (for example, `start scene1`), immediately execute the workflow for that scene; do not ask which scene.
- Work on exactly one concrete scene per task.
- Analyze narration audio and narration JSON in `public/narration/<scene>/`; derive timing, beats, and visual requirements.
- Study style references in `public/assets/reference-imgs/` before proposing visuals.
- Assume required images are already generated and placed in `public/assets/<scene>/`; inspect and use them.
- Only generate Google Flow prompts when explicitly requested, using exactly: `(image 1 detailed prompt, image 2 detailed prompt, image 3 detailed prompt)`.
- Compose with available shared whiteboard/editorial components from `src/whiteboard/`.
- Implement the scene at `src/compositions/<scene>.tsx`, then register it in `src/Root.tsx`.
- Verify with `pnpm lint` and `pnpm build`; keep all work scoped to the active scene.

## Canvas lock (mandatory)

- Format: 9:16 portrait, 1080×1920, 30fps, YouTube Shorts. Every composition uses `CANVAS_PRESETS.youtubeShort` for width, height and fps. Never use `youtubeLong`.
- Safe zone (Shorts UI overlays): all text and key visuals inside x 60–960, y 200–1480. Backgrounds may bleed to the edges.
- One centered column. Stack vertically; no side-by-side layouts.
- Text `fontSize ≥ 80`. Hero numbers `≥ 200`.

## Style lock (mandatory)

- Source of truth: `public/assets/reference-imgs/`. Read it before choosing or generating any asset. Match it exactly.
- Look: flat vector cartoon on cream paper (`EDITORIAL_PALETTE.paper`), thick dark outlines, flat fills. No gradients, shading, textures, glow, haze, bokeh, film grain or photorealism. One subject per image. At most a soft oval ground shadow.
- Palette: sage green, terracotta/orange, slate blue, mustard yellow, ink-black outline. Crimson only for negatives.
- Characters: round head, stick arms and legs, flat-colour torso, minimal face. Base is `character-man.png`, with the same proportions in every scene.
- Objects and icons: like the icon-sheet references (thick outline, flat fills).
- Reuse `hand-pen.png`, `money-stack-color.png` and `money-stack-sketch.png`.
- AI image spec: 1080×1920 portrait, or a square cutout on a transparent background. Prompt base: `flat vector sticker illustration, thick black outline, flat fills in sage green, terracotta, slate blue and mustard, cream paper background, single subject centered, 9:16 portrait, no text, no gradients, no photorealism`.
- Banned: dark cinematic photos, stock photography, frames or boxes around images on paper.
- Only type D evidence screenshots may be photoreal.

## Hand rules (mandatory)

- One hand per scene. Route all pen actions—images, text, and annotations—through `planHand()`; never hardcode `delay` on a hand element.
- Derive `at` from the scene JSON word start: `(seconds × 30) - beat start`.
- Images must use the hand. Never set `showHand={false}` to fix overlap; fix the hand plan.
- Fix every `[handPlan]` console warning before finishing the scene.

## Beat sheet rules (mandatory)

- Before any code, post a beat sheet table for the scene: beat | narration span | claim (≤8 words) | visual type (A–D) | exact visual | components/assets. Wait for approval before implementing.
- One claim per beat.
- Mute test: with no audio, a viewer must understand the beat's claim within 2 seconds. If not, redesign the visual.

## Layout rules (mandatory)

- `Pic` is a `size × size` square, `size ≤ 900`, centered at `x = (1080 − size) / 2`. No text may enter its box: text `y ≥ pic.y + size + 40`, or text bottom `≤ pic.y − 40`.
- Text width ≈ `0.7 × fontSize × chars` (Manrope 800 caps). Center it at `x = (1080 − width) / 2`. Left edge `≥ 60`, right edge `≤ 960`. If it doesn't fit, cut words or break the line; never go below `fontSize 80`.
- Stacked lines: next `y ≥ prev y + 1.2 × prev fontSize`.
- Before finishing, check each beat's final frame in Studio. Fix overlap by moving `x`/`y`/`size`, never by hiding the hand.

## Text density rules (mandatory)

- Max 2 `MarkerText` per beat. Exception: timeline/sequence beats, one label per node (max 3).
- Max 3 words per text (symbols and numerals don't count). No sentences, captions, or small sub-labels.
- Show only the key number, name, or verdict; narration carries the rest. Dates, tickers, and qualifiers stay in narration unless the beat is about them.
- Prefer an image over a label. Never label what an image already shows.
- Cut text by deleting its `planHand()` slot; keep remaining `at` values; re-center the layout and re-check overlap rules.

## Visual type rules (mandatory)

Every beat uses exactly one of four visual types. Classify each beat from its narration before choosing assets or components. No other types. AI-generated images are allowed only for types A and C.

### A. Hook and story imagery

- Use for: hooks, company introductions, market crashes, economic events, storytelling.
- Style-lock illustration (character + object), full-bleed 9:16 on paper. No dark overlay, no photoreal.

### B. Animated financial data

- Use for: stock movements, revenue, earnings, market capitalization, comparisons, statistics.
- Build in code with `src/whiteboard/` primitives (`Charts`, `CandlestickChart`, `NumberCounter`, `ComparisonTable`, `MoneyFlow`). Exact figures come from code, never from images. No AI images.

### C. Editorial illustrations

- Use for abstract concepts: inflation, institutional investors, market manipulation, economic pressure.
- Prefer hand-drawn diagrams (`DrawOn`/SVG paths). If an AI image is used, follow the style lock: one subject, transparent cutout, no frame, no rotation, no multiply blend.

### D. Evidence and documentary visuals

- Use for: headlines, company filings, financial reports, news events, historical evidence.
- Use real screenshots or crops (filing excerpt, docket, headline) in `RoundedFrame`; mark the key line with `HighlighterSweep` or `HandCircle`. No AI images.

# Remocn

Remotion + React + TypeScript video project. Keep repository exploration focused on `src/` and `public/assets/`.

## Important paths

- `public/assets/` — source images, fonts, audio, and other assets served through Remotion's `staticFile()`.
- `src/compositions/` — individual video compositions and demos; add new scenes here.
- `src/whiteboard/` — reusable whiteboard primitives, drawing effects, annotations, transitions, charts, camera, and audio helpers. `src/whiteboard/index.ts` is the public barrel export.
- `src/Root.tsx` — Remotion composition registry/entry point. Register compositions here with `<Composition />`.
- `src/Composition.tsx` — current shared whiteboard demo constants and composition implementation.

## Architecture

- Remotion renders React components frame-by-frame; composition metadata defines id, dimensions, fps, duration, and default props.
- Prefer reusable primitives from `src/whiteboard/` over duplicating animation logic in compositions.
- Use `staticFile()` for files under `public/`; do not import generated media from `build/`, `dist/`, `out/`, or `renders/`.
- Keep timing deterministic and frame-based. Put reusable duration calculations beside their component.
- Generated directories and heavy dependencies are excluded by `.claudeignore`.


