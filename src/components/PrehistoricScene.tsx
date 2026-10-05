import React from 'react';
import styles from './PrehistoricScene.module.css';

export const PrehistoricScene: React.FC = () => {
  return (
    <div className={styles.scene} aria-hidden="true">
      <div className={styles.sky} />
      <div className={styles.sunWrap}>
        <div className={styles.sunHalo} />
        <div className={styles.sun} />
      </div>

      <div className={`${styles.cloud} ${styles.cloudFar}`} />
      <div className={`${styles.cloud} ${styles.cloudMid}`} />
      <div className={`${styles.cloud} ${styles.cloudNear}`} />

      <svg className={styles.flyby} viewBox="0 0 80 36">
        <path
          d="M2 18 C14 6 28 8 40 16 C52 8 66 6 78 18 C64 22 52 20 40 22 C28 20 16 22 2 18 Z"
          fill="#c45a24"
          opacity="0.55"
        />
        <path d="M40 18 L38 30 L42 20 Z" fill="#8d3b16" opacity="0.7" />
      </svg>

      <svg className={styles.ridges} viewBox="0 0 1440 420" preserveAspectRatio="none">
        <path
          fill="#9bb6c9"
          d="M0 250 L140 150 L260 210 L420 90 L560 200 L740 70 L920 190 L1100 110 L1260 200 L1440 130 L1440 420 L0 420 Z"
        />
        <path
          fill="#7ea0b4"
          d="M980 150 L1040 210 L1008 188 Z"
          opacity="0.9"
        />
        <path
          fill="#6d947c"
          d="M0 290 L170 190 L340 250 L520 160 L700 260 L880 175 L1060 250 L1240 170 L1440 240 L1440 420 L0 420 Z"
        />
        <path
          fill="#3e6b46"
          d="M0 330 L150 260 L310 310 L490 240 L720 320 L930 250 L1140 325 L1300 260 L1440 300 L1440 420 L0 420 Z"
        />
        <path
          fill="#2f5538"
          d="M1180 250 L1288 150 L1360 250 L1324 232 L1260 246 Z"
        />
        <path fill="#e85d2a" d="M1268 168 L1288 150 L1304 174 L1286 168 Z" />
      </svg>

      <div className={styles.haze} />

      <svg className={styles.flora} viewBox="0 0 1440 220" preserveAspectRatio="none">
        <path d="M40 220 C40 140 20 120 8 90 C36 120 48 110 70 70 C78 130 100 140 90 220 Z" fill="#245c34" />
        <path d="M90 220 C100 150 130 130 150 80 C140 140 160 150 168 220 Z" fill="#1d4c2c" />
        <path d="M1280 220 C1270 140 1220 120 1190 60 C1230 120 1250 130 1260 220 Z" fill="#245c34" />
        <path d="M1330 220 C1340 150 1380 140 1410 70 C1390 140 1370 150 1360 220 Z" fill="#1d4c2c" />
        <ellipse cx="210" cy="188" rx="70" ry="18" fill="#3d6a34" opacity="0.7" />
        <ellipse cx="1180" cy="190" rx="90" ry="20" fill="#3d6a34" opacity="0.65" />
      </svg>

      <div className={styles.ground}>
        <div className={styles.grassEdge} />
      </div>
      <div className={styles.vignette} />
    </div>
  );
};
