export default function main(): void {
  helper(1);
}
export function helper(n: number): number {
  return n + 1;
}
export function other(n: number): number {
  return helper(n);
}
export class Thing {
  value = 0;
}
export function make(): Thing {
  return new Thing();
}
export enum Mode {
  On,
  Off,
}
export type Pair = [number, number];
let counter = 0;
var legacyVar = 1;
export { counter };
