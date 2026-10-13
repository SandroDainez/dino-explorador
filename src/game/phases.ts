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
