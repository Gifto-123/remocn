import path from "node:path";
/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import { Config } from "@remotion/cli/config";

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setDefaultPremountInSeconds(2);

// remocn components import each other through the "@/" alias in components.json.
// Bundlers don't read tsconfig paths, so the alias is resolved here as well.
// Remotion is configured to use Rspack, so the bundler override is the only
// override needed here. It runs from the project root, which process.cwd()
// points at.
const withRemocnAlias = <C extends { resolve?: object }>(config: C): C => ({
  ...config,
  resolve: {
    ...config.resolve,
    alias: {
      ...((config.resolve as { alias?: object } | undefined)?.alias ?? {}),
      "@": path.join(process.cwd(), "src"),
    },
  },
});
Config.overrideBundlerConfig(withRemocnAlias);
