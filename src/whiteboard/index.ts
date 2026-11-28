export {DrawOn, drawOnDuration, type DrawOnProps} from "./DrawOn";
export {HandPen, type HandPenProps} from "./HandPen";
export {
  MarkerText,
  markerTextDuration,
  MARKER_FONT_STACK,
  type MarkerPart,
  type MarkerTextProps,
} from "./MarkerText";
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
} from "./MarkerParagraph";
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
} from "./Whiteboard";
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
} from "./motionTrace";
export {
  CANVAS_PRESETS,
  presetForAspect,
  type AspectRatio,
  type CanvasPreset,
  type CanvasPresetName,
} from "./presets";
export {
  decodeWavBytes,
  renderMasterAudio,
  type FoleyBank,
  type FoleyBankKey,
  type FoleySample,
  type MasterAudioOptions,
  type MasterAudioResult,
} from "./masterAudio";
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
} from "./Charts";
export {
  CandlestickChart,
  candlestickChartDuration,
  buildCandlestickChartGeometry,
  type CandlestickChartGeometry,
  type CandlestickChartProps,
  type CandlestickDatum,
} from "./CandlestickChart";
export {
  NumberCounter,
  numberCounterDuration,
  formatNumberCounter,
  type NumberCounterProps,
  type NumberCounterFormat,
} from "./NumberCounter";
export {
  MoneyFlow,
  moneyFlowDuration,
  getMoneyFlowConnectionPoint,
  type MoneyFlowProps,
  type MoneyFlowNode,
  type MoneyFlowConnection,
  type MoneyFlowPoint,
} from "./MoneyFlow";
export {
  SpeechBubble,
  ThoughtBubble,
  bubbleDuration,
  bubbleFrames,
  type BubbleTailSide,
  type BubbleVariant,
  type SpeechBubbleProps,
  type ThoughtBubbleProps,
} from "./SpeechBubble";
export {
  HighlighterSweep,
  highlighterDuration,
  highlighterFrames,
  type HighlighterSweepProps,
} from "./HighlighterSweep";
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
} from "./Annotations";
export {
  handWipe,
  whiteboardSlide,
  whiteboardWipe,
  type HandWipeOptions,
  type SlideOptions,
  type TransitionDirection,
  type WipeOptions,
} from "./Transitions";
export {
  eraseReveal,
  reveal,
  serpentine,
  sweep,
  type RevealMode,
  type RevealOptions,
  type RevealState,
} from "./path";
export {
  EraserWipe,
  eraserWipeDuration,
  type EraserWipeProps,
} from "./EraserWipe";
export {ASSETS, HAND_PEN, fit, type AssetInfo} from "./assets";
export {
  ComparisonTable,
  comparisonTableDuration,
  comparisonTableItems,
  type ComparisonRow,
  type ComparisonTableProps,
} from "./ComparisonTable";
export {
  WhiteboardCamera,
  cameraAt,
  fitBoardPose,
  type CameraKeyframe,
  type CameraPose,
  type WhiteboardCameraProps,
} from "./WhiteboardCamera";
export {
  InkBoilFilter,
  PaperSurface,
  type InkBoilFilterProps,
  type PaperSurfaceProps,
  type PaperVariant,
} from "./Surface";
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
} from "./WhiteboardAudio";
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
} from "./sfxEngine";
// fonts.ts is NOT re-exported on purpose: it needs @remotion/google-fonts.

export {RoundedFrame, roundedFrameDuration, type RoundedFrameProps} from "./RoundedFrame";
export {planHand, type HandSlot, type PlannedSlot} from "./handPlan";
export {LowerThird, type LowerThirdProps} from "./LowerThird";
