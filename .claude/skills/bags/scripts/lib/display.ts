export function formatSOL(lamports: number): string {
  return (lamports / 1e9).toFixed(4) + " SOL";
}

export function formatBPS(bps: number): string {
  return (bps / 100).toFixed(2) + "%";
}

export function formatTable(headers: string[], rows: string[][]): string {
  const widths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => (r[i] || "").length))
  );
  const sep = widths.map((w) => "-".repeat(w + 2)).join("+");
  const fmt = (row: string[]) =>
    row.map((cell, i) => ` ${(cell || "").padEnd(widths[i])} `).join("|");

  return [fmt(headers), sep, ...rows.map(fmt)].join("\n");
}

export function shortenAddress(addr: string, chars = 4): string {
  if (addr.length <= chars * 2 + 3) return addr;
  return `${addr.slice(0, chars)}...${addr.slice(-chars)}`;
}

export function formatTimestamp(unix: number): string {
  return new Date(unix * 1000).toISOString().replace("T", " ").slice(0, 19);
}
