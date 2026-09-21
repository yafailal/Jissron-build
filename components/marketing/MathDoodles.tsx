// Chalkboard-style backdrop: hand-written formulas and small diagrams, drifting slowly.
// Purely decorative, deterministic (fixed seed) so server and client render the same layout.

function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FORMULAS = [
  "E = mc²", "a² + b² = c²", "sin²x + cos²x = 1", "∫ x² dx = x³/3", "Σ n = n(n+1)/2", "y = 6x − 3",
  "tan(2A)", "(a+b)² = a² + 2ab + b²", "x = 2", "lim x→0 sin x / x = 1", "√(x² + y²)", "A = πr²",
  "dy/dx", "f(x) = ax² + bx + c", "3x + 4y = 12", "cos 2A = 1 − 2sin²A", "log₂ 8 = 3", "e^{iπ} + 1 = 0",
  "Δ = b² − 4ac", "P = mv", "V = ⅓πr²h", "A = ½ b h", "n! = n(n−1)!", "∂f/∂x", "x = (−b ± √Δ) / 2a",
  "ABC", "1 − cot x", "sin 2x = 2 sin x cos x", "∑ 1/n²  = π²/6", "v = u + at", "F = ma", "2π r", "∞", "π", "θ",
  "(x, y)", "x² + y² = r²", "d/dx eˣ = eˣ", "P(A ∪ B)", "√2", "a/b = c/d", "λ = h/p", "∇·E = ρ/ε₀",
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
  // right triangle
  svg(<><path d="M12 88V16l74 72z" /><path d="M12 76h12V88" /></>),
  // axes + curve
  svg(<><path d="M12 10v80h80" /><path d="M12 78C34 8 58 104 90 28" /><path d="M82 24l8 4-2 9" /></>),
  // sine wave
  svg(<path d="M4 50C18 6 32 6 46 50S74 94 96 50" />),
  // circle with radius
  svg(<><circle cx="50" cy="50" r="38" /><path d="M50 50l28-22" /><circle cx="50" cy="50" r="2" /></>),
  // spiral
  svg(<path d="M50 50a5 5 0 1 1 10 0a15 15 0 1 1-30 0a25 25 0 1 1 50 0a35 35 0 1 1-70 0" />),
  // tilted squares
  svg(<><path d="M14 40l30-14 14 30-30 14z" /><path d="M50 60l28-10 10 28-28 10z" /></>),
  // parabola
  svg(<><path d="M50 8v84M8 50h84" /><path d="M20 12Q50 130 80 12" /></>),
  // cube
  svg(<><path d="M50 10l34 18v40L50 88 16 68V28z" /><path d="M50 48l34-20M50 48L16 28M50 48v40" /></>),
  // curved arrow
  svg(<><path d="M8 72Q48 0 90 40" /><path d="M78 40l12 0-2 12" /></>),
  // sum-like zigzag
  svg(<path d="M78 16H26l30 34-30 34h52" />),
];

const rand = seeded(20260921);

const ITEMS = [
  ...Array.from({ length: 80 }, (_, i) => ({
    kind: "text" as const,
    idx: i % FORMULAS.length,
    left: rand() * 96,
    top: rand() * 94,
    size: 13 + Math.round(rand() * 15),
    rot: Math.round(rand() * 50 - 25),
    opacity: 0.22 + rand() * 0.4,
    bright: rand() > 0.75,
    dur: 7 + rand() * 6,
    delay: rand() * 6,
  })),
  ...Array.from({ length: 40 }, (_, i) => ({
    kind: "doodle" as const,
    idx: i % DOODLES.length,
    left: rand() * 94,
    top: rand() * 88,
    size: 34 + Math.round(rand() * 40),
    rot: Math.round(rand() * 60 - 30),
    opacity: 0.2 + rand() * 0.35,
    bright: rand() > 0.6,
    dur: 8 + rand() * 6,
    delay: rand() * 6,
  })),
];

export function MathDoodles() {
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
                <span
                  className="font-bold italic leading-none"
                  style={{ fontSize: it.size, fontFamily: '"Bradley Hand", "Segoe Print", "Marker Felt", "Comic Sans MS", cursive' }}
                >
                  {FORMULAS[it.idx]}
                </span>
              )}
            </span>
          </span>
        );
      })}
    </>
  );
}
