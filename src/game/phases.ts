import type { GameView } from '../context/GameContext';

export interface Phase {
  id: Exclude<GameView, 'home' | 'map'>;
  name: string;
}

export const PHASE_TRAIL: Phase[] = [
  { id: 'colors', name: 'Vale das Cores' },
  { id: 'shapes', name: 'Templo das Formas' },
  { id: 'sizes', name: 'Clareira dos Tamanhos' },
  { id: 'letters', name: 'Rio das Letras' },
  { id: 'numbers', name: 'Ninho dos Números' },
  { id: 'positions', name: 'Ninho das Posições' },
  { id: 'animals', name: 'Floresta dos Animais' },
  { id: 'counting', name: 'Caverna da Contagem' },
  { id: 'sequence', name: 'Trilha da Sequência' },
];

export function nextPhase(current: GameView): Phase | null {
  const index = PHASE_TRAIL.findIndex((phase) => phase.id === current);
  if (index < 0 || index >= PHASE_TRAIL.length - 1) return null;
  return PHASE_TRAIL[index + 1];
}

export function suggestedNext(current: GameView, stars: Record<string, number> = {}): Phase | null {
  const remaining = PHASE_TRAIL.filter((phase) => phase.id !== current && !(stars[phase.id] > 0));
  if (remaining.length === 0) return null;
  const upcoming = nextPhase(current);
  if (upcoming && remaining.some((phase) => phase.id === upcoming.id)) return upcoming;
  return remaining[0];
}
