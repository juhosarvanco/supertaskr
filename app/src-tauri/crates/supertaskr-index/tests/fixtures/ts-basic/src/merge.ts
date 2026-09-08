export interface Config {
  x: number;
}
export const Config = { x: 1 };
export function fromConfig(c: Config): number {
  return c.x;
}
