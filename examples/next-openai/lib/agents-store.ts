export type EffortLevel = 'low' | 'medium' | 'high';

export type RenstromAgent = {
  id: string;
  name: string;
  instructions: string;
  model: string; // e.g. 'gpt-5'
  workflowId?: string;
  effort: EffortLevel;
  store: boolean;
  createdAt: number;
};

const STORAGE_KEY = 'renstrom_agents';

export function listAgents(): RenstromAgent[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as RenstromAgent[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function getAgent(id: string): RenstromAgent | undefined {
  return listAgents().find(a => a.id === id);
}

export function saveAgent(agent: RenstromAgent) {
  if (typeof window === 'undefined') return;
  const current = listAgents();
  const idx = current.findIndex(a => a.id === agent.id);
  if (idx >= 0) current[idx] = agent;
  else current.unshift(agent);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
}

export function deleteAgent(id: string) {
  if (typeof window === 'undefined') return;
  const filtered = listAgents().filter(a => a.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function generateId() {
  return Math.random().toString(36).slice(2);
}