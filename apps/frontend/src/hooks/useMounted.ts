import { useState, useEffect } from "react";

/** Evita hydration mismatch con wagmi hooks */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
