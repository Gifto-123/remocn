# Remotion Production Progress — `dana-history`

**Active Project:** `dana-history`  
**Target Spec:** `1920x1080` (16:9), `30 fps` (`CANVAS_PRESETS.youtubeLong`)  
**Current Scene:** Scene 6  
**Current Stage:** Step 9 — Scene 6 Built / Pending User Review (`Scene6`)

---

## Scene Tracker

| Scene | Audio Authority | JSON Transcript | Duration (`s` / frames @ 30fps) | Stage | Approval |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Scene 1** | `public/dana-history/narration/scene1/scene1.mp3` | `public/dana-history/narration/scene1/scene1.json` | `56.35s` (`1692` frames) | **Complete & Approved** (`src/compositions/dana-history/scene1.tsx`) | Approved |
| **Scene 2** | `public/dana-history/narration/scene2/scene2.mp3` | `public/dana-history/narration/scene2.json` | `67.55s` (`2027` frames) | **Built & Validated / Pending Review** (`src/compositions/dana-history/scene2.tsx`) | Pending |
| **Scene 3** | `public/dana-history/narration/scene3/scene3.mp3` | `public/dana-history/narration/scene3/scene3.json` | `58.90s` (`1767` frames) | **Built & Typechecked / Pending Review** (`src/compositions/dana-history/scene3.tsx`) | Pending |
| **Scene 6** | `public/dana-history/narration/scene6/scene6.mp3` | `public/dana-history/narration/scene6/scene6.json` | `57.72s` (`1732` frames) | **Built / Pending Review** (`src/compositions/dana-history/Scene6.tsx`) | Pending |

## Scene 6 State (`Scene6`)

- Preserved the existing eight narration-locked beats and 30fps timing.
- Reused Scene 1 Dana character assets (`01_dana_calm.png`, `02_dana_nervous.png`) for the character moments in Beats 2–4.
- Reused Scene 2's `Classic_bank_building_vector_ill…_b37a28fd.jpg` for the "Biggest banks" visual in Beat 7.
- Reused Scene 1's `09_prop_cash_stack.png` for Scene 6's cash visuals.
- Updated `DrawOn` to hide premounted image layers until their scheduled start, preventing blank white backing cards from appearing before the artwork.

- Enabled the hand-drawn reveal on those Dana appearances so the character treatment matches Scene 1.
- TypeScript validation is currently blocked by pre-existing Scene 2/4 errors; no new Scene 6 errors were introduced.

---

## Scene 1 State & Decisions

### 1. Analysis (Completed)
- Listened to `public/dana-history/narration/scene1/scene1.mp3` (MP3, 44.1 kHz, mono, `56.346s`) and cross-checked all 154 tokens in `public/dana-history/narration/scene1/scene1.json`.
- Divided into 6 narration-locked beats:
  - **B1 (`0.00–7.92s`):** Egg price contrast (`2000: 91¢` vs `Today: $2.32`).
  - **B2 (`7.92–19.08s`):** Meet Dana in 2000; nervous about the future; advised by parents, teachers, and bank.
  - **B3 (`19.08–26.20s`):** `"She saved."` — `$10,000` cash kept untouched in a drawer.
  - **B4 (`26.20–32.42s`):** Checklist — disciplined, patient, never spent a cent.
  - **B5 (`32.42–46.08s`):** Purchasing power halves (`$10,000` buys `~$5,000` worth); no scam, no crash — lost to `"a number so quiet"`.
  - **B6 (`46.08–56.40s`):** 4-part roadmap (`that number`, `who sets it`, `why it works against cash`, `rethinking "saving"`).

### 2. Visual Direction & Planning (Completed)
- Derived visual identity from `public/assets/reference-imgs/`:
  - Warm cream textured paper (`#FAF3E3`), charcoal ink outlines (`#222222`), flat cel-shaded editorial cartoon characters + icon props.
  - Canonical **Dana** identity anchored to `Woman_standing_on_beige_background_5d7307ca.jpg`.
- Prompt document created: `public/dana-history/production/scene1-prompts.md`.

### 3. Asset Verification & Normalization (Completed)
All 9 user-generated assets were visually inspected, converted from `.jpg` to alpha-transparent `.png`, renamed to canonical filenames, normalized, and organized under `public/dana-history/assets/scene1/`:
- `01_dana_calm.png`, `02_dana_nervous.png`, `03_dana_happy.png`: `640×1024` (normalized height `940px`, shared ground baseline `y=992`).
- `04_prop_egg_carton.png` (note: stylized 10-egg carton in cartoon format; visually clean), `05_prop_parents_icon.png` (repaired bottom sleeve alpha & framed inside card), `06_prop_teacher_icon.png`, `07_prop_bank_icon.png`, `09_prop_cash_stack.png`: `768×768`.
- `08_prop_cash_drawer.png`: `1000×760`.

### 4. Components Reused & Created
- **Reused (`src/whiteboard/`):** `PaperSurface`, `HandArrow`, `HandCheck`, `HandCross`, `HandCircle`, `HandStrike`, `HandUnderline`, `HighlighterSweep`, `MarkerText`, `ThoughtBubble`, `CANVAS_PRESETS`.
- **Created (`src/whiteboard/components/`):** `EditorialCard.tsx` (`EditorialCard`, `CharacterSprite`, `YearBadge`, `EDITORIAL_PALETTE`, `EDITORIAL_FONTS`, `msToFrames`, `beatEnvelope`, `springPop`).
- **Created (`src/compositions/dana-history/`):** `scene1.tsx` (`DanaHistoryScene1`) and `index.tsx` (`DanaHistoryMaster`), registered in `src/Root.tsx`.

