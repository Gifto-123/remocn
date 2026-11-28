/**
 * Public barrel. Names exported here are the stable, headless-safe API (scripts/export-sfx.mjs
 * loads this file under Node). Components are organised by category folder; see categories.ts.
 * Compositions can also import a whole category: "../../whiteboard/data", ".../layout", etc.
 * fonts.ts stays at this level on purpose: export-sfx skips it by path.
 */
export {CATEGORIES, type CategoryId} from "./categories";
export {DrawOn, drawOnDuration, type DrawOnProps} from "./core/DrawOn";
export {HandPen, type HandPenProps} from "./core/HandPen";
export {
  MarkerText,
  markerTextDuration,
  MARKER_FONT_STACK,
  type MarkerPart,
  type MarkerTextProps,
} from "./core/MarkerText";
export {
  MarkerList,
  MarkerParagraph,
  markerListDuration,
  markerParagraphDuration,
  type MarkerListEntry,
  type MarkerListMarker,
  type MarkerListProps,
  type MarkerParagraphProps,
  type TextAlign,
} from "./core/MarkerParagraph";
export {
  Whiteboard,
  prepareWhiteboardItems,
  whiteboardDuration,
  whiteboardSlots,
  type AnnotationItem,
  type ArrowItem,
  type BarChartItem,
  type BracketItem,
  type BubbleItem,
  type CheckItem,
  type CircleItem,
  type CrossItem,
  type DividerItem,
  type FrameItem,
  type HighlightItem,
  type ImageItem,
  type LineChartItem,
  type PreparedItem,
  type StrikeItem,
  type TextItem,
  type UnderlineItem,
  type WhiteboardItem,
  type WhiteboardProps,
} from "./motion/Whiteboard";
export {
  extractMotionTrace,
  extractMultiSceneTrace,
  sampleAtFrame,
  type MotionCue,
  type MotionCueKind,
  type MotionSample,
  type MotionTrace,
  type MotionTraceOptions,
  type MultiSceneSpec,
  type MultiSceneTraceOptions,
  type PenMode,
} from "./audio/motionTrace";
export {
  CANVAS_PRESETS,
  presetForAspect,
  type AspectRatio,
  type CanvasPreset,
  type CanvasPresetName,
} from "./core/presets";
export {
  decodeWavBytes,
  renderMasterAudio,
  type FoleyBank,
  type FoleyBankKey,
  type FoleySample,
  type MasterAudioOptions,
  type MasterAudioResult,
} from "./audio/masterAudio";
export {
  HandBarChart,
  HandLineChart,
  barChartDuration,
  barChartFrames,
  lineChartDuration,
  lineChartFrames,
  type BarDatum,
  type HandBarChartProps,
  type HandLineChartProps,
  type LineSeries,
} from "./data/Charts";
export {
  CandlestickChart,
  candlestickChartDuration,
  buildCandlestickChartGeometry,
  type CandlestickChartGeometry,
  type CandlestickChartProps,
  type CandlestickDatum,
} from "./data/CandlestickChart";
export {
  NumberCounter,
  numberCounterDuration,
  formatNumberCounter,
  type NumberCounterProps,
  type NumberCounterFormat,
} from "./data/NumberCounter";
export {
  MoneyFlow,
  moneyFlowDuration,
  getMoneyFlowConnectionPoint,
  type MoneyFlowProps,
  type MoneyFlowNode,
  type MoneyFlowConnection,
  type MoneyFlowPoint,
} from "./data/MoneyFlow";
export {
  SpeechBubble,
  ThoughtBubble,
  bubbleDuration,
  bubbleFrames,
  type BubbleTailSide,
  type BubbleVariant,
  type SpeechBubbleProps,
  type ThoughtBubbleProps,
} from "./illustration/SpeechBubble";
export {
  HighlighterSweep,
  highlighterDuration,
  highlighterFrames,
  type HighlighterSweepProps,
} from "./annotations/HighlighterSweep";
export {
  HandArrow,
  HandBracket,
  HandCheck,
  HandCircle,
  HandCross,
  HandDivider,
  HandStrike,
  HandUnderline,
  annotationDuration,
  annotationFrames,
  arrowStrokes,
  bracketStrokes,
  checkStrokes,
  circleStrokes,
  crossStrokes,
  dividerStrokes,
  strikeStrokes,
  underlineStrokes,
  type BracketSide,
  type BracketVariant,
  type DividerOrientation,
  type HandArrowProps,
  type HandBracketProps,
  type HandCheckProps,
  type HandCircleProps,
  type HandCrossProps,
  type HandDividerProps,
  type HandStrikeProps,
  type HandUnderlineProps,
  type Point,
  type StrikeVariant,
  type Stroke,
} from "./annotations/Annotations";
export {
  handWipe,
  whiteboardSlide,
  whiteboardWipe,
  type HandWipeOptions,
  type SlideOptions,
  type TransitionDirection,
  type WipeOptions,
} from "./motion/Transitions";
export {
  eraseReveal,
  reveal,
  serpentine,
  sweep,
  type RevealMode,
  type RevealOptions,
  type RevealState,
} from "./core/path";
export {
  EraserWipe,
  eraserWipeDuration,
  type EraserWipeProps,
} from "./annotations/EraserWipe";
export {ASSETS, HAND_PEN, fit, type AssetInfo} from "./core/assets";
export {
  ComparisonTable,
  comparisonTableDuration,
  comparisonTableItems,
  type ComparisonRow,
  type ComparisonTableProps,
} from "./data/ComparisonTable";
export {
  WhiteboardCamera,
  cameraAt,
  fitBoardPose,
  type CameraKeyframe,
  type CameraPose,
  type WhiteboardCameraProps,
} from "./motion/WhiteboardCamera";
export {
  InkBoilFilter,
  PaperSurface,
  type InkBoilFilterProps,
  type PaperSurfaceProps,
  type PaperVariant,
} from "./layout/Surface";
export {
  EraserSound,
  MarkerSound,
  MasterWhiteboardAudio,
  PingSound,
  PopSound,
  WhiteboardAudio,
  WhooshSound,
  type AccentSoundProps,
  type FoleySrcMap,
  type LoopSfxProps,
  type MarkerSoundProps,
  type MasterWhiteboardAudioProps,
  type WhiteboardAudioProps,
  type WhooshSoundProps,
} from "./audio/WhiteboardAudio";
export {
  PING_SECONDS,
  POP_SECONDS,
  SAMPLE_RATE,
  encodeWavBytes,
  eraserWav,
  markerWav,
  pingWav,
  popWav,
  synthEraser,
  synthMarker,
  synthPing,
  synthPop,
  synthWhoosh,
  whooshWav,
  type EraserOpts,
  type MarkerOpts,
  type PingOpts,
  type PopOpts,
  type Stereo,
  type WhooshOpts,
} from "./audio/sfxEngine";
// fonts.ts is NOT re-exported on purpose: it needs @remotion/google-fonts.

export {RoundedFrame, roundedFrameDuration, type RoundedFrameProps} from "./annotations/RoundedFrame";
export {planHand, type HandSlot, type PlannedSlot} from "./core/handPlan";
export {LowerThird, type LowerThirdProps} from "./layout/LowerThird";
