export interface LevelObstacle {
  id: string;
  x: number;
  width: number;
  height: number;
  kind: 'crystal' | 'totem' | 'rock';
}

export interface RunnerLevel {
  id: string;
  title: string;
  subtitle: string;
  speed: number;
  length: number;
  sky: [string, string];
  ground: string;
  obstacles: LevelObstacle[];
}

export const RUNNER_LEVELS: RunnerLevel[] = [
  {
    id: 'aurora-vale',
    title: 'Fase 1 · Vale Aurora',
    subtitle: 'Treine os saltos com ritmo tranquilo.',
    speed: 250,
    length: 1500,
    sky: ['#1d4e89', '#3e8fd4'],
    ground: '#32753f',
    obstacles: [
      { id: 'a1', x: 420, width: 44, height: 42, kind: 'crystal' },
      { id: 'a2', x: 700, width: 50, height: 56, kind: 'totem' },
      { id: 'a3', x: 1030, width: 66, height: 34, kind: 'rock' },
      { id: 'a4', x: 1300, width: 44, height: 52, kind: 'crystal' },
    ],
  },
  {
    id: 'trilha-brasa',
    title: 'Fase 2 · Trilha Brasa',
    subtitle: 'Mais ritmo, menos espaço entre obstáculos.',
    speed: 300,
    length: 1850,
    sky: ['#492662', '#af4d67'],
    ground: '#7a3f2a',
    obstacles: [
      { id: 'b1', x: 420, width: 42, height: 48, kind: 'crystal' },
      { id: 'b2', x: 650, width: 56, height: 36, kind: 'rock' },
      { id: 'b3', x: 910, width: 44, height: 58, kind: 'totem' },
      { id: 'b4', x: 1180, width: 44, height: 44, kind: 'crystal' },
      { id: 'b5', x: 1410, width: 66, height: 34, kind: 'rock' },
      { id: 'b6', x: 1650, width: 44, height: 58, kind: 'totem' },
    ],
  },
  {
    id: 'pico-lumina',
    title: 'Fase 3 · Pico Lúmina',
    subtitle: 'Final curto com velocidade máxima.',
    speed: 345,
    length: 2200,
    sky: ['#123159', '#17a2a0'],
    ground: '#225f4e',
    obstacles: [
      { id: 'c1', x: 450, width: 44, height: 44, kind: 'crystal' },
      { id: 'c2', x: 690, width: 44, height: 56, kind: 'totem' },
      { id: 'c3', x: 940, width: 66, height: 34, kind: 'rock' },
      { id: 'c4', x: 1190, width: 44, height: 52, kind: 'crystal' },
      { id: 'c5', x: 1430, width: 44, height: 58, kind: 'totem' },
      { id: 'c6', x: 1680, width: 66, height: 34, kind: 'rock' },
      { id: 'c7', x: 1930, width: 44, height: 56, kind: 'crystal' },
    ],
  },
];