### 5. Validation Status
- `npx eslint src/compositions/dana-history src/whiteboard/components src/Root.tsx`: Passed (0 errors).
- `npx tsc --noEmit`: Passed (0 errors).
- `pnpm run build` (`remotion bundle`): Passed (`build/`).
- Keyframe still inspection (`f=220, 395, 435, 545, 750, 940, 1205, 1340, 1640` via `--browser-executable=/usr/bin/google-chrome`): Passed; verified Beat 2 `ThoughtBubble` (`handEnter={1}`, `handExit={1}`, `duration={14}`, centered text fade) and Beat 4 `HandUnderline` (`width={835}`).

---

## Asset Manifest (`public/dana-history/assets/scene1/`)

| # | Filename | Dimensions | Beats | Verification |
| :- | :--- | :--- | :--- | :--- |
| 01 | `01_dana_calm.png` | `640×1024` | B2, B6 | Verified & normalized |
| 02 | `02_dana_nervous.png` | `640×1024` | B2, B5 | Verified & normalized |
| 03 | `03_dana_happy.png` | `640×1024` | B4 | Verified & normalized |
| 04 | `04_prop_egg_carton.png` | `768×768` | B1 | Verified & normalized |
| 05 | `05_prop_parents_icon.png` | `768×768` | B2 | Verified & sleeve alpha repaired |
| 06 | `06_prop_teacher_icon.png` | `768×768` | B2 | Verified & normalized |
| 07 | `07_prop_bank_icon.png` | `768×768` | B2, B6 | Verified & normalized |
| 08 | `08_prop_cash_drawer.png` | `1000×760` | B3 | Verified & normalized |
| 09 | `09_prop_cash_stack.png` | `768×768` | B5, B6 | Verified & normalized |

---

## Scene 2 State (`DanaHistoryScene2`)

- **Code:** `src/compositions/dana-history/scene2.tsx` (registered standalone in `src/Root.tsx` as `DanaHistoryScene2`; excluded from `DanaHistoryMaster` until approved)
- **Specs:** `1920×1080`, `30fps`, `2027` frames (`67.55s` synced to `public/dana-history/narration/scene2/scene2.mp3` + `public/dana-history/narration/scene2.json`)
- **Production Prompts:** `public/dana-history/production/scene2-prompts.md`

### Beat Breakdown

| Beat | Frame Range | Audio Time Range | Summary |
| :--- | :--- | :--- | :--- |
| **B1** | `0–411` | `0.00s–13.70s` | What happened to cash overall? `$1.00 → $1.96` (`~2× COST`) BLS baseline card + bill scale |
| **B2** | `411–710` | `13.70s–23.67s` | `2.5%/yr` compounding erosion (`$1.00 → $0.975`) + `HandLineChart` down to `~$0.50 Left (-50%)` |
| **B3** | `710–1039` | `23.67s–34.63s` | Recent re-acceleration `HandBarChart` (`2.5%` vs `3.7%`, `+48% FASTER`) + Energy Prices driver card |
| **B4** | `1039–1492` | `34.63s–49.73s` | FDIC July `0.38%` national average savings yield card + 12-month `$1,000 × 0.38% = +$3.81` card |
| **B5** | `1492–1904` | `49.73s–63.47s` | Grocery basket `+$37` (`$1,000 → $1,037`) vs bank statement `+$4` (`HandCheck`) vs real loss `-$33` (`HandCross`) |
| **B6** | `1904–2027` | `63.47s–67.55s` | Nervous Dana + tilted bank statement (`HIDDEN FEE: −$33`) — never appears on any statement (`HandCircle`) |

### Scene 2 Asset Manifest (`public/dana-history/assets/scene2/`)

| # | Filename | Dimensions | Used In | Status |
| :--- | :--- | :--- | :--- | :--- |
| 01 | `01_prop_dollar_bill.png` | `768×768` | B1 | Verified, alpha-cleaned & normalized |
| 02 | `02_prop_energy_icon.png` | `768×768` | B3 | Verified, alpha-cleaned & normalized |
| 03 | `03_prop_coins_small.png` | `768×768` | B4 | Verified, alpha-cleaned & upscaled/normalized |
| 04 | `04_prop_grocery_basket.png` | `768×768` | B5 | Verified, wire-mesh alpha-cleaned & normalized |
| 05 | `05_prop_bank_statement.png` | `768×768` | B5, B6 | Verified, alpha-cleaned & normalized |
| — | `../scene1/07_prop_bank_icon.png` | `768×768` | B4 | Reused from Scene 1 |
| — | `../scene1/02_dana_nervous.png` | `640×1024` | B6 | Reused from Scene 1 |

### Validation Checks (Post-Final Edit)

- `npx eslint src/compositions/dana-history src/whiteboard/components src/Root.tsx`: passed (exit 0)
- `npx tsc --noEmit`: passed (exit 0)
- `pnpm run build`: passed (exit 0)
- Visual still inspection (`remotion still build DanaHistoryScene2`, frames `320`, `620`, `970`, `1420`, `1850`, `1990`): all 6 beats visually verified with Beat 2 annotation placement & Beat 6 stamp/circle spacing fixed and re-verified on frames `620` and `1990`.

---

## Global Asset Inventory (Existing Project Assets)

- `public/assets/reference-imgs/`: 8 style reference JPEGs — **Reference only.**
- `public/assets/hand-pen.png`: Existing whiteboard drawing hand asset (used automatically by `HandArrow`, `HandCheck`, `HandCross`, `HandCircle`, `HandStrike`, `HighlighterSweep`).
- `public/assets/character-man.png`, `public/assets/money-stack-color.png`, `public/assets/money-stack-sketch.png`: Existing demo assets (unused in `dana-history`).
