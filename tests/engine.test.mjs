import { test } from "node:test";
import assert from "node:assert/strict";
import { loadEngine } from "../scripts/load-engine.mjs";

const E = loadEngine();

// Plays a path like "BCA..." (one letter per round) and returns the final state.
function play(path) {
  let s = E.createGame();
  for (const ch of path) {
    s = E.choose(s, "ABC".indexOf(ch));
    s = E.advance(s);
  }
  return s;
}

function allRuns() {
  const out = [];
  (function walk(s, path) {
    if (s.phase === "finished") return out.push({ path, s });
    for (let i = 0; i < 3; i++) walk(E.advance(E.choose(s, i)), path + "ABC"[i]);
  })(E.createGame(), "");
  return out;
}
const RUNS = allRuns();

test("FR01: game starts with ₹1,000 in round 1", () => {
  const s = E.createGame();
  assert.equal(s.capital, 1000);
  assert.equal(s.round, 0);
  assert.equal(s.phase, "deciding");
  assert.equal(s.status, "playing");
  assert.equal(s.history.length, 0);
  assert.equal(s.traits.length, 0);
});

test("FR02/FR03: 10 rounds, each with exactly 3 complete options", () => {
  assert.equal(E.ROUNDS.length, 10);
  assert.equal(E.CONFIG.totalRounds, 10);
  for (const r of E.ROUNDS) {
    assert.ok(r.level && r.scenario);
    assert.equal(r.options.length, 3);
    for (const o of r.options) {
      assert.ok(o.title && o.description && o.base.text);
      assert.ok(["low", "medium", "high"].includes(o.risk));
      assert.ok(o.base.m >= 0);
      for (const c of o.conditions || []) {
        assert.ok(E.TRAITS[c.trait], `unknown trait ${c.trait}`);
        assert.ok(c.m >= 0 && c.text);
      }
      for (const t of o.grants || []) assert.ok(E.TRAITS[t], `unknown trait ${t}`);
    }
  }
});

test("FR04: new capital = previous capital × multiplier (rounded)", () => {
  const s = E.choose(E.createGame(), 1);
  const m = E.ROUNDS[0].options[1].base.m;
  assert.equal(s.capital, Math.round(1000 * m));
  assert.equal(s.lastResult.change, s.capital - 1000);
  assert.equal(s.lastResult.multiplier, m);
});

test("trait conditions change outcomes (first matching trait wins)", () => {
  // Brand start makes the influencer shoutout pay off.
  const brand = E.choose(E.advance(E.choose(E.createGame(), 2)), 0);
  assert.equal(brand.lastResult.triggeredBy, "brand");
  assert.equal(brand.lastResult.multiplier, 2.6);
  // Local start: no matching condition, so the base outcome applies.
  const local = E.choose(E.advance(E.choose(E.createGame(), 0)), 0);
  assert.equal(local.lastResult.triggeredBy, null);
  assert.equal(local.lastResult.multiplier, E.ROUNDS[1].options[0].base.m);
});

test("FR05: result carries profit/loss, capital and explanation", () => {
  const r = E.choose(E.createGame(), 0).lastResult;
  for (const k of ["capitalBefore", "capitalAfter", "change", "multiplier", "text", "optionTitle"]) {
    assert.ok(k in r, k);
  }
});

test("no choice can be applied twice; invalid choices are ignored", () => {
  const s0 = E.createGame();
  const s1 = E.choose(s0, 0);
  assert.equal(E.choose(s1, 1), s1, "second choice in the same round is ignored");
  assert.equal(E.choose(s0, 3), s0);
  assert.equal(E.choose(s0, -1), s0);
  assert.equal(s0.capital, 1000, "original state is not mutated");
  assert.equal(s0.history.length, 0);
  assert.equal(E.advance(s0), s0, "cannot skip a round without choosing");
});

test("FR07: rounds completed are tracked", () => {
  const s = play("AAB");
  assert.equal(E.roundsCompleted(s), 3);
  assert.equal(s.round, 3);
  assert.equal(s.history.length, 3);
});

