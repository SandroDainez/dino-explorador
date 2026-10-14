/**
 * Ids played by the narration engine. A missing or failed file must not freeze
 * the game: the player treats that clip as finished and moves on.
 *
 * - public/audio/vamos-brincar.mp3
 *   "Vamos brincar! Esse é o joguinho do dinossauro. Você ajuda ele."
 *   Plays on the first tap of INICIAR AVENTURA, before the customizer line.
 * - public/audio/vamos-continuar.mp3
 *   "Vamos continuar. Escolha uma das opções."
 *   Plays after the existing victory clip, on every phase.
 * - public/audio/opcoes-fim-fase.mp3
 *   "Para jogar a próxima fase, toque na seta. Para brincar de novo, toque na seta que dá uma volta. Para escolher outro joguinho, toque no mapa."
 *   Plays after vamos-continuar.mp3.
 */
export const CLIPS = {
  vamosBrincar: 'vamos-brincar',
  vamosContinuar: 'vamos-continuar',
  opcoesFimFase: 'opcoes-fim-fase',
} as const;

const VICTORY_FOLLOW_UP = [CLIPS.vamosContinuar, CLIPS.opcoesFimFase];

/** Question clips play alone. Victory clips are followed by the choice lines. */
export function narrationClipsFor(id: string | null | undefined): string[] {
  if (!id) return [];
  // Sequence victory uses contar-1 because the vitoria-sequencia recordings
  // still claim every sequence was finished. It is not a question clip.
  if (id.startsWith('vitoria-') || id === 'contar-1') {
    return [id, ...VICTORY_FOLLOW_UP];
  }
  return [id];
}
