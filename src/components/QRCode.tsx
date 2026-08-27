/**
 * QRCode — code QR décoratif généré de façon déterministe à partir
 * d'une chaîne (numéro de réservation). Inclut les trois motifs de
 * repérage (finder patterns) pour un rendu réaliste. Non scannable.
 */
function finderOn(r: number, c: number): boolean {
  const border = r === 0 || r === 6 || c === 0 || c === 6;
  const core = r >= 2 && r <= 4 && c >= 2 && c <= 4;
  return border || core;
}

export function QRCode({
  value,
  size = 140,
}: {
  value: string;
  size?: number;
}) {
  const cells = 25;
  // Hash déterministe de la chaîne
  let seed = 0;
  for (let i = 0; i < value.length; i++) {
    seed = (seed * 31 + value.charCodeAt(i)) >>> 0;
  }
  const rand = (() => {
    let s = seed || 1;
    return () => {
      s ^= s << 13;
      s >>>= 0;
      s ^= s >> 17;
      s ^= s << 5;
      s >>>= 0;
      return s;
    };
  })();

  const origins: [number, number][] = [
    [0, 0],
    [0, cells - 7],
    [cells - 7, 0],
  ];

  const cell = size / cells;
  const rects: { x: number; y: number }[] = [];

  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      let on = false;
      let handled = false;
      for (const [or, oc] of origins) {
        if (r >= or && r < or + 7 && c >= oc && c < oc + 7) {
          on = finderOn(r - or, c - oc);
          handled = true;
          break;
        }
      }
      if (!handled) on = rand() % 100 < 46;
      if (on) rects.push({ x: c * cell, y: r * cell });
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="Code QR du billet"
      className="rounded-lg"
    >
      <rect width={size} height={size} fill="#f5efe2" />
      {rects.map((p, i) => (
        <rect
          key={i}
          x={p.x}
          y={p.y}
          width={cell}
          height={cell}
          fill="#0f0d0a"
        />
      ))}
    </svg>
  );
}