test("FR08: bankruptcy below ₹100 ends the game early, capital never negative", () => {
  // Flash sale (Bargain Image) then a price war wipes the business out in round 4.
  const s = play("ACBA");
  assert.equal(s.status, "bankrupt");
  assert.equal(s.phase, "finished");
  assert.equal(s.history.length, 4);
  assert.ok(s.capital < E.CONFIG.bankruptcyThreshold);
  assert.ok(RUNS.every(({ s }) => s.capital >= 0));
});

test("victory and survival are detected after round 10", () => {
  const best = play("BBABCBABBC");
  assert.equal(best.status, "won");
  assert.ok(best.capital >= 1000000);
  assert.equal(best.history.length, 10);
  const safe = play("ABBBBBBCAA");
  assert.equal(safe.status, "survived");
  assert.ok(safe.capital < 1000000);
});

test("FR11: achievement titles follow final capital", () => {
  const t = (capital, status = "survived") => E.getAchievement({ capital, status }).title;
  assert.equal(t(2000000, "won"), "Millionaire Mogul");
  assert.equal(t(600000), "Business Tycoon");
  assert.equal(t(150000), "Rising Founder");
  assert.equal(t(20000), "Smart Investor");
  assert.equal(t(5000), "Rookie Entrepreneur");
  assert.equal(t(0, "bankrupt"), "Rookie Entrepreneur");
});

test("FR10: restart produces a completely fresh game", () => {
  const fresh = E.createGame();
  play("BBABCBABBC");
  assert.equal(JSON.stringify(E.createGame()), JSON.stringify(fresh));
});

test("Indian rupee formatting uses lakh grouping", () => {
  assert.equal(E.formatINR(1000), "₹1,000");
  assert.equal(E.formatINR(100000), "₹1,00,000");
  assert.equal(E.formatINR(1000000), "₹10,00,000");
  assert.equal(E.formatINR(22398012), "₹2,23,98,012");
  assert.equal(E.formatINR(99), "₹99");
  assert.equal(E.formatINR(1234.6), "₹1,235");
  assert.equal(E.formatINR(-5000), "-₹5,000");
});

test("FR06: progress bar is 0 at start, 1 at target, clamped", () => {
  assert.equal(E.progress(1000), 0);
  assert.equal(E.progress(1000000), 1);
  assert.ok(Math.abs(E.progress(31623) - 0.5) < 0.001);
  assert.equal(E.progress(0), 0);
  assert.equal(E.progress(5e7), 1);
});

test("balance: winning is possible but not guaranteed", () => {
  const won = RUNS.filter((r) => r.s.status === "won");
  const bankrupt = RUNS.filter((r) => r.s.status === "bankrupt");
  assert.ok(won.length > 0, "at least one winning path");
  assert.ok(won.length / RUNS.length < 0.1, "most paths do not win");
  assert.ok(bankrupt.length > 0, "bankruptcy is reachable");
  for (const start of "ABC") {
    assert.ok(won.some((r) => r.path[0] === start), `a win exists from start ${start}`);
  }
});

test("balance: neither greedy nor always-safe play wins", () => {
  let g = E.createGame();
  while (g.phase !== "finished") {
    const ms = E.ROUNDS[g.round].options.map((o) => E.resolveOption(o, g.traits).multiplier);
    g = E.advance(E.choose(g, ms.indexOf(Math.max(...ms))));
  }
  assert.notEqual(g.status, "won", "picking the biggest immediate payoff each round should fall short");

  const rank = { low: 0, medium: 1, high: 2 };
  let s = E.createGame();
  while (s.phase !== "finished") {
    const opts = E.ROUNDS[s.round].options;
    s = E.advance(E.choose(s, opts.reduce((b, o, k) => (rank[o.risk] < rank[opts[b].risk] ? k : b), 0)));
  }
  assert.equal(s.status, "survived", "always playing safe survives but does not win");
});

test("no single option letter wins every round", () => {
  for (const ch of "ABC") assert.notEqual(play(ch.repeat(10)).status, "won");
});
