export function starsFor(attempts: number, questions = 5): 1 | 2 | 3 {
  if (attempts <= questions) return 3;
  if (attempts <= questions + 2) return 2;
  return 1;
}

export function starWords(stars: number): string {
  if (stars <= 1) return 'uma estrela';
  if (stars === 2) return 'duas estrelas';
  return 'três estrelas';
}

export function victoryLine(sentence: string, stars: number): string {
  return `${sentence} Você ganhou ${starWords(stars)}!`;
}
