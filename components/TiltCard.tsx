import React, { useRef, useState } from 'react';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  noTilt?: boolean;
}

const TiltCard: React.FC<TiltCardProps> = ({ children, className = '', glowColor = 'cyan', noTilt = false }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || noTilt) return;
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Smoother, subtler rotation
    const rotateX = ((y - centerY) / centerY) * -3; 
    const rotateY = ((x - centerX) / centerX) * 3;

    setRotate({ x: rotateX, y: rotateY });
    setGlowPos({ x: (x / rect.width) * 100, y: (y / rect.height) * 100 });
  };

  const handleMouseEnter = () => setIsHovered(true);

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotate({ x: 0, y: 0 });
  };

  let glowShadow = '';
  let borderGlow = '';

  switch (glowColor) {
    case 'purple':
        glowShadow = 'group-hover:shadow-[0_0_25px_-5px_rgba(157,0,255,0.4)]';
        borderGlow = 'group-hover:border-neon-purple/40';
        break;
    case 'green':
        glowShadow = 'group-hover:shadow-[0_0_25px_-5px_rgba(10,255,96,0.3)]';
        borderGlow = 'group-hover:border-neon-green/40';
        break;
    case 'red':
        glowShadow = 'group-hover:shadow-[0_0_25px_-5px_rgba(255,0,85,0.4)]';
        borderGlow = 'group-hover:border-neon-red/40';
        break;
    default: // cyan
        glowShadow = 'group-hover:shadow-[0_0_25px_-5px_rgba(0,243,255,0.3)]';
        borderGlow = 'group-hover:border-neon-blue/40';
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative group transition-all duration-500 ease-out transform-gpu glass-panel rounded-2xl border border-white/5 ${glowShadow} ${borderGlow} ${className}`}
      style={{
        transform: !noTilt ? `perspective(1000px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) scale3d(1, 1, 1)` : 'none',
      }}
    >
       {/* Ambient internal light following mouse */}
       <div 
         className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
         style={{
            background: `radial-gradient(600px circle at ${glowPos.x}% ${glowPos.y}%, rgba(255,255,255,0.06), transparent 40%)`
         }}
       />
       
       {/* Edge highlight */}
       <div className="absolute inset-0 rounded-2xl pointer-events-none border border-white/5 group-hover:border-white/10 transition-colors duration-300" />
       
      {children}
    </div>
  );
};

export default TiltCard;