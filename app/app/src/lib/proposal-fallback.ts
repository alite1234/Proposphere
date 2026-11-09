import { BuildFallbackContext } from "./proposal-defaults";

export const buildFallbackSections = (ctx: BuildFallbackContext) => {
  const builder = new BuildFallbackContext(ctx);
  return {
    get: builder.get.bind(builder),
  };
};