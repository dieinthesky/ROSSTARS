import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { fetchSkillsMeta, type SkillsMetaMap } from "@/lib/skillsMeta";

const SkillsMetaContext = createContext<SkillsMetaMap | null>(null);

export function SkillsMetaProvider({ children }: { children: ReactNode }) {
  const [meta, setMeta] = useState<SkillsMetaMap | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchSkillsMeta()
      .then((m) => {
        if (!cancelled) setMeta(m);
      })
      .catch(() => {
        if (!cancelled) setMeta({});
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return <SkillsMetaContext.Provider value={meta}>{children}</SkillsMetaContext.Provider>;
}

/** null = a carregar; {} = falhou / vazio */
export function useSkillsMetaMap(): SkillsMetaMap | null {
  return useContext(SkillsMetaContext);
}
