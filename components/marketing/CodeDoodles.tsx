// Developer-style backdrop: code, functions, terminal commands, binary and small diagrams, drifting slowly.
// Purely decorative, deterministic (fixed seed) so server and client render the same layout.

function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SNIPPETS = [
  "function add(a, b) { return a + b; }", "const sum = (a, b) => a + b;", "if (user) { return user.id; }",
  "for (let i = 0; i < n; i++) {}", "console.log(\"Hello, world!\");", "import React from \"react\";",
  "export default function App() {}", "async function getData() { await fetch(url); }", "const [count, setCount] = useState(0);",
  "def main():", "class Node extends Base {}", "return null;", "while (true) { run(); }", "try { run(); } catch (e) {}",
  "git commit -m \"init\"", "git push origin main", "npm install", "pnpm dev", "docker compose up", "$ cd project && ls",
  "SELECT * FROM users;", "INSERT INTO courses VALUES (…);", "<div className=\"app\" />", "</>", "{ }", "[ ]", "=>", "&&", "||", "!==",
  "// TODO: refactor", "/* build */", "\"use client\";", "let x = 42;", "type User = { id: string };", "interface Props {}",
  "map(x => x * 2)", "arr.filter(Boolean)", "await db.user.findMany()", "process.env.API_KEY", "0x1F", "0xFF", "NULL", "404", "200 OK",
  "int main() { return 0; }", "print(\"hi\")", "x = [i for i in range(10)]", "SELECT COUNT(*) FROM orders;", "#include <stdio.h>",
];

type Doodle = (props: { className?: string }) => React.ReactElement;
const svg = (children: React.ReactNode) =>
  function D({ className }: { className?: string }) {
    return (
      <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={className}>
        {children}
      </svg>
    );
  };

const DOODLES: Doodle[] = [
  // terminal window
  svg(<><rect x="8" y="16" width="84" height="68" rx="6" /><path d="M22 40l14 10-14 10M44 62h24" /></>),
  // curly braces
  svg(<><path d="M38 14c-10 0-12 6-12 14v6c0 6-4 12-12 16 8 4 12 10 12 16v6c0 8 2 14 12 14" /><g transform="translate(100 0) scale(-1 1)"><path d="M38 14c-10 0-12 6-12 14v6c0 6-4 12-12 16 8 4 12 10 12 16v6c0 8 2 14 12 14" /></g></>),
  // </>
  svg(<><path d="M34 28L12 50l22 22M66 28l22 22-22 22M57 20L43 80" /></>),
  // git branches
  svg(<><circle cx="28" cy="20" r="7" /><circle cx="28" cy="80" r="7" /><circle cx="72" cy="38" r="7" /><path d="M28 27v46M72 45c0 18-44 8-44 28" /></>),
  // flowchart
  svg(<><rect x="30" y="6" width="40" height="20" rx="4" /><path d="M50 26v12M50 38l24 18-24 18-24-18z" /><path d="M50 74v8" /><rect x="30" y="82" width="40" height="14" rx="4" /></>),
  // database
  svg(<><ellipse cx="50" cy="22" rx="32" ry="11" /><path d="M18 22v48c0 6 14 11 32 11s32-5 32-11V22M18 46c0 6 14 11 32 11s32-5 32-11" /></>),
  // chip
  svg(<><rect x="28" y="28" width="44" height="44" rx="4" /><path d="M40 12v16M60 12v16M40 72v16M60 72v16M12 40h16M12 60h16M72 40h16M72 60h16" /><rect x="42" y="42" width="16" height="16" /></>),
  // network nodes
  svg(<><circle cx="50" cy="18" r="8" /><circle cx="20" cy="76" r="8" /><circle cx="80" cy="76" r="8" /><circle cx="50" cy="52" r="7" /><path d="M50 26v19M44 57L26 70M56 57l18 13M28 76h44" /></>),
  // arrow / lambda
  svg(<path d="M10 50h68M60 30l20 20-20 20" />),
  // stacked layers
  svg(<><path d="M50 12l40 20-40 20-40-20z" /><path d="M10 50l40 20 40-20M10 68l40 20 40-20" /></>),
];

