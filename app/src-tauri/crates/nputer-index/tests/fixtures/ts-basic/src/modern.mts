import { fromConfig } from "./merge.js";

export function viaMjs(): number {
  return fromConfig({ x: 2 });
}
