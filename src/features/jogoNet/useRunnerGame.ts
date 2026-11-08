import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RUNNER_LEVELS } from './levels';

export type RunnerStatus = 'ready' | 'running' | 'paused' | 'crashed' | 'completed' | 'finished';

interface RunnerState {
  levelIndex: number;
  status: RunnerStatus;
  distance: number;
  playerY: number;
  playerVelocity: number;
  totalAttempts: number;
  attemptsByLevel: Record<string, number>;
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const TRACK_HEIGHT = 300;
const TRACK_PADDING = 16;
const GROUND_HEIGHT = 62;
const GROUND_TOP = TRACK_HEIGHT - TRACK_PADDING - GROUND_HEIGHT;
const PLAYER_SCREEN_X = 122;
const PLAYER_WIDTH = 54;
const PLAYER_HEIGHT = 54;
const PLAYER_GROUND_Y = GROUND_TOP - PLAYER_HEIGHT;
const PLAYER_HITBOX = { x: 10, y: 8, width: 32, height: 42 };
const GRAVITY = 2260;
const JUMP_VELOCITY = -830;
const MAX_DT = 0.034;

const INITIAL_STATE: RunnerState = {
  levelIndex: 0,
  status: 'ready',
  distance: 0,
  playerY: PLAYER_GROUND_Y,
  playerVelocity: 0,
  totalAttempts: 0,
  attemptsByLevel: {},
};

function intersects(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

export function useRunnerGame() {
  const [state, setState] = useState<RunnerState>(INITIAL_STATE);
  const jumpRequestedRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  const level = RUNNER_LEVELS[state.levelIndex];

  const startAttempt = useCallback((levelIndex: number) => {
    setState((prev) => {
      const nextLevel = RUNNER_LEVELS[levelIndex];
      const levelAttempts = (prev.attemptsByLevel[nextLevel.id] ?? 0) + 1;
      return {
        ...prev,
        levelIndex,
        status: 'running',
        distance: 0,
        playerY: PLAYER_GROUND_Y,
        playerVelocity: 0,
        totalAttempts: prev.totalAttempts + 1,
        attemptsByLevel: {
          ...prev.attemptsByLevel,
          [nextLevel.id]: levelAttempts,
        },
      };
    });
    jumpRequestedRef.current = false;
  }, []);

  const requestJump = useCallback(() => {
    jumpRequestedRef.current = true;
  }, []);

  const pause = useCallback(() => {
    setState((prev) => (prev.status === 'running' ? { ...prev, status: 'paused' } : prev));
  }, []);

  const resume = useCallback(() => {
    setState((prev) => (prev.status === 'paused' ? { ...prev, status: 'running' } : prev));
    lastTimeRef.current = null;
  }, []);

  const restartLevel = useCallback(() => {
    startAttempt(state.levelIndex);
  }, [startAttempt, state.levelIndex]);

  const nextLevel = useCallback(() => {
    setState((prev) => {
      if (prev.levelIndex >= RUNNER_LEVELS.length - 1) {
        return { ...prev, status: 'finished' };
      }
      return { ...prev, levelIndex: prev.levelIndex + 1, status: 'ready' };
    });
    jumpRequestedRef.current = false;
  }, []);

  const resetAll = useCallback(() => {
    setState(INITIAL_STATE);
    jumpRequestedRef.current = false;
    lastTimeRef.current = null;
  }, []);

  const primaryAction = useCallback(() => {
    setState((prev) => {
      if (prev.status === 'ready') {
        const currentLevel = RUNNER_LEVELS[prev.levelIndex];
        const levelAttempts = (prev.attemptsByLevel[currentLevel.id] ?? 0) + 1;
        return {
          ...prev,
          status: 'running',
          distance: 0,
          playerY: PLAYER_GROUND_Y,
          playerVelocity: 0,
          totalAttempts: prev.totalAttempts + 1,
          attemptsByLevel: {
            ...prev.attemptsByLevel,
            [currentLevel.id]: levelAttempts,
          },
        };
      }

      if (prev.status === 'running') {
        jumpRequestedRef.current = true;
        return prev;
      }

      if (prev.status === 'crashed') {
        const currentLevel = RUNNER_LEVELS[prev.levelIndex];
        const levelAttempts = (prev.attemptsByLevel[currentLevel.id] ?? 0) + 1;
        jumpRequestedRef.current = false;
        return {
          ...prev,
          status: 'running',
          distance: 0,
          playerY: PLAYER_GROUND_Y,
          playerVelocity: 0,
          totalAttempts: prev.totalAttempts + 1,
          attemptsByLevel: {
            ...prev.attemptsByLevel,
            [currentLevel.id]: levelAttempts,
          },
        };
      }

      return prev;
    });
  }, []);

  useEffect(() => {
    if (state.status !== 'running') {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      lastTimeRef.current = null;
      return;
    }

    const loop = (now: number) => {
      const prevTime = lastTimeRef.current ?? now;
      lastTimeRef.current = now;
      const dt = Math.min((now - prevTime) / 1000, MAX_DT);

      setState((prev) => {
        if (prev.status !== 'running') return prev;

        const currentLevel = RUNNER_LEVELS[prev.levelIndex];
        const speed = currentLevel.speed;

        let playerVelocity = prev.playerVelocity;
        let playerY = prev.playerY;
        let distance = prev.distance + speed * dt;
        const isOnGround = playerY >= PLAYER_GROUND_Y - 0.5;

        if (jumpRequestedRef.current && isOnGround) {
          playerVelocity = JUMP_VELOCITY;
        }
        jumpRequestedRef.current = false;

        playerVelocity += GRAVITY * dt;
        playerY += playerVelocity * dt;

        if (playerY > PLAYER_GROUND_Y) {
          playerY = PLAYER_GROUND_Y;
          playerVelocity = 0;
        }

        const playerWorldX = distance + PLAYER_SCREEN_X + PLAYER_HITBOX.x;
        const playerRect: Rect = {
          x: playerWorldX,
          y: playerY + PLAYER_HITBOX.y,
          width: PLAYER_HITBOX.width,
          height: PLAYER_HITBOX.height,
        };

        const collided = currentLevel.obstacles.some((obstacle) => {
          const obstacleRect: Rect = {
            x: obstacle.x,
            y: GROUND_TOP - obstacle.height,
            width: obstacle.width,
            height: obstacle.height,
          };
          return intersects(playerRect, obstacleRect);
        });

        if (collided) {
          return {
            ...prev,
            status: 'crashed',
            playerY,
            playerVelocity: 0,
            distance,
          };
        }

        if (distance >= currentLevel.length) {
          distance = currentLevel.length;
          return {
            ...prev,
            status: 'completed',
            distance,
            playerY: PLAYER_GROUND_Y,
            playerVelocity: 0,
          };
        }

        return {
          ...prev,
          distance,
          playerY,
          playerVelocity,
        };
      });

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [state.status]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const currentAttempt = state.attemptsByLevel[level.id] ?? 0;
  const progress = Math.min(state.distance / level.length, 1);

  const visibleObstacles = useMemo(() => {
    return level.obstacles
      .map((obstacle) => ({
        ...obstacle,
        screenX: obstacle.x - state.distance + PLAYER_SCREEN_X,
        screenY: GROUND_TOP - obstacle.height,
      }))
      .filter((obstacle) => obstacle.screenX + obstacle.width > -64 && obstacle.screenX < 940);
  }, [level, state.distance]);

  return {
    state,
    level,
    levels: RUNNER_LEVELS,
    progress,
    currentAttempt,
    visibleObstacles,
    metrics: {
      trackHeight: TRACK_HEIGHT,
      groundTop: GROUND_TOP,
      groundHeight: GROUND_HEIGHT,
      playerX: PLAYER_SCREEN_X,
      playerWidth: PLAYER_WIDTH,
      playerHeight: PLAYER_HEIGHT,
    },
    actions: {
      startAttempt,
      requestJump,
      primaryAction,
      pause,
      resume,
      restartLevel,
      nextLevel,
      resetAll,
    },
  };
}
