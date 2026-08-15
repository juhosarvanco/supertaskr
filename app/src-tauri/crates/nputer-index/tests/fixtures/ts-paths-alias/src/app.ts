import { conf } from "cfg";
import { alpha } from "@/alpha";
import { t } from "multi/thing";
import nope from "@/nope";
import { alpha as viaBase } from "src/alpha";

export function useAll(): number {
  return conf + alpha + t + viaBase;
}
