/**
 * Loads the bold rounded font used by MarkerText.
 * Needs the package once:  npx remotion add @remotion/google-fonts
 *
 * Import this file once (e.g. from the composition) so the font is ready
 * before the first frame renders.
 *
 * To use another font, change the import path to any Google Font,
 * e.g. "@remotion/google-fonts/PermanentMarker", and pass its `fontFamily`
 * to <MarkerText fontFamily={...} />.
 */
import {loadFont} from "@remotion/google-fonts/Fredoka";

export const markerFont = loadFont("normal", {
  weights: ["700"],
  subsets: ["latin"],
});
