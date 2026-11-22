// A length ("2 d 4 h", "1 m 4 s") at figure size: its numbers large, each unit small beside its number as kWh sits, read
// out whole. The gaps are in em of the unit, so they scale with the figure (10 and 16 pixels at Top Ten's 56).
export function Length({ text }: { text: string }) {
  const parts = text.split(" ");
  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {parts.map((part, i) => (i % 2
          ? <span key={i} className={`ml-[0.45em] text-[0.4em] font-medium text-muted-foreground ${i < parts.length - 1 ? "mr-[0.71em]" : ""}`}>{part}</span>
          : <span key={i}>{part}</span>))}
      </span>
    </>
  );
}
