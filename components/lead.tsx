import { Measured } from "@/components/measured";

export const LEAD = "max-w-[46ch] text-xl leading-snug font-medium text-pretty";

// A page's lead sentence, its {marked} figures in mono.
export function Lead({ text, className = LEAD }: { text: string; className?: string }) {
  return <p className={className}><Measured text={text} figures={/\{(.*?)\}/} /></p>;
}
