import def, { helper as h, other } from "./util";
import * as ns from "./components";
import "./styles.css";
import { Shape } from "./only-types";
import { Widget } from "./widget.tsx";
export { helper } from "./util";
export * from "./merge.ts";
import missing from "./missing";
import esc from "../../escape";
import React from "react";
import { x } from "@scope/pkg";
import { createRoot } from "react-dom/client";
import { readFileSync } from "node:fs";

export function boot(s?: Shape): number {
  return h(other(2));
}