const rand = seeded(20260921);
const binary = (len: number) => Array.from({ length: len }, () => (rand() > 0.5 ? "1" : "0")).join("");
const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';
const FILLERS = ["0", "1", "{", "}", ";", "<", ">", "( )", "=", "#", "[ ]", "//", "01", "10", "&&", "=>"];

// Packing is done against a reference panel size; positions are stored as percentages.
const REF_W = 1300;
const REF_H = 540;
const GAP = 8;

interface Item {
  kind: "text" | "doodle";
  text?: string;
  idx?: number;
  left: number;
  top: number;
  size: number;
  rot: number;
  opacity: number;
  bright: boolean;
  dur: number;
  delay: number;
}

type Candidate = Omit<Item, "left" | "top"> & { w: number; h: number };

const cand = (kind: "text" | "doodle", size: number, w: number, h: number, extra: Partial<Candidate>): Candidate => ({
  kind,
  size,
  w,
  h,
  rot: kind === "doodle" ? Math.round(rand() * 20 - 10) : Math.round(rand() * 8 - 4),
  opacity: (rand(), 0.35), // draw kept so the seeded layout stays the same
  bright: rand() > 0.68,
  dur: 6 + rand() * 6,
  delay: rand() * 6,
  ...extra,
});

// Biggest first, so the small fillers pack into whatever gaps remain.
const CANDIDATES: Candidate[] = [
  ...Array.from({ length: 70 }, (_, i) => {
    const size = 34 + Math.round(rand() * 34);
    return cand("doodle", size, size, size, { idx: i % DOODLES.length });
  }),
  ...Array.from({ length: 150 }, (_, i) => {
    const text = SNIPPETS[i % SNIPPETS.length];
    const size = 12 + Math.round(rand() * 8);
    return cand("text", size, text.length * size * 0.62, size * 1.25, { text });
  }),
  ...Array.from({ length: 160 }, () => {
    const text = binary(4 + Math.round(rand() * 14));
    const size = 11 + Math.round(rand() * 6);
    return cand("text", size, text.length * size * 0.62, size * 1.25, { text });
  }),
  ...Array.from({ length: 300 }, (_, i) => {
    const text = FILLERS[i % FILLERS.length];
    const size = 11 + Math.round(rand() * 7);
    return cand("text", size, text.length * size * 0.62, size * 1.25, { text });
  }),
];

const ITEMS: Item[] = (() => {
  const placed: { x: number; y: number; w: number; h: number }[] = [];
  const out: Item[] = [];
  for (const c of CANDIDATES) {
    for (let attempt = 0; attempt < 80; attempt++) {
      const x = rand() * (REF_W - c.w);
      const y = rand() * (REF_H - c.h);
      const clear = placed.every(
        (p) => x + c.w + GAP <= p.x || p.x + p.w + GAP <= x || y + c.h + GAP <= p.y || p.y + p.h + GAP <= y
      );
      if (clear) {
        placed.push({ x, y, w: c.w, h: c.h });
        const { w: _w, h: _h, ...item } = c;
        out.push({ ...item, left: +((x / REF_W) * 100).toFixed(2), top: +((y / REF_H) * 100).toFixed(2) });
        break;
      }
    }
  }
  return out;
})();

export function CodeDoodles() {
  return (
    <>
      {ITEMS.map((it, i) => {
        const Doodle = it.kind === "doodle" && it.idx !== undefined ? DOODLES[it.idx] : null;
        return (
          <span
            key={i}
            className={`absolute select-none whitespace-nowrap animate-drift motion-reduce:animate-none ${it.bright ? "text-primary-bright" : "text-white"}`}
            style={{
              left: `${it.left}%`,
              top: `${it.top}%`,
              opacity: it.opacity,
              animationDuration: `${it.dur}s`,
              animationDelay: `${it.delay}s`,
            }}
          >
            <span className="block" style={{ transform: `rotate(${it.rot}deg)`, width: Doodle ? it.size : undefined }}>
              {Doodle ? (
                <Doodle className="block h-auto w-full" />
              ) : (
                <span className="font-semibold leading-none" style={{ fontSize: it.size, fontFamily: MONO }}>
                  {it.text}
                </span>
              )}
            </span>
          </span>
        );
      })}
    </>
  );
}
