// Loads the game engine out of index.html (the single source of truth) so it
// can be tested and simulated in Node without a browser.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const DEFAULT = fileURLToPath(new URL("../index.html", import.meta.url));

export function loadEngine(file = DEFAULT) {
  const src = readFileSync(file, "utf8");
  let code = src;
  if (file.endsWith(".html")) {
    const m = src.match(/<script id="game-engine">([\s\S]*?)<\/script>/);
    if (!m) throw new Error('No <script id="game-engine"> block found in ' + file);
    code = m[1];
  }
  const ctx = vm.createContext({});
  vm.runInContext(code, ctx, { filename: "game-engine.js" });
  return ctx.MillionaireEngine;
}
