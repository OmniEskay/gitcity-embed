// Defines rendering configuration types for SVG output
export type ThemeName = 'dark' | 'light';

export interface RenderOptions {
  theme: ThemeName;
  width: number;
  height: number;
}

export interface CityRenderOptions extends RenderOptions {
  // city-specific knobs go here as needed
}
