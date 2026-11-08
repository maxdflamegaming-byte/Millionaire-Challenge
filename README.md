# Millionaire Challenge

**Start with ₹1,000. Make bold decisions. Build your empire. Can you reach ₹10 lakh?**

A business simulation game for the browser and ChatGPT. You start with ₹1,000 of virtual
capital and make 10 business decisions: your first venture, marketing, trends, competitors,
hiring, suppliers, a viral moment, expansion, a big offer and a final scaling move. Each
decision multiplies your capital. Finish with ₹10,00,000 to win; fall below ₹100 and you're bankrupt.

> A fictional game with virtual money and simplified outcomes. Not financial advice.

## Play

The whole game is one self-contained file, [`index.html`](index.html), with no build step and
no dependencies.

- **Locally:** open `index.html` in any browser.
- **GitHub Pages:** enable Pages for this repo (Settings → Pages → deploy from `main`, root).
  The game is then served at the Pages URL.
- **ChatGPT:** paste the contents of `index.html` into a ChatGPT Canvas and preview it, or
  host it (e.g. GitHub Pages) and embed it as the widget for a ChatGPT app. The game state
  lives entirely in the page, so no server is needed for the MVP.

Controls: tap or click a strategy, or press <kbd>1</kbd>/<kbd>2</kbd>/<kbd>3</kbd>
(or <kbd>A</kbd>/<kbd>B</kbd>/<kbd>C</kbd>) on a keyboard.

## How it works

Each round offers three strategies labelled low, medium or high risk. Your capital is
updated with **New capital = Previous capital × Decision multiplier**, rounded to the rupee
and never below zero.

Decisions also give you **business strengths** (Loyal Locals, Quality Reputation,
Automation, Pro Team, Trusted Supplier and so on), plus a few weaknesses (Bargain Image,
Family Crew, Budget Supplier). Later options pay off differently depending on what you've
built. For example, "Accept every order and scale fast" in *Going Viral* is a disaster unless
you have bulk inventory, a pro team or automation. All outcomes are predefined, so the same
path always gives the same result, but the best move depends on your earlier choices. That
keeps the most profitable option from being obvious.

### Balance

`npm run simulate` plays every possible path through the game (59,049 combinations; bankrupt
runs end early, leaving 47,313 distinct playthroughs):

| | Result |
|---|---|
| Winning playthroughs | 372 (0.8%), reachable from all three starting businesses |
| Bankrupt playthroughs | 657 (1.4%) |
| Median final capital | ₹96,845 |
| Best path | ₹22,39,801 |
| Always pick the biggest immediate payoff | ₹6,59,680 (survives, doesn't win) |
| Always pick the lowest risk | ₹3,92,944 (survives, doesn't win) |

Random clicking rarely wins. Building a strategy where your strengths reinforce each other does.

### Achievements

| Final capital | Title |
|---|---|
| ₹10,00,000+ | Millionaire Mogul |
| ₹5,00,000+ | Business Tycoon |
| ₹1,00,000+ | Rising Founder |
| ₹10,000+ | Smart Investor |
| Below ₹10,000 or bankrupt | Rookie Entrepreneur |

## Development

Requires Node 18+ for tests (no npm dependencies).

```bash
npm test
```

```bash
npm run simulate
```

### Project layout

| Path | What it is |
|---|---|
| `index.html` | The game: styles, markup, the engine (`<script id="game-engine">`) and the UI (`<script id="game-ui">`) |
| `scripts/load-engine.mjs` | Loads the engine out of `index.html` into Node, so there is one source of truth |
| `scripts/simulate.mjs` | Plays every path and reports the balance numbers above |
| `tests/engine.test.mjs` | Tests for the functional requirements, formatting and balance |

### Editing scenarios

All content and numbers live in the `ROUNDS` array in the engine block of `index.html`. Each
option has:

- `title`, `description`, `risk` (`low` / `medium` / `high`)
- `base`: `{ m, text }`, the default multiplier and explanation
- `conditions` (optional): `[{ trait, m, text }]`. The first trait the player has wins.
- `grants` (optional): trait ids the player gains

After changing numbers, run `npm run simulate` and `npm test`. The balance tests check that
winning stays possible from every start, stays rare overall, and that neither greedy nor
always-safe play wins.

## MVP acceptance criteria

| Criterion | Status |
|---|---|
| Start without setup | One tap from the intro screen |
| 10 rounds, 3 working choices each | Covered by tests |
| Correct financial calculations | Covered by tests |
| Clear feedback after each decision | Profit/loss, multiplier ledger, explanation, strength callouts |
| Progress bar updates | Log scale with ₹10K / ₹1 lakh / ₹10 lakh milestones |
| Victory, survival and bankruptcy detected | Covered by tests and a browser playthrough |
| Restart resets everything | Covered by tests |
| Mobile and desktop | Single column on phones (decision visible without scrolling), two columns on desktop |
| No choice applied twice | The engine ignores a second choice and the buttons lock on the first tap |

## Roadmap

Phase 2 and later from the PRD: multiple business categories, loans, salaries and inventory,
random market events, saved progress and best scores, AI-generated scenarios (which must not
change the validated calculations) and leaderboards.
