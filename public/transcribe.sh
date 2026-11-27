#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

INPUT_PATH="${1:-$ROOT_DIR/public/jfk.wav}"
OUTPUT_PATH="${2:-$ROOT_DIR/public/captions.json}"

# whisper-cli is the current binary name; "main" is the deprecated one.
if [[ -z "${WHISPER_BIN:-}" ]]; then
  for candidate in \
    "$ROOT_DIR/whisper.cpp/build/bin/whisper-cli" \
    "$ROOT_DIR/whisper.cpp/whisper-cli" \
    "$ROOT_DIR/whisper.cpp/main"; do
    if [[ -x "$candidate" ]]; then
      WHISPER_BIN="$candidate"
      break
    fi
  done
fi
WHISPER_BIN="${WHISPER_BIN:-$ROOT_DIR/whisper.cpp/build/bin/whisper-cli}"

WHISPER_MODEL="${WHISPER_MODEL:-$ROOT_DIR/whisper.cpp/ggml-medium.en.bin}"
WHISPER_WORD_THOLD="${WHISPER_WORD_THOLD:-0.01}"
WHISPER_MAX_LEN="${WHISPER_MAX_LEN:-1}"
WHISPER_LANGUAGE="${WHISPER_LANGUAGE:-en}"
WHISPER_THREADS="${WHISPER_THREADS:-$(nproc)}"
WHISPER_PROMPT="${WHISPER_PROMPT:-}"
WHISPER_REQUIRE_GPU="${WHISPER_REQUIRE_GPU:-1}"
CUDA_VISIBLE_DEVICES="${CUDA_VISIBLE_DEVICES:-0}"
export CUDA_VISIBLE_DEVICES

case "$INPUT_PATH" in
  /*) INPUT_FILE="$INPUT_PATH" ;;
  *) INPUT_FILE="$ROOT_DIR/$INPUT_PATH" ;;
esac

case "$OUTPUT_PATH" in
  /*) OUTPUT_FILE="$OUTPUT_PATH" ;;
  *) OUTPUT_FILE="$ROOT_DIR/$OUTPUT_PATH" ;;
esac

if [[ ! -f "$INPUT_FILE" ]]; then
  echo "Audio file not found: $INPUT_FILE" >&2
  exit 1
fi

if [[ ! -x "$WHISPER_BIN" ]]; then
  echo "Whisper binary not found or not executable: $WHISPER_BIN" >&2
  echo "Build it with: cd whisper.cpp && cmake -B build -DGGML_CUDA=1 && cmake --build build -j --config Release" >&2
  exit 1
fi

if [[ ! -f "$WHISPER_MODEL" ]]; then
  echo "Whisper model not found: $WHISPER_MODEL" >&2
  exit 1
fi

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg is required to convert audio to 16 kHz mono WAV." >&2
  exit 1
fi

if [[ "$WHISPER_REQUIRE_GPU" == "1" ]]; then
  if ! command -v nvidia-smi >/dev/null 2>&1 || ! nvidia-smi -L >/dev/null 2>&1; then
    echo "GPU transcription requested, but NVIDIA-SMI cannot access a CUDA GPU." >&2
    echo "Fix the NVIDIA driver/device access, or set WHISPER_REQUIRE_GPU=0 to allow CPU fallback." >&2
    exit 1
  fi
  echo "GPU transcription enabled: $(nvidia-smi --query-gpu=name --format=csv,noheader | paste -sd ', ' -)"
fi

mkdir -p "$(dirname "$OUTPUT_FILE")"
OUTPUT_BASE="${OUTPUT_FILE%.json}"
TEMP_WAV="$(mktemp --suffix=.wav)"
WHISPER_LOG="$(mktemp --suffix=.log)"
trap 'rm -f "$TEMP_WAV" "$WHISPER_LOG"' EXIT

echo "Transcribing: $INPUT_FILE"
echo "Model: $WHISPER_MODEL"
echo "Writing JSON: ${OUTPUT_BASE}.json"

echo "Converting audio to 16 kHz mono WAV..."
ffmpeg -loglevel error -y \
  -i "$INPUT_FILE" \
  -ar 16000 \
  -ac 1 \
  -c:a pcm_s16le \
  "$TEMP_WAV"

WHISPER_ARGS=(
  --model "$WHISPER_MODEL"
  --file "$TEMP_WAV"
  --language "$WHISPER_LANGUAGE"
  --threads "$WHISPER_THREADS"
  --split-on-word
  --max-len "$WHISPER_MAX_LEN"
  --word-thold "$WHISPER_WORD_THOLD"
  --output-json
  --output-json-full
  --output-file "$OUTPUT_BASE"
)

if [[ -n "$WHISPER_PROMPT" ]]; then
  WHISPER_ARGS+=(--prompt "$WHISPER_PROMPT")
fi

# Keep whisper's log so we can confirm CUDA was actually used.
"$WHISPER_BIN" "${WHISPER_ARGS[@]}" 2> >(tee "$WHISPER_LOG" >&2)

# Match real CUDA init lines only, so "CUDA = 0" style output can't false-pass.
if [[ "$WHISPER_REQUIRE_GPU" == "1" ]] &&
   ! grep -Eqi "found [1-9][0-9]* CUDA devices|using CUDA[0-9]* backend" "$WHISPER_LOG"; then
  echo "GPU was required, but whisper.cpp did not report initialising a CUDA device." >&2
  echo "Rebuild with: cd whisper.cpp && cmake -B build -DGGML_CUDA=1 && cmake --build build -j --config Release" >&2
  echo "Or set WHISPER_REQUIRE_GPU=0 to allow CPU." >&2
  exit 1
fi

if [[ ! -f "${OUTPUT_BASE}.json" ]]; then
  echo "Whisper did not create the expected JSON file." >&2
  exit 1
fi

echo "Done: ${OUTPUT_BASE}.json"