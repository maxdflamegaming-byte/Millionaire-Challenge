// Plays every possible path through the game (up to 3^10 = 59,049; bankrupt
// runs end early) and
// reports how the outcomes are distributed. Use it to check balance after
// changing multipliers: `npm run simulate`.
import { loadEngine } from "./load-engine.mjs";

const E = loadEngine(process.argv[2]);
const n = E.ROUNDS.length;
const runs = [];

function play(state, path) {
  if (state.phase === "finished") {
    runs.push({ path, capital: state.capital, status: state.status, rounds: state.history.length });
    return;
  }
  for (let i = 0; i < 3; i++) {
    const s = E.advance(E.choose(state, i));
    play(s, path + "ABC"[i]);
  }
}
play(E.createGame(), "");

const by = (s) => runs.filter((r) => r.status === s).length;
const pct = (x) => ((100 * x) / runs.length).toFixed(1) + "%";
const sorted = [...runs].sort((a, b) => b.capital - a.capital);
const median = sorted[Math.floor(sorted.length / 2)].capital;

console.log(`Distinct playthroughs: ${runs.length}`);
console.log(`Won (≥ ${E.formatINR(E.CONFIG.targetCapital)}): ${by("won")} (${pct(by("won"))})`);
console.log(`Survived: ${by("survived")} (${pct(by("survived"))})`);
console.log(`Bankrupt: ${by("bankrupt")} (${pct(by("bankrupt"))})`);
console.log(`Median final capital: ${E.formatINR(median)}`);
console.log(`Best: ${sorted[0].path} → ${E.formatINR(sorted[0].capital)}`);

// Greedy: always pick the highest immediate multiplier. Should NOT be optimal.
let g = E.createGame(), gp = "";
while (g.phase !== "finished") {
  const opts = E.ROUNDS[g.round].options;
  let bi = 0, bm = -1;
  opts.forEach((o, i) => { const m = E.resolveOption(o, g.traits).multiplier; if (m > bm) { bm = m; bi = i; } });
  gp += "ABC"[bi];
  g = E.advance(E.choose(g, bi));
}
console.log(`Greedy (best-looking each round): ${gp} → ${E.formatINR(g.capital)} [${g.status}]`);

// Safe: always the low-risk option.
let s = E.createGame(), sp = "";
while (s.phase !== "finished") {
  const rank = { low: 0, medium: 1, high: 2 };
  const opts = E.ROUNDS[s.round].options;
  const i = opts.reduce((b, o, k) => (rank[o.risk] < rank[opts[b].risk] ? k : b), 0);
  sp += "ABC"[i];
  s = E.advance(E.choose(s, i));
}
console.log(`Always low-risk: ${sp} → ${E.formatINR(s.capital)} [${s.status}]`);

// Which first-round starts can still win?
for (const c of "ABC") {
  const w = runs.filter((r) => r.path[0] === c && r.status === "won").length;
  console.log(`Wins starting with ${c}: ${w}`);
}
const top = sorted.slice(0, 8).map((r) => `${r.path} ${E.formatINR(r.capital)}`);
console.log("Top paths:\n  " + top.join("\n  "));

const share = (status) => runs.filter((r) => r.status === status).length / runs.length;
export const summary = { total: runs.length, won: share("won"), survived: share("survived"), bankrupt: share("bankrupt") };
