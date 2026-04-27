/** Simulated network latency. Keeps demos honest about loading states. */
export const delay = (minMs = 120, maxMs = 380): Promise<void> => {
  const d = Math.floor(minMs + Math.random() * (maxMs - minMs));
  return new Promise((resolve) => setTimeout(resolve, d));
};
