export const sseFrame = (event: string, data: string) =>
  `event: ${event}\n${data.split("\n").map((line) => `data: ${line}\n`).join("")}\n`;
