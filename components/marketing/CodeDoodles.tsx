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

const ITEMS = [
  // code / commands
  ...Array.from({ length: 60 }, (_, i) => ({
    kind: "text" as const,
    text: SNIPPETS[i % SNIPPETS.length],
    left: rand() * 92,
    top: rand() * 94,
    size: 12 + Math.round(rand() * 8),
    rot: Math.round(rand() * 16 - 8),
    opacity: 0.22 + rand() * 0.4,
    bright: rand() > 0.7,
    dur: 7 + rand() * 6,
    delay: rand() * 6,
  })),
  // binary strings
  ...Array.from({ length: 50 }, () => ({
    kind: "text" as const,
    text: binary(6 + Math.round(rand() * 14)),
    left: rand() * 92,
    top: rand() * 96,
    size: 11 + Math.round(rand() * 8),
    rot: Math.round(rand() * 10 - 5),
    opacity: 0.2 + rand() * 0.35,
    bright: rand() > 0.6,
    dur: 8 + rand() * 6,
    delay: rand() * 6,
  })),
  // diagrams
  ...Array.from({ length: 36 }, (_, i) => ({
    kind: "doodle" as const,
    idx: i % DOODLES.length,
    left: rand() * 94,
    top: rand() * 88,
    size: 32 + Math.round(rand() * 38),
    rot: Math.round(rand() * 24 - 12),
    opacity: 0.2 + rand() * 0.35,
    bright: rand() > 0.6,
    dur: 8 + rand() * 6,
    delay: rand() * 6,
  })),
];

export function CodeDoodles() {
  return (
    <>
      {ITEMS.map((it, i) => {
        const Doodle = it.kind === "doodle" ? DOODLES[it.idx] : null;
        return (
          <span
            key={i}
            className={`absolute select-none whitespace-nowrap animate-float motion-reduce:animate-none ${it.bright ? "text-primary-bright" : "text-white"}`}
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
                  {it.kind === "text" ? it.text : null}
                </span>
              )}
            </span>
          </span>
        );
      })}
    </>
  );
}
