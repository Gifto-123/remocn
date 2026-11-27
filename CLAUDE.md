# Response style: reply in ultra-concise telegraphic style with zero conversational filler, explanations, or pleasantries—output only code diffs and essential commands.

## Scene workflow

- Trigger: when the user types `start <scene>` (for example, `start scene1`), immediately execute the workflow for that scene; do not ask which scene.
- Work on exactly one concrete scene per task.
- Analyze narration audio and narration JSON in `public/narration/<scene>/`; derive timing, beats, and visual requirements.
- Study style references in `public/assets/referenc-imgs/` before proposing visuals.
- Assume required images are already generated and placed in `public/assets/<scene>/`; inspect and use them.
- Only generate Google Flow prompts when explicitly requested, using exactly: `(image 1 detailed prompt, image 2 detailed prompt, image 3 detailed prompt)`.
- Compose with available shared whiteboard/editorial components from `src/whiteboard/`.
- Implement the scene at `src/compositions/<scene>.tsx`, then register it in `src/Root.tsx`.
- Verify with `pnpm lint` and `pnpm build`; keep all work scoped to the active scene.

## Hand rules (mandatory)

- One hand per scene. Route all pen actions—images, text, and annotations—through `planHand()`; never hardcode `delay` on a hand element.
- Derive `at` from the scene JSON word start: `(seconds × 30) - beat start`.
- Images must use the hand. Never set `showHand={false}` to fix overlap; fix the hand plan.
- Fix every `[handPlan]` console warning before finishing the scene.

## Layout rules (mandatory)

- `Pic` occupies a `size × size` square; its tinted background is visible. No text or other element may enter that box: text `x ≥ pic.x + size + 40`, or text right edge `≤ pic.x − 40`.
- Text width ≈ `0.7 × fontSize × chars` (Manrope 800 caps). Keep right edge `≤ 1880`.
- Stacked lines: next `y ≥ prev y + 1.2 × prev fontSize`.
- Side-by-side columns around a centered `Pic`: size the `Pic` so columns clear its box by 40px.
- Before finishing, check each beat's final frame in Studio; fix overlap by moving `x`/`y`/`size`, never by hiding the hand.

## Text density rules (mandatory)

- Max 2 `MarkerText` per beat. Exception: timeline/sequence beats, one label per node (max 3).
- Max 3 words per text (symbols and numerals don't count). No sentences, captions, or small sub-labels.
- Show only the key number, name, or verdict; narration carries the rest. Dates, tickers, and qualifiers stay in narration unless the beat is about them.
- Prefer an image over a label. Never label what an image already shows.
- Cut text by deleting its `planHand()` slot; keep remaining `at` values; re-center the layout and re-check overlap rules.

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


