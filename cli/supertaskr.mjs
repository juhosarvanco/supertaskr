#!/usr/bin/env node
/** The installed entry fronts the generated copy of the existing command. */
import { main } from "./dist/tools/e2e/scripts/cli.mjs";
process.exitCode = main(process.argv.slice(2));
