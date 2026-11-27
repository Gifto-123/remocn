import React, {createContext, useContext} from "react";
import {useCurrentFrame} from "remotion";

export type HandWindow = {
  start: number;
  end: number;
};

const HandWindowsContext = createContext<HandWindow[]>([]);

export const HandPriorityProvider: React.FC<
  React.PropsWithChildren<{imageWindows?: HandWindow[]}>
> = ({imageWindows = [], children}) => (
  <HandWindowsContext.Provider value={imageWindows}>
    {children}
  </HandWindowsContext.Provider>
);

const active = (frame: number, window: HandWindow) =>
  // Match DrawOn's five-frame hand entry and its final drawing frame so a
  // text hand cannot appear beside an entering or finishing image hand.
  frame >= window.start - 5 && frame <= window.end;

/** True while an image reveal owns the scene hand. */
export const useImageHandActive = (): boolean => {
  const frame = useCurrentFrame();
  const windows = useContext(HandWindowsContext);
  return windows.some((window) => active(frame, window));
};

/** Only the earliest active image reveal is allowed to render the hand. */
export const useImageHandOwner = (start: number, end: number): boolean => {
  const frame = useCurrentFrame();
  const windows = useContext(HandWindowsContext);
  if (!active(frame, {start, end})) return false;
  return !windows.some(
    (window) =>
      window.start < start && active(frame, window),
  );
};
