import React from 'react';
import type { DinoType, DinoColor, DinoAccessory } from '../context/GameContext';

interface DinoAvatarProps {
  type: DinoType;
  color: DinoColor;
  accessory: DinoAccessory;
  animation?: 'idle' | 'walk' | 'celebrate' | 'sad';
  size?: number;
  className?: string;
}

export const DinoAvatar: React.FC<DinoAvatarProps> = ({
  type,
  color,
  accessory,
  animation = 'idle',
  size = 200,
  className = '',
}) => {
  // SVG gradients ID depending on the chosen color
  const bodyGradId = `dino-body-grad-${color}`;
  const bellyGradId = `dino-belly-grad-${color}`;
  const spikeGradId = `dino-spike-grad-${color}`;

  // Helper to render gradients defs
  const renderDefs = () => {
    return (
      <defs>
        {/* Green Gradients */}
        <linearGradient id="dino-body-grad-green" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#81C784" />
          <stop offset="60%" stopColor="#4CAF50" />
          <stop offset="100%" stopColor="#2E7D32" />
        </linearGradient>
        <linearGradient id="dino-belly-grad-green" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#E8F5E9" />
          <stop offset="100%" stopColor="#C8E6C9" />
        </linearGradient>
        <linearGradient id="dino-spike-grad-green" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A5D6A7" />
          <stop offset="100%" stopColor="#388E3C" />
        </linearGradient>

        {/* Pink Gradients */}
        <linearGradient id="dino-body-grad-pink" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F06292" />
          <stop offset="60%" stopColor="#E91E63" />
          <stop offset="100%" stopColor="#880E4F" />
        </linearGradient>
        <linearGradient id="dino-belly-grad-pink" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FCE4EC" />
          <stop offset="100%" stopColor="#F8BBD0" />
        </linearGradient>
        <linearGradient id="dino-spike-grad-pink" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F48FB1" />
          <stop offset="100%" stopColor="#C2185B" />
        </linearGradient>

        {/* Blue Gradients */}
        <linearGradient id="dino-body-grad-blue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#64B5F6" />
          <stop offset="60%" stopColor="#2196F3" />
          <stop offset="100%" stopColor="#0D47A1" />
        </linearGradient>
        <linearGradient id="dino-belly-grad-blue" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#E3F2FD" />
          <stop offset="100%" stopColor="#BBDEFB" />
        </linearGradient>
        <linearGradient id="dino-spike-grad-blue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#90CAF9" />
          <stop offset="100%" stopColor="#1565C0" />
        </linearGradient>

        {/* Orange Gradients */}
        <linearGradient id="dino-body-grad-orange" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFB74D" />
          <stop offset="60%" stopColor="#FF9800" />
          <stop offset="100%" stopColor="#E65100" />
        </linearGradient>
        <linearGradient id="dino-belly-grad-orange" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFF3E0" />
          <stop offset="100%" stopColor="#FFE0B2" />
        </linearGradient>
        <linearGradient id="dino-spike-grad-orange" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFCC80" />
          <stop offset="100%" stopColor="#F57C00" />
        </linearGradient>

        {/* Shading/Highlights Overlay Gradient */}
        <linearGradient id="dino-highlight" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="dino-shadow" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#000000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.15" />
        </linearGradient>
      </defs>
    );
  };

  // Helper to render accessory
  const renderAccessory = () => {
    switch (accessory) {
      case 'hat':
        return (
          <g id="accessory-hat">
            {/* Explorer Hat */}
            <path
              d="M 60 45 L 140 45 C 130 15, 70 15, 60 45 Z"
              fill="#D7CCC8"
              stroke="#5D4037"
              strokeWidth="2.5"
            />
            {/* Hat Band */}
            <path d="M 61 40 L 139 40" stroke="#8C2525" strokeWidth="5" />
            {/* Hat Brim */}
            <ellipse cx="100" cy="46" rx="55" ry="6" fill="#A1887F" stroke="#5D4037" strokeWidth="2" />
          </g>
        );
      case 'glasses':
        return (
          <g id="accessory-glasses">
            {/* Sunglasses frame */}
            <circle cx="105" cy="65" r="14" fill="rgba(33, 33, 33, 0.9)" stroke="#E53935" strokeWidth="3" />
            <circle cx="135" cy="65" r="14" fill="rgba(33, 33, 33, 0.9)" stroke="#E53935" strokeWidth="3" />
            {/* Glasses Bridge */}
            <path d="M 119 63 Q 120 60, 121 63" stroke="#E53935" strokeWidth="3" fill="none" />
            {/* Sunglasses Reflections */}
            <path d="M 98 60 L 108 70" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
            <path d="M 128 60 L 138 70" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
            {/* Glasses temples (sides) */}
            <path d="M 91 63 L 78 60" stroke="#E53935" strokeWidth="2" />
          </g>
        );
      case 'bowtie':
        return (
          <g id="accessory-bowtie">
            {/* Bowtie on the neck */}
            <polygon points="85,115 63,98 63,132" fill="#E53935" stroke="#B71C1C" strokeWidth="2" />
            <polygon points="85,115 107,98 107,132" fill="#E53935" stroke="#B71C1C" strokeWidth="2" />
            <circle cx="85" cy="115" r="8" fill="#B71C1C" />
            <circle cx="83" cy="113" r="3" fill="#FF8A80" opacity="0.6" />
          </g>
        );
      default:
        return null;
    }
  };

  // Eyes based on emotional/animation state (with blinking added)
  const renderEyes = () => {
    if (animation === 'sad') {
      return (
        <g id="dino-eyes-sad">
          {/* Sad/crying/confused eyes */}
          <path d="M 100 68 Q 108 58, 116 68" stroke="#37474F" strokeWidth="4.5" fill="none" strokeLinecap="round" />
          <path d="M 130 68 Q 138 58, 146 68" stroke="#37474F" strokeWidth="4.5" fill="none" strokeLinecap="round" />
          {/* Tear drops */}
          <path d="M 108 73 C 108 78, 105 82, 108 82 C 111 82, 108 78, 108 73 Z" fill="#4FC3F7" className="animate-float" />
        </g>
      );
    }

    if (animation === 'celebrate') {
      return (
        <g id="dino-eyes-happy">
          {/* Happy squinting eyes (curved lines) */}
          <path d="M 100 65 Q 108 55, 116 65" stroke="#212121" strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M 130 65 Q 138 55, 146 65" stroke="#212121" strokeWidth="5" fill="none" strokeLinecap="round" />
        </g>
      );
    }

    // Default cute open eyes with Blink animation applied
    return (
      <g id="dino-eyes-default" style={{ animation: 'blink-eyes 5s infinite', transformOrigin: '122px 65px' }}>
        {/* Left Eye */}
        <circle cx="108" cy="65" r="11" fill="#212121" />
        <circle cx="105" cy="61" r="5" fill="#ffffff" />
        <circle cx="111" cy="69" r="2.2" fill="#ffffff" />

        {/* Right Eye */}
        <circle cx="138" cy="65" r="11" fill="#212121" />
        <circle cx="135" cy="61" r="5" fill="#ffffff" />
        <circle cx="141" cy="69" r="2.2" fill="#ffffff" />
      </g>
    );
  };

  // Cheek blush
  const renderCheeks = () => {
    return (
      <g id="dino-cheeks">
        <circle cx="97" cy="74" r="7" fill="#FF8A80" opacity="0.75" />
        <circle cx="147" cy="74" r="7" fill="#FF8A80" opacity="0.75" />
      </g>
    );
  };

  const getAnimationClass = () => {
    switch (animation) {
      case 'walk':
        return 'animate-walk';
      case 'celebrate':
        return 'animate-celebrate';
      case 'sad':
        return 'animate-shake';
      default:
        return 'animate-float'; // gentle float by default
    }
  };

  const renderDinosaur = () => {
    switch (type) {
      case 'trex':
        return (
          <g>
            {/* Tail */}
            <path
              d="M 50 140 Q 10 160, 20 120 Q 40 115, 60 125 Z"
              fill={`url(#${bodyGradId})`}
              stroke={`url(#${spikeGradId})`}
              strokeWidth="2.5"
            />
            {/* T-Rex spikes on tail/back */}
            <polygon points="30,130 20,125 35,120" fill={`url(#${spikeGradId})`} />
            <polygon points="45,120 38,112 50,110" fill={`url(#${spikeGradId})`} />
            <polygon points="60,110 55,100 68,98" fill={`url(#${spikeGradId})`} />

            {/* Feet / Legs */}
            <ellipse cx="65" cy="165" rx="14" ry="18" fill={`url(#${spikeGradId})`} />
            <ellipse cx="100" cy="165" rx="14" ry="18" fill={`url(#${spikeGradId})`} />
            {/* Claws */}
            <circle cx="59" cy="178" r="4" fill="#FFF" />
            <circle cx="65" cy="180" r="4" fill="#FFF" />
            <circle cx="71" cy="178" r="4" fill="#FFF" />
            
            <circle cx="94" cy="178" r="4" fill="#FFF" />
            <circle cx="100" cy="180" r="4" fill="#FFF" />
            <circle cx="106" cy="178" r="4" fill="#FFF" />

            {/* Body */}
            <path
              d="M 50 110 C 50 80, 110 80, 115 110 C 120 135, 110 160, 80 160 C 55 160, 50 135, 50 110 Z"
              fill={`url(#${bodyGradId})`}
              stroke={`url(#${spikeGradId})`}
              strokeWidth="2.5"
            />
            {/* Belly Patch */}
            <path
              d="M 68 115 C 68 95, 102 95, 105 115 C 108 135, 100 153, 86 153 C 74 153, 68 135, 68 115 Z"
              fill={`url(#${bellyGradId})`}
            />

            {/* Shading overlay for T-Rex belly patch */}
            <path
              d="M 68 115 C 68 95, 102 95, 105 115 C 108 135, 100 153, 86 153 C 74 153, 68 135, 68 115 Z"
              fill="url(#dino-shadow)"
            />

            {/* Head */}
            <path
              d="M 65 70 C 65 35, 150 35, 150 70 C 150 85, 140 100, 115 100 C 95 100, 65 95, 65 70 Z"
              fill={`url(#${bodyGradId})`}
              stroke={`url(#${spikeGradId})`}
              strokeWidth="2.5"
            />

            {/* 3D Highlight curve on head */}
            <path
              d="M 75 55 C 75 42, 120 40, 135 52"
              stroke="url(#dino-highlight)"
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
              opacity="0.8"
            />

            {/* Mouth */}
            <path
              d={animation === 'sad' ? 'M 100 88 Q 115 82, 135 88' : 'M 100 82 Q 115 95, 135 82'}
              stroke="#212121"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
            />
            {/* Tooth */}
            {animation !== 'sad' && (
              <polygon points="108,83 113,91 118,83" fill="white" />
            )}

            {/* Tiny T-Rex Arms */}
            <path
              d="M 112 115 Q 125 118, 122 125"
              stroke={`url(#${spikeGradId})`}
              strokeWidth="7"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 62 115 Q 50 118, 52 125"
              stroke={`url(#${spikeGradId})`}
              strokeWidth="7"
              strokeLinecap="round"
              fill="none"
            />

            {/* Face Details */}
            {renderCheeks()}
            {renderEyes()}
          </g>
        );
      case 'triceratops':
        return (
          <g>
            {/* Tail */}
            <path
              d="M 45 130 Q 10 140, 25 115 Q 38 110, 50 120 Z"
              fill={`url(#${bodyGradId})`}
              stroke={`url(#${spikeGradId})`}
              strokeWidth="2.5"
            />

            {/* Legs */}
            <ellipse cx="60" cy="165" rx="16" ry="16" fill={`url(#${spikeGradId})`} />
            <ellipse cx="100" cy="165" rx="16" ry="16" fill={`url(#${spikeGradId})`} />
            <rect x="44" y="160" width="32" height="15" fill={`url(#${spikeGradId})`} rx="6" />
            <rect x="84" y="160" width="32" height="15" fill={`url(#${spikeGradId})`} rx="6" />
            
            <circle cx="50" cy="175" r="3" fill="#FFF" />
            <circle cx="60" cy="176" r="3" fill="#FFF" />
            <circle cx="70" cy="175" r="3" fill="#FFF" />
            <circle cx="90" cy="175" r="3" fill="#FFF" />
            <circle cx="100" cy="176" r="3" fill="#FFF" />
            <circle cx="110" cy="175" r="3" fill="#FFF" />

            {/* Body */}
            <path
              d="M 40 120 C 40 90, 110 90, 115 125 C 120 145, 105 160, 80 160 C 55 160, 40 145, 40 120 Z"
              fill={`url(#${bodyGradId})`}
              stroke={`url(#${spikeGradId})`}
              strokeWidth="2.5"
            />
            {/* Belly Patch */}
            <ellipse cx="78" cy="128" rx="26" ry="22" fill={`url(#${bellyGradId})`} />
            {/* Belly patch shading */}
            <ellipse cx="78" cy="128" rx="26" ry="22" fill="url(#dino-shadow)" />

            {/* Head Shield / Frill (Triceratops shield) */}
            <path
              d="M 55 75 C 45 25, 145 25, 135 75 Z"
              fill={`url(#${spikeGradId})`}
              stroke={`url(#${bodyGradId})`}
              strokeWidth="3.5"
            />
            {/* Frill Spikes */}
            <circle cx="62" cy="42" r="5.5" fill="#FFF" />
            <circle cx="80" cy="30" r="5.5" fill="#FFF" />
            <circle cx="100" cy="26" r="5.5" fill="#FFF" />
            <circle cx="120" cy="30" r="5.5" fill="#FFF" />
            <circle cx="138" cy="42" r="5.5" fill="#FFF" />

            {/* Head */}
            <circle cx="110" cy="85" r="34" fill={`url(#${bodyGradId})`} stroke={`url(#${spikeGradId})`} strokeWidth="2.5" />

            {/* Highlights on Head */}
            <path
              d="M 90 70 C 92 60, 118 60, 125 70"
              stroke="url(#dino-highlight)"
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
              opacity="0.8"
            />

            {/* Horns */}
            {/* Left horn */}
            <path d="M 95 62 L 76 46 L 92 56 Z" fill="#FFFFFF" stroke={`url(#${spikeGradId})`} strokeWidth="1.5" />
            {/* Right horn */}
            <path d="M 125 62 L 144 46 L 128 56 Z" fill="#FFFFFF" stroke={`url(#${spikeGradId})`} strokeWidth="1.5" />
            {/* Nose horn */}
            <path d="M 132 88 L 148 84 L 134 94 Z" fill="#FFFFFF" stroke={`url(#${spikeGradId})`} strokeWidth="1.5" />

            {/* Mouth */}
            <path
              d={animation === 'sad' ? 'M 110 106 Q 120 100, 130 106' : 'M 110 102 Q 120 114, 130 102'}
              stroke="#212121"
              strokeWidth="3.5"
              fill="none"
              strokeLinecap="round"
            />

            {/* Face details */}
            {renderCheeks()}
            {renderEyes()}
          </g>
        );
      case 'pterodactyl':
        return (
          <g>
            {/* Tail */}
            <path
              d="M 50 140 Q 35 155, 45 135 Z"
              fill={`url(#${bodyGradId})`}
              stroke={`url(#${spikeGradId})`}
              strokeWidth="2"
            />

            {/* Legs */}
            <rect x="68" y="150" width="6" height="20" fill={`url(#${spikeGradId})`} />
            <rect x="86" y="150" width="6" height="20" fill={`url(#${spikeGradId})`} />
            <polygon points="65,170 77,170 71,165" fill={`url(#${spikeGradId})`} />
            <polygon points="83,170 95,170 89,165" fill={`url(#${spikeGradId})`} />

            {/* Left Wing */}
            <path
              d="M 52 110 Q 5 90, 20 135 Q 40 120, 52 122 Z"
              fill={`url(#${spikeGradId})`}
              stroke={`url(#${bodyGradId})`}
              strokeWidth="2"
            />

            {/* Right Wing */}
            <path
              d="M 108 110 Q 155 90, 140 135 Q 120 120, 108 122 Z"
              fill={`url(#${spikeGradId})`}
              stroke={`url(#${bodyGradId})`}
              strokeWidth="2"
            />

            {/* Body */}
            <path
              d="M 50 110 C 50 85, 110 85, 110 110 C 110 130, 95 150, 80 150 C 65 150, 50 130, 50 110 Z"
              fill={`url(#${bodyGradId})`}
              stroke={`url(#${spikeGradId})`}
              strokeWidth="2.5"
            />
            {/* Belly Patch */}
            <ellipse cx="80" cy="120" rx="18" ry="20" fill={`url(#${bellyGradId})`} />
            <ellipse cx="80" cy="120" rx="18" ry="20" fill="url(#dino-shadow)" />

            {/* Head Crest */}
            <path
              d="M 75 75 Q 45 55, 68 50 Q 80 55, 85 70 Z"
              fill={`url(#${spikeGradId})`}
              stroke={`url(#${bodyGradId})`}
              strokeWidth="1.5"
            />

            {/* Head */}
            <circle cx="100" cy="72" r="28" fill={`url(#${bodyGradId})`} stroke={`url(#${spikeGradId})`} strokeWidth="2.5" />

            {/* Highlight on head */}
            <path
              d="M 86 62 C 86 52, 108 52, 112 62"
              stroke="url(#dino-highlight)"
              strokeWidth="4.5"
              fill="none"
              opacity="0.8"
            />

            {/* Cute Pterodactyl Beak */}
            <path
              d={animation === 'sad' ? 'M 116 75 L 148 84 L 112 85 Z' : 'M 118 72 L 152 76 L 116 88 Z'}
              fill="#FFC107"
              stroke="#FFA000"
              strokeWidth="2"
            />

            {/* Smile line inside beak */}
            {animation !== 'sad' && (
              <path d="M 120 77 Q 133 80, 142 78" stroke="#FFA000" strokeWidth="2" fill="none" />
            )}

            {/* Face Details */}
            {renderCheeks()}
            {renderEyes()}
          </g>
        );
      default:
        return null;
    }
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={`${getAnimationClass()} ${className}`}
      style={{ overflow: 'visible' }}
    >
      {/* Definitions of gradients and shadows */}
      {renderDefs()}
      
      <g>
        {/* Render actual dinosaur body & limbs */}
        {renderDinosaur()}
        
        {/* Render accessorize layer (positioned relative to head coordinates 100, 65) */}
        {renderAccessory()}
      </g>
    </svg>
  );
};
