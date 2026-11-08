import React, { useEffect, useMemo } from 'react';
import { Pause, Play, RotateCcw, SkipForward } from 'lucide-react';
import { useRunnerGame } from '../../features/jogoNet/useRunnerGame';
import styles from './JogoNetMvp.module.css';

function obstacleEmoji(kind: 'crystal' | 'totem' | 'rock'): string {
  if (kind === 'totem') return '🗿';
  if (kind === 'rock') return '🪨';
  return '🔺';
}

export const JogoNetMvp: React.FC = () => {
  const { state, level, levels, progress, currentAttempt, visibleObstacles, metrics, actions } = useRunnerGame();
  const { primaryAction, pause, resume, restartLevel, nextLevel, resetAll } = actions;

  const hasNextLevel = state.levelIndex < levels.length - 1;
  const progressPercent = Math.round(progress * 100);
  const phaseLabel = `${state.levelIndex + 1}/${levels.length}`;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space' || event.code === 'ArrowUp' || event.code === 'KeyW') {
        event.preventDefault();
        primaryAction();
      }

      if (event.code === 'KeyP') {
        event.preventDefault();
        if (state.status === 'running') {
          pause();
          return;
        }
        if (state.status === 'paused') {
          resume();
        }
      }

      if (event.code === 'KeyR') {
        event.preventDefault();
        restartLevel();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [pause, primaryAction, restartLevel, resume, state.status]);

  const helperText = useMemo(() => {
    if (state.status === 'ready') return 'Toque na pista ou aperte espaço para iniciar.';
    if (state.status === 'running') return 'Salte com espaço, seta para cima, toque ou clique.';
    if (state.status === 'paused') return 'Pausado. Retome para continuar a corrida.';
    if (state.status === 'crashed') return 'Colisão! Toque na pista ou reinicie a tentativa.';
    if (state.status === 'completed') return 'Fase concluída! Avance para a próxima trilha.';
    return 'Você concluiu o MVP autoral do Jogo Net.';
  }, [state.status]);

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Jogo Net · MVP autoral</p>
          <h1 className={styles.title}>Trilha Prisma</h1>
          <p className={styles.subtitle}>{level.subtitle}</p>
        </div>
        <div className={styles.hudBlock}>
          <span className={styles.hudLabel}>Fase</span>
          <strong>{phaseLabel}</strong>
        </div>
      </header>

      <section className={styles.hudGrid}>
        <div className={styles.hudCard}>
          <span className={styles.hudLabel}>Progresso</span>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
          </div>
          <strong>{progressPercent}%</strong>
        </div>

        <div className={styles.hudCard}>
          <span className={styles.hudLabel}>Tentativas (fase)</span>
          <strong>{currentAttempt}</strong>
        </div>

        <div className={styles.hudCard}>
          <span className={styles.hudLabel}>Tentativas (total)</span>
          <strong>{state.totalAttempts}</strong>
        </div>

        <div className={styles.hudCard}>
          <span className={styles.hudLabel}>Estado</span>
          <strong className={styles.stateValue}>{state.status}</strong>
        </div>
      </section>

      <section
        className={styles.track}
        onPointerDown={primaryAction}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            primaryAction();
          }
        }}
        style={
          {
            '--sky-start': level.sky[0],
            '--sky-end': level.sky[1],
            '--ground-color': level.ground,
            '--ground-top': `${metrics.groundTop}px`,
            '--ground-height': `${metrics.groundHeight}px`,
          } as React.CSSProperties
        }
      >
        <div className={styles.levelTitle}>{level.title}</div>
        <div className={styles.runner} style={{ left: metrics.playerX, top: state.playerY }}>
          <span>🦖</span>
        </div>

        {visibleObstacles.map((obstacle) => (
          <div
            key={obstacle.id}
            className={`${styles.obstacle} ${styles[obstacle.kind]}`}
            style={{
              left: obstacle.screenX,
              top: obstacle.screenY,
              width: obstacle.width,
              height: obstacle.height,
            }}
          >
            <span>{obstacleEmoji(obstacle.kind)}</span>
          </div>
        ))}

        <div className={styles.groundLine} />

        {state.status === 'paused' && (
          <div className={styles.overlay}>
            <h2>Pausa</h2>
            <p>Use “Retomar” para continuar.</p>
          </div>
        )}

        {state.status === 'crashed' && (
          <div className={styles.overlay}>
            <h2>Ops! Você colidiu.</h2>
            <p>Toque/click na pista ou reinicie a tentativa.</p>
          </div>
        )}

        {state.status === 'completed' && (
          <div className={styles.overlay}>
            <h2>Fase concluída!</h2>
            <p>{hasNextLevel ? 'Pronto para a próxima fase.' : 'Você concluiu as 3 fases.'}</p>
          </div>
        )}

        {state.status === 'finished' && (
          <div className={styles.overlay}>
            <h2>Jornada completa!</h2>
            <p>Você venceu todas as trilhas autorais.</p>
          </div>
        )}
      </section>

      <footer className={styles.controls}>
        <button
          type="button"
          className={styles.controlButton}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => {
            if (state.status === 'running') {
              pause();
              return;
            }
            if (state.status === 'paused') {
              resume();
            }
          }}
          disabled={state.status !== 'running' && state.status !== 'paused'}
        >
          {state.status === 'paused' ? <Play size={18} /> : <Pause size={18} />}
          {state.status === 'paused' ? 'Retomar' : 'Pausar'}
        </button>

        <button
          type="button"
          className={styles.controlButton}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={restartLevel}
          disabled={state.status === 'finished'}
        >
          <RotateCcw size={18} />
          Reiniciar
        </button>

        <button
          type="button"
          className={styles.controlButton}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={nextLevel}
          disabled={state.status !== 'completed' && state.status !== 'finished'}
        >
          <SkipForward size={18} />
          {hasNextLevel ? 'Próxima fase' : 'Finalizar'}
        </button>

        <button
          type="button"
          className={styles.controlButton}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={resetAll}
        >
          Novo ciclo
        </button>
      </footer>

      <p className={styles.helper}>{helperText}</p>
    </main>
  );
};
