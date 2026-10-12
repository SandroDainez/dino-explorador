import type { GameView } from '../context/GameContext';

export type WorldId = Exclude<GameView, 'home' | 'map'>;

export interface WorldSpot {
  id: WorldId;
  name: string;
  medal: string;
  desc: string;
  x: number;
  y: number;
  color: string;
  image: string;
}

// Trail order is the order the child walks. To add a fase:
// 1. Add its id to GameView in GameContext.tsx
// 2. Append a spot here (name, medal, map position, image)
// 3. Create src/views/GameName and register it in App.tsx
export const JOURNEY: WorldSpot[] = [
  {
    id: 'colors',
    name: 'Vale das Cores',
    medal: 'Medalha das Cores',
    desc: 'Aprenda as cores!',
    x: 16,
    y: 14,
    color: '#FF5722',
    image: '/worlds/colors.jpg',
  },
  {
    id: 'shapes',
    name: 'Templo das Formas',
    medal: 'Medalha das Formas',
    desc: 'Brinque com as formas!',
    x: 50,
    y: 12,
    color: '#9C27B0',
    image: '/worlds/shapes.jpg',
  },
  {
    id: 'numbers',
    name: 'Ninho dos Números',
    medal: 'Medalha dos Números',
    desc: 'Conte e choque ovos!',
    x: 84,
    y: 14,
    color: '#2196F3',
    image: '/worlds/numbers.jpg',
  },
  {
    id: 'sizes',
    name: 'Ilha dos Tamanhos',
    medal: 'Medalha dos Tamanhos',
    desc: 'Ache o maior e o menor!',
    x: 84,
    y: 44,
    color: '#F9A825',
    image: '/worlds/sizes.jpg',
  },
  {
    id: 'sequence',
    name: 'Trilha da Sequência',
    medal: 'Medalha da Sequência',
    desc: 'Descubra o que vem depois!',
    x: 50,
    y: 42,
    color: '#8E24AA',
    image: '/worlds/sequence.jpg',
  },
  {
    id: 'positions',
    name: 'Clareira das Posições',
    medal: 'Medalha das Posições',
    desc: 'Em cima, embaixo, dos lados!',
    x: 16,
    y: 44,
    color: '#00897B',
    image: '/worlds/positions.jpg',
  },
  {
    id: 'letters',
    name: 'Rio das Letras',
    medal: 'Medalha das Letras',
    desc: 'Ache as letras certas!',
    x: 16,
    y: 74,
    color: '#4CAF50',
    image: '/worlds/letters.jpg',
  },
  {
    id: 'animals',
    name: 'Floresta dos Animais',
    medal: 'Medalha dos Animais',
    desc: 'Descubra os animais!',
    x: 50,
    y: 76,
    color: '#FF9800',
    image: '/worlds/animals.jpg',
  },
  {
    id: 'counting',
    name: 'Caverna da Contagem',
    medal: 'Medalha da Contagem',
    desc: 'Conte os objetos!',
    x: 84,
    y: 74,
    color: '#00BCD4',
    image: '/worlds/counting.jpg',
  },
];

export const TRAIL_PATH = 'M 16 14 C 32 8, 38 8, 50 12 C 64 10, 74 10, 84 14 C 92 26, 92 36, 84 44 C 72 48, 60 46, 50 42 C 36 38, 24 40, 16 44 C 8 56, 8 66, 16 74 C 30 80, 40 80, 50 76 C 66 72, 76 70, 84 74';

export function nextWorld(worldId: string): WorldSpot | null {
  const index = JOURNEY.findIndex((world) => world.id === worldId);
  if (index < 0) return null;
  return JOURNEY[index + 1] ?? null;
}

export function starsForAttempts(attempts: number, questions: number): number {
  if (questions <= 0) return 1;
  if (attempts <= questions) return 3;
  if (attempts <= questions + 2) return 2;
  return 1;
}
