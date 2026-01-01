import React, { useRef, useEffect, useState, useCallback } from 'react';
import { X, Hammer, Volume2, VolumeX, Star, Zap, ArrowUp } from 'lucide-react';
import { UserStats, GameProgress, Pet } from '../types';
import { LEVELS, COINS_TO_PASS_LEVEL, MAMMALS, POP_CULTURE, TREASURES, COINS_PER_DIG } from '../constants';

interface MiningGameProps {
  stats: UserStats;
  progress: GameProgress;
  onClose: () => void;
  onUpdateStats: (newStats: UserStats) => void;
  onUpdateProgress: (newProgress: GameProgress) => void;
  onFindPet: (pet: Pet) => void;
}

// Physics Constants
const GRAVITY = 0.6;
const SPEED = 5;
const JUMP_FORCE = -14;
const TILE_SIZE = 40;

// Particle Interface
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number; // 0 to 1
}

interface RewardInfo {
    name: string;
    icon: string;
    rarity: number;
    type: 'GOLD' | 'PET' | 'ITEM';
}

const MiningGame: React.FC<MiningGameProps> = ({ 
  stats, 
  progress, 
  onClose, 
  onUpdateStats, 
  onUpdateProgress,
  onFindPet
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const cheerRef = useRef<HTMLAudioElement>(null);

  const [gameState, setGameState] = useState<'PLAYING' | 'MSG' | 'REWARD' | 'DIGGING'>('PLAYING');
  const [message, setMessage] = useState('');
  const [msgColor, setMsgColor] = useState('white');
  const [rewardItem, setRewardItem] = useState<RewardInfo | null>(null);
  const [localCoins, setLocalCoins] = useState(progress.levelCoinsFound);
  const [localShovels, setLocalShovels] = useState(stats.shovels);
  const [isMuted, setIsMuted] = useState(false);
  
  // Track pressed state for visual feedback on virtual buttons
  const [activeBtn, setActiveBtn] = useState<string | null>(null);

  // Game Engine State
  const playerRef = useRef({ 
    x: 100, y: 100, vx: 0, vy: 0, 
    width: 32, height: 44, 
    grounded: false, facingRight: true,
    animFrame: 0,
    action: 'IDLE' as 'IDLE' | 'RUN' | 'JUMP' | 'DIG',
    digTimer: 0 // 0 to 30 frames
  });
  
  const particlesRef = useRef<Particle[]>([]);
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const levelMapRef = useRef<{x: number, y: number, w: number, h: number, type: 'ground' | 'platform' | 'obstacle' | 'wall' | 'npc', npcType?: string, animOffset?: number}[]>([]);
  const cameraRef = useRef({ x: 0 });
  const gameLoopRef = useRef<number>(0);
  const globalTimeRef = useRef(0);
  
  const currentLevelData = LEVELS[progress.currentLevelIndex];

  // Toggle Music
  const toggleMusic = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.play().catch(e => console.log("Audio play failed:", e));
      } else {
        audioRef.current.pause();
      }
      setIsMuted(!isMuted);
    }
  };

  // Start Music on mount
  useEffect(() => {
    if (audioRef.current && !isMuted) {
      audioRef.current.volume = 0.4;
      audioRef.current.play().catch(() => setIsMuted(true)); 
    }
  }, []);

  // Helper to spawn particles
  const spawnParticles = (x: number, y: number, count: number, colors: string[]) => {
      for(let i=0; i<count; i++) {
          particlesRef.current.push({
              x, 
              y,
              vx: (Math.random() - 0.5) * 8,
              vy: (Math.random() - 1) * 8 - 2,
              color: colors[Math.floor(Math.random() * colors.length)],
              size: Math.random() * 4 + 2,
              life: 1.0
          });
      }
  };

  // Helper to get NPC type based on theme
  const getThemeNPC = (theme: string) => {
      const rand = Math.random();
      if (theme === 'desert' || theme === 'egypt') {
          if (rand < 0.3) return 'pharaoh';
          if (rand < 0.6) return 'resident';
          return 'camel';
      }
      if (theme === 'space' || theme === 'mars') {
          if (rand < 0.5) return 'alien';
          return 'spaceship';
      }
      if (theme === 'city') return rand < 0.5 ? 'car' : 'resident';
      if (theme === 'snow') return 'penguin';
      if (theme === 'jungle') return 'snake';
      if (theme === 'coast' || theme === 'beach' || theme === 'island') return 'crab';
      
      return 'slime'; // Generic
  };

  // Procedural Level Generation
  const generateLevel = useCallback(() => {
    const map: typeof levelMapRef.current = [];
    const groundY = 500;
    const levelLength = 6000; 

    // 1. Continuous Floor (No pits)
    for (let x = -500; x < levelLength + 500; x += TILE_SIZE) {
        map.push({ x, y: groundY, w: TILE_SIZE, h: TILE_SIZE, type: 'ground' });
    }

    // 2. Platforms & Obstacles / NPCs
    let x = 600;
    while(x < levelLength - 400) {
        const gap = 200 + Math.random() * 300;
        x += gap;

        // Platform Chance
        if (Math.random() < 0.6) {
             const h = Math.random() > 0.5 ? 120 : 220;
             const w = TILE_SIZE * (3 + Math.floor(Math.random() * 3));
             map.push({ x, y: groundY - h, w, h: 20, type: 'platform' });
             
             // Item on platform
             if (Math.random() < 0.3) {
                 const npcType = getThemeNPC(currentLevelData.theme || '');
                 map.push({ x: x + w/2 - 20, y: groundY - h - 40, w: 40, h: 40, type: 'npc', npcType, animOffset: Math.random() * 100 });
             }
        } else {
             // Ground NPC/Obstacle
             const npcType = getThemeNPC(currentLevelData.theme || '');
             let w = 40, h = 40;
             if (npcType === 'camel') { w = 60; h = 50; }
             if (npcType === 'car') { w = 70; h = 35; }
             if (npcType === 'spaceship') { w = 60; h = 40; }

             map.push({ x, y: groundY - h, w, h, type: 'npc', npcType, animOffset: Math.random() * 100 });
        }
    }
    
    // Walls
    map.push({ x: -40, y: -1000, w: 40, h: 2000, type: 'wall' });
    map.push({ x: levelLength, y: -1000, w: 40, h: 2000, type: 'wall' });

    levelMapRef.current = map;
    playerRef.current = { ...playerRef.current, x: 100, y: 300, vx: 0, vy: 0, action: 'IDLE' };
  }, [currentLevelData]);

  // Initial Level Generation (Run once per level index)
  useEffect(() => {
    generateLevel();
  }, [generateLevel]);

  // Start Dig Animation
  const startDig = () => {
      if (playerRef.current.action === 'DIG' || gameState === 'REWARD' || gameState === 'MSG') return;
      if (!playerRef.current.grounded) {
          showMessage("只能在地面挖掘!", '#FF8888');
          return;
      }
      
      playerRef.current.action = 'DIG';
      playerRef.current.digTimer = 0;
      setGameState('DIGGING');
  };

  // Resolve Dig Result (Called after animation)
  const resolveDig = () => {
      const rand = Math.random() * 100;
      let resultType: 'GOLD' | 'ITEM' | 'PET' | 'NOTHING' = 'NOTHING';
      
      // New Probabilities:
      // Gold: 30% (0-30)
      // Item: 30% (30-60)
      // Pet: 15% (60-75)
      // Nothing: 25% (75-100)
      
      if (rand < 30) resultType = 'GOLD';
      else if (rand < 60) resultType = 'ITEM';
      else if (rand < 75) resultType = 'PET';
      else resultType = 'NOTHING';
      
      let newTotalCoins = stats.coins;
      const p = playerRef.current;
      
      // Particles
      if (resultType === 'GOLD') {
           spawnParticles(p.x + (p.facingRight ? 32 : 0), p.y + 32, 10, ['#FFD700', '#FFA500', '#FFFFFF']);
      } else if (resultType === 'NOTHING') {
           spawnParticles(p.x + (p.facingRight ? 32 : 0), p.y + 32, 5, ['#8B4513', '#A0522D']);
      } else {
           spawnParticles(p.x + (p.facingRight ? 32 : 0), p.y + 32, 12, ['#FF69B4', '#00BFFF', '#7FFF00']);
      }

      if (resultType === 'GOLD') {
          // Gold requires shovel
          if (localShovels > 0) {
              const newShovels = localShovels - 1;
              const newCoins = localCoins + COINS_PER_DIG; 
              setLocalShovels(newShovels);
              setLocalCoins(newCoins);
              newTotalCoins += COINS_PER_DIG;
              
              onUpdateStats({ shovels: newShovels, coins: newTotalCoins });
              onUpdateProgress({ ...progress, levelCoinsFound: newCoins });
              
              showReward({ name: `${COINS_PER_DIG} 金币`, icon: '💰', rarity: 1, type: 'GOLD' });

              if (newCoins >= COINS_TO_PASS_LEVEL) {
                  setTimeout(() => showMessage("关卡目标达成! 继续挖掘吧!", "#00FF00"), 5500);
              }
          } else {
              showMessage("挖掘金币需要铲子!", '#FFD700');
          }
      } else if (resultType === 'PET' || resultType === 'ITEM') {
          // Pet/Item do NOT require shovel
          let list: any[] = [];
          let category: any = 'MAMMAL';
          
          if (resultType === 'PET') {
              list = MAMMALS;
              category = 'MAMMAL';
          } else {
              // Item is split between Pop Culture and Treasures
              const subRand = Math.random();
              if (subRand < 0.5) {
                  list = POP_CULTURE;
                  category = 'POP_CULTURE';
              } else {
                  list = TREASURES;
                  category = 'TREASURE';
              }
          }

          const item = list[Math.floor(Math.random() * list.length)];
          const rarity = Math.floor(Math.random() * 5) + 1;
          
          const newPet: Pet = {
              id: Date.now().toString(),
              name: item.name,
              icon: item.icon,
              category,
              rarity,
              description: category === 'MAMMAL' ? item.region : "稀有收藏",
              obtainedAt: Date.now()
          };

          onFindPet(newPet);
          showReward({ name: item.name, icon: item.icon, rarity, type: resultType });
      } else {
          showMessage("这里空空如也...", '#AAAAAA');
      }

      playerRef.current.action = 'IDLE';
      setGameState(prev => prev === 'REWARD' ? 'REWARD' : 'PLAYING');
  };

  const showReward = (item: RewardInfo) => {
      setRewardItem(item);
      setGameState('REWARD');
      
      // Play sound
      if (!isMuted && cheerRef.current) {
          cheerRef.current.currentTime = 0;
          cheerRef.current.volume = 0.6;
          cheerRef.current.play().catch(e => console.log(e));
      }
      
      // 5 Seconds display
      setTimeout(() => {
          setGameState('PLAYING');
          setRewardItem(null);
      }, 5000);
  };

  const showMessage = (msg: string, color: string) => {
      setMessage(msg);
      setMsgColor(color);
      if (gameState === 'PLAYING') {
        setGameState('MSG');
        setTimeout(() => {
            setGameState(prev => prev === 'MSG' ? 'PLAYING' : prev);
            setMessage('');
        }, 1200);
      }
  };

  const update = () => {
      globalTimeRef.current += 1;
      
      // Update Particles
      particlesRef.current.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.4; // Gravity
          p.vx *= 0.95; // Friction
          p.life -= 0.03;
      });
      particlesRef.current = particlesRef.current.filter(p => p.life > 0);

      // Don't update player physics while showing reward modal
      if (gameState === 'REWARD') return;

      const p = playerRef.current;
      
      // Handle Digging Animation State
      if (p.action === 'DIG') {
          p.digTimer += 1;
          // Spawn dust particles during middle of animation
          if (p.digTimer === 15) {
              spawnParticles(p.x + (p.facingRight ? 24 : 0), p.y + 40, 5, ['#8B4513', '#CD853F']);
          }
          if (p.digTimer > 30) {
              resolveDig();
          }
          return; // Skip movement physics during dig
      }

      const keys = keysRef.current;

      if (keys['ArrowRight']) { p.vx = SPEED; p.facingRight = true; p.action = 'RUN'; }
      else if (keys['ArrowLeft']) { p.vx = -SPEED; p.facingRight = false; p.action = 'RUN'; }
      else { p.vx *= 0.8; p.action = 'IDLE'; }

      if (keys['Space'] && p.grounded) {
          p.vy = JUMP_FORCE;
          p.grounded = false;
          p.action = 'JUMP';
      }

      p.vy += GRAVITY;
      p.x += p.vx;
      p.y += p.vy;
      p.grounded = false;

      // Update Animation Frame
      if (p.action === 'RUN') p.animFrame += 0.2;
      else p.animFrame = 0;

      // Collisions
      const map = levelMapRef.current;
      for (let block of map) {
          if (p.x < block.x + block.w && p.x + p.width > block.x &&
              p.y < block.y + block.h && p.y + p.height > block.y) {
                  
                  if (block.type !== 'ground' && block.type !== 'platform' && block.type !== 'wall') continue; // Ignore NPCs for collision

                  // Landing
                  if (p.vy > 0 && p.y + p.height - p.vy <= block.y + 12) { 
                      p.y = block.y - p.height;
                      p.vy = 0;
                      p.grounded = true;
                      if (p.action === 'JUMP') p.action = 'IDLE'; // Land
                  } 
                  // Ceiling
                  else if (p.vy < 0 && p.y - p.vy >= block.y + block.h - 10) {
                      p.y = block.y + block.h;
                      p.vy = 0;
                  }
                  // Horizontal
                  else if (p.vx > 0) {
                      p.x = block.x - p.width;
                      p.vx = 0;
                  }
                  else if (p.vx < 0) {
                      p.x = block.x + block.w;
                      p.vx = 0;
                  }
              }
      }

      if (p.y > 1000) {
          p.y = 100; p.vy = 0; 
      }

      cameraRef.current.x = p.x - 300;
      if (cameraRef.current.x < 0) cameraRef.current.x = 0;
  };

  // Game Loop & Input Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { 
        keysRef.current[e.code] = true; 
        setActiveBtn(e.code);
    };
    const handleKeyUp = (e: KeyboardEvent) => { 
        keysRef.current[e.code] = false; 
        setActiveBtn(null);
    };
    const handleDigInput = (e: KeyboardEvent) => {
        if (e.code === 'KeyA') startDig();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('keydown', handleDigInput);

    const loop = () => {
        update();
        draw();
        gameLoopRef.current = requestAnimationFrame(loop);
    };
    gameLoopRef.current = requestAnimationFrame(loop);

    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        window.removeEventListener('keydown', handleDigInput);
        cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameState]);

  // Touch Handlers for Virtual Controls
  const handleTouchStart = (code: string) => {
      keysRef.current[code] = true;
      setActiveBtn(code);
      if (code === 'KeyA') startDig(); // Immediate trigger for Dig
      if (code === 'Space' && playerRef.current.grounded) {
          playerRef.current.vy = JUMP_FORCE;
          playerRef.current.grounded = false;
          playerRef.current.action = 'JUMP';
      }
  };
  const handleTouchEnd = (code: string) => {
      keysRef.current[code] = false;
      setActiveBtn(null);
  };

  // 3D Rabbit Drawing Function
  const draw3DRabbit = (ctx: CanvasRenderingContext2D, x: number, y: number, facingRight: boolean, frame: number, action: string, digTimer: number) => {
    ctx.save();
    ctx.translate(x + 16, y + 22);
    if (!facingRight) ctx.scale(-1, 1);
    
    // Animation Modifiers
    let hop = 0;
    let armRot = 0;
    let bodyRot = 0;

    if (action === 'RUN') {
        hop = Math.sin(frame) * 4;
        armRot = Math.sin(frame) * 0.5;
        bodyRot = 0.1;
    } else if (action === 'JUMP') {
        hop = -5;
        armRot = -0.5;
    } else if (action === 'DIG') {
        // Digging Animation Phases
        if (digTimer < 10) {
            // Wind up
            armRot = -1.5 * (digTimer / 10);
            bodyRot = -0.2 * (digTimer / 10);
        } else if (digTimer < 20) {
            // Smash down
            armRot = 1.0; 
            bodyRot = 0.3;
            hop = 2; // Compress
        } else {
            // Recover
            armRot = 0.5;
            bodyRot = 0;
        }
    }

    ctx.rotate(bodyRot);

    // 1. Ears (Long, with depth)
    // Left Ear
    ctx.save();
    ctx.translate(-5, -35 + hop/2);
    ctx.rotate(-0.1 + (action==='RUN' ? Math.cos(frame)*0.1 : 0));
    let earGrad = ctx.createRadialGradient(-3, -10, 2, 0, 0, 15);
    earGrad.addColorStop(0, '#E0E0E0');
    earGrad.addColorStop(1, '#A0A0A0');
    ctx.fillStyle = earGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, 5, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFB7B2'; // Inner
    ctx.beginPath();
    ctx.ellipse(0, 2, 2.5, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Right Ear
    ctx.save();
    ctx.translate(5, -35 + hop/2);
    ctx.rotate(0.1 + (action==='RUN' ? -Math.cos(frame)*0.1 : 0));
    earGrad = ctx.createRadialGradient(-3, -10, 2, 0, 0, 15);
    earGrad.addColorStop(0, '#E0E0E0');
    earGrad.addColorStop(1, '#A0A0A0');
    ctx.fillStyle = earGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, 5, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFB7B2'; // Inner
    ctx.beginPath();
    ctx.ellipse(0, 2, 2.5, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. Body
    const bodyGrad = ctx.createRadialGradient(-5, -5, 5, 0, 5, 20);
    bodyGrad.addColorStop(0, '#F5F5F5');
    bodyGrad.addColorStop(1, '#BDBDBD');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(0, 10 + hop/2, 12, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Belly
    const bellyGrad = ctx.createRadialGradient(0, 10, 2, 0, 12, 8);
    bellyGrad.addColorStop(0, '#FFFFFF');
    bellyGrad.addColorStop(1, '#E0E0E0');
    ctx.fillStyle = bellyGrad;
    ctx.beginPath();
    ctx.ellipse(0, 12 + hop/2, 7, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3. Head
    const headGrad = ctx.createRadialGradient(-5, -20, 5, 0, -15, 18);
    headGrad.addColorStop(0, '#F5F5F5');
    headGrad.addColorStop(1, '#9E9E9E');
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.arc(0, -15 + hop/2, 14, 0, Math.PI * 2);
    ctx.fill();

    // Cheeks
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(-5, -10 + hop/2, 5, 0, Math.PI * 2);
    ctx.arc(5, -10 + hop/2, 5, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.ellipse(-4, -18 + hop/2, 4, 6, 0, 0, Math.PI * 2);
    ctx.ellipse(4, -18 + hop/2, 4, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(-3, -18 + hop/2, 2, 0, Math.PI * 2);
    ctx.arc(3, -18 + hop/2, 2, 0, Math.PI * 2);
    ctx.fill();

    // Nose
    ctx.fillStyle = "#FF8A80";
    ctx.beginPath();
    ctx.ellipse(0, -12 + hop/2, 2.5, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // 4. Feet
    const footGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 8);
    footGrad.addColorStop(0, '#FFF');
    footGrad.addColorStop(1, '#CCC');
    ctx.fillStyle = footGrad;
    
    ctx.save();
    ctx.translate(-8, 24 - (action==='RUN' ? hop : 0)); // Alternating if run
    ctx.beginPath();
    ctx.ellipse(0, 0, 6, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(8, 24 + (action==='RUN' ? hop : 0));
    ctx.beginPath();
    ctx.ellipse(0, 0, 6, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 5. Tail
    ctx.fillStyle = "#FFF";
    ctx.beginPath();
    ctx.arc(-10, 18 + hop/2, 5, 0, Math.PI * 2);
    ctx.fill();

    // 6. Shovel (Animated)
    ctx.save();
    ctx.translate(12, 5 + hop/2);
    ctx.rotate(armRot); // Animate arm
    
    // Handle
    ctx.fillStyle = "#8D6E63";
    ctx.fillRect(-2, -10, 4, 20);
    // Blade
    const bladeGrad = ctx.createLinearGradient(-5, 10, 5, 16);
    bladeGrad.addColorStop(0, '#FDD835');
    bladeGrad.addColorStop(1, '#F57F17');
    ctx.fillStyle = bladeGrad;
    ctx.beginPath();
    ctx.moveTo(-6, 10);
    ctx.lineTo(6, 10);
    ctx.lineTo(4, 20);
    ctx.lineTo(0, 22);
    ctx.lineTo(-4, 20);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.restore();
  };

  const drawBackground = (ctx: CanvasRenderingContext2D, width: number, height: number, camX: number) => {
    // Richer Sky Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    if (currentLevelData.theme === 'space' || currentLevelData.theme === 'mars') {
        skyGrad.addColorStop(0, '#000000');
        skyGrad.addColorStop(1, currentLevelData.bg);
    } else {
        skyGrad.addColorStop(0, '#87CEEB'); 
        skyGrad.addColorStop(0.5, currentLevelData.bg); 
        skyGrad.addColorStop(1, '#FFFFFF'); 
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);
    
    // Sun/Moon
    const isSpace = currentLevelData.theme === 'space' || currentLevelData.theme === 'mars';
    ctx.save();
    ctx.shadowBlur = 20;
    ctx.shadowColor = isSpace ? "white" : "yellow";
    ctx.fillStyle = isSpace ? "#F0F0F0" : "#FDB813";
    ctx.beginPath();
    ctx.arc(width - 100, 100, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Parallax
    ctx.save();
    const p1 = (camX * 0.1) % width;
    ctx.translate(-p1, 0);
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.beginPath();
    ctx.moveTo(-width, height);
    for(let i= -width; i < width * 2; i+=100) {
        ctx.lineTo(i, height - 150 - Math.sin(i * 0.01) * 50);
    }
    ctx.lineTo(width * 2, height);
    ctx.fill();
    ctx.restore();

    ctx.save();
    const p2 = (camX * 0.3) % width;
    ctx.translate(-p2, 0);
    if (['desert', 'egypt', 'canyon'].includes(currentLevelData.theme || '')) {
       ctx.fillStyle = "rgba(210, 180, 140, 0.6)";
       for(let i=-1; i<3; i++) {
           ctx.beginPath();
           ctx.moveTo(i*width + 100, height);
           ctx.lineTo(i*width + 300, height - 250);
           ctx.lineTo(i*width + 500, height);
           ctx.fill();
       }
    } else if (['city'].includes(currentLevelData.theme || '')) {
       ctx.fillStyle = "rgba(100, 100, 100, 0.4)";
       for(let i=-1; i<5; i++) {
           ctx.fillRect(i*250, height - 350, 80, 350);
           ctx.fillRect(i*250+100, height - 200, 60, 200);
       }
    } else if (['space'].includes(currentLevelData.theme || '')) {
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        for(let i=0; i<100; i++) {
             ctx.fillRect(Math.random()*width*2, Math.random()*height, Math.random()*2, Math.random()*2);
        }
    }
    ctx.restore();
  };

  const drawNPC = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, type: string, animOffset: number) => {
    // Global animation time
    const t = globalTimeRef.current + animOffset;
    const bounce = Math.sin(t * 0.1) * 3;
    const sway = Math.cos(t * 0.05) * 2;

    // Shadow (Static)
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.beginPath();
    ctx.ellipse(x + w/2, y + h - 2, w/2, 5, 0, 0, Math.PI*2);
    ctx.fill();

    // Apply Animation Transform
    ctx.save();
    ctx.translate(0, bounce * (type === 'alien' || type === 'spaceship' ? 2 : 0.5)); // Float vs Bounce

    if (type === 'camel') {
        // Body
        ctx.fillStyle = "#C19A6B";
        ctx.beginPath();
        ctx.ellipse(x + w/2, y + h/2, w/2.2, h/3, 0, 0, Math.PI*2);
        ctx.fill();
        // Humps
        ctx.beginPath();
        ctx.arc(x + w/3, y + h/3, 10, Math.PI, 0);
        ctx.arc(x + w*2/3, y + h/3, 10, Math.PI, 0);
        ctx.fill();
        // Neck & Head (Bobbing)
        ctx.save();
        ctx.translate(0, Math.sin(t*0.2)*2);
        ctx.beginPath();
        ctx.moveTo(x + w - 10, y + h/2);
        ctx.lineTo(x + w, y + h/4);
        ctx.lineTo(x + w + 10, y + h/4 - 5);
        ctx.lineWidth = 8;
        ctx.strokeStyle = "#C19A6B";
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x+w+10, y+h/4-5, 8, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();
    } 
    else if (type === 'pharaoh') {
        // Body
        ctx.fillStyle = "white";
        ctx.fillRect(x + w/2 - 10, y + h/3, 20, h*2/3);
        // Head
        ctx.fillStyle = "#E6C288"; 
        ctx.beginPath();
        ctx.arc(x + w/2 + sway, y + 15, 12, 0, Math.PI*2);
        ctx.fill();
        // Headdress
        ctx.fillStyle = "#FFD700";
        ctx.beginPath();
        ctx.moveTo(x + w/2 - 15 + sway, y + 25);
        ctx.quadraticCurveTo(x + w/2 + sway, y - 5, x + w/2 + 15 + sway, y + 25);
        ctx.fill();
        // Stripes
        ctx.strokeStyle = "#00008B";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + w/2 - 12 + sway, y + 10); ctx.lineTo(x + w/2 + 12 + sway, y + 10);
        ctx.stroke();
    }
    else if (type === 'alien') {
        // Body
        ctx.fillStyle = "#32CD32"; 
        ctx.beginPath();
        ctx.ellipse(x + w/2, y + h/2, 10, 15 + Math.sin(t*0.2)*2, 0, 0, Math.PI*2);
        ctx.fill();
        // Head
        ctx.beginPath();
        ctx.ellipse(x + w/2, y + 10, 15, 12, 0, 0, Math.PI*2);
        ctx.fill();
        // Eyes
        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.ellipse(x + w/2 - 6, y + 8, 4, 6, -0.2, 0, Math.PI*2);
        ctx.ellipse(x + w/2 + 6, y + 8, 4, 6, 0.2, 0, Math.PI*2);
        ctx.fill();
    }
    else if (type === 'spaceship') {
        // Dome
        ctx.fillStyle = "#87CEEB";
        ctx.beginPath();
        ctx.arc(x + w/2, y + h/2 - 5, 15, Math.PI, 0);
        ctx.fill();
        // Disk (Spin effect via width change)
        ctx.fillStyle = "#C0C0C0";
        ctx.beginPath();
        const spin = Math.abs(Math.sin(t * 0.1));
        ctx.ellipse(x + w/2, y + h/2, 25, 8, 0, 0, Math.PI*2);
        ctx.fill();
        // Lights
        ctx.fillStyle = `hsl(${t * 5}, 100%, 50%)`;
        ctx.beginPath();
        ctx.arc(x + w/2 - 15, y + h/2, 3, 0, Math.PI*2);
        ctx.arc(x + w/2, y + h/2 + 4, 3, 0, Math.PI*2);
        ctx.arc(x + w/2 + 15, y + h/2, 3, 0, Math.PI*2);
        ctx.fill();
    }
    else if (type === 'car') {
        ctx.fillStyle = "#FF4500";
        ctx.fillRect(x, y + h/2 - 2 + Math.random()*2, w, h/2); // Vibrate
        ctx.fillRect(x + 10, y + 5, w - 20, h/2);
        // Wheels
        ctx.fillStyle = "#333";
        ctx.save();
        ctx.translate(x + 15, y + h);
        ctx.rotate(t * 0.5);
        ctx.fillRect(-6, -2, 12, 4); // Spokes
        ctx.fillRect(-2, -6, 4, 12);
        ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI*2); ctx.stroke();
        ctx.restore();
        
        ctx.save();
        ctx.translate(x + w - 15, y + h);
        ctx.rotate(t * 0.5);
        ctx.fillRect(-6, -2, 12, 4); 
        ctx.fillRect(-2, -6, 4, 12);
        ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI*2); ctx.stroke();
        ctx.restore();
    }
    else if (type === 'penguin') {
        ctx.save();
        ctx.translate(x + w/2, y + h/2);
        ctx.rotate(Math.sin(t * 0.2) * 0.2); // Waddle
        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.ellipse(0, 0, 12, 18, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.ellipse(0, 2, 8, 14, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = "orange";
        ctx.beginPath();
        ctx.moveTo(-2, 10); ctx.lineTo(2, 10); ctx.lineTo(0, 14);
        ctx.fill();
        ctx.restore();
    }
    else if (type === 'crab') {
        // Scuttle claws
        const open = Math.sin(t * 0.3) > 0;
        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.ellipse(x + w/2, y + h/2 + 5, 15, 10, 0, 0, Math.PI*2);
        ctx.fill();
        // Claws
        ctx.beginPath();
        ctx.arc(x - (open?2:0), y + 5, 6, 0, Math.PI*2);
        ctx.arc(x + w + (open?2:0), y + 5, 6, 0, Math.PI*2);
        ctx.fill();
        // Eyes
        ctx.strokeStyle = "red";
        ctx.beginPath();
        ctx.moveTo(x+w/2-5, y+h/2); ctx.lineTo(x+w/2-5, y);
        ctx.moveTo(x+w/2+5, y+h/2); ctx.lineTo(x+w/2+5, y);
        ctx.stroke();
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(x+w/2-5, y, 3, 0, Math.PI*2);
        ctx.arc(x+w/2+5, y, 3, 0, Math.PI*2);
        ctx.fill();
    }
    else {
        // Generic Blob
        ctx.fillStyle = "#FF69B4";
        ctx.beginPath();
        ctx.arc(x + w/2, y + h/2, w/3 + Math.sin(t*0.2)*2, 0, Math.PI*2);
        ctx.fill();
        // Eyes
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(x + w/2 - 5 + sway, y + h/2 - 5, 4, 0, Math.PI*2);
        ctx.arc(x + w/2 + 5 + sway, y + h/2 - 5, 4, 0, Math.PI*2);
        ctx.fill();
    }

    ctx.restore();
  };

  const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      const camX = cameraRef.current.x;

      drawBackground(ctx, width, height, camX);

      ctx.save();
      ctx.translate(-camX, 0);

      // Blocks
      levelMapRef.current.forEach(block => {
          if (block.type === 'ground' || block.type === 'platform') {
              const groundGrad = ctx.createLinearGradient(block.x, block.y, block.x, block.y + block.h);
              groundGrad.addColorStop(0, currentLevelData.ground);
              groundGrad.addColorStop(1, '#5D4037'); 
              
              ctx.fillStyle = groundGrad;
              ctx.fillRect(block.x, block.y, block.w, block.h);
              
              ctx.fillStyle = "rgba(255,255,255,0.2)";
              ctx.fillRect(block.x, block.y, block.w, 4); 

              ctx.strokeStyle = "rgba(0,0,0,0.1)";
              ctx.strokeRect(block.x, block.y, block.w, block.h);

              if (block.type === 'ground' && (currentLevelData.theme === 'grassland' || currentLevelData.theme === 'city' || currentLevelData.theme === 'jungle')) {
                  ctx.fillStyle = "#228B22";
                  ctx.fillRect(block.x, block.y, block.w, 8);
              }

          } else if (block.type === 'npc') {
              drawNPC(ctx, block.x, block.y, block.w, block.h, block.npcType || 'slime', block.animOffset || 0);
          } else if (block.type === 'obstacle') {
              ctx.fillStyle = "gray";
              ctx.fillRect(block.x, block.y, block.w, block.h);
          }
      });

      // Particles
      particlesRef.current.forEach(p => {
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.life;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
      });
      ctx.globalAlpha = 1.0;

      // Player
      const p = playerRef.current;
      draw3DRabbit(ctx, p.x, p.y, p.facingRight, p.animFrame, p.action, p.digTimer);

      ctx.restore();

      // UI Text Overlay (Standard Msgs)
      if (gameState === 'MSG') {
          ctx.fillStyle = "rgba(0,0,0,0.7)";
          ctx.fillRect(0, height/2 - 40, width, 80);
          ctx.font = "20px 'Press Start 2P'";
          ctx.fillStyle = msgColor;
          ctx.textAlign = "center";
          ctx.fillText(message, width/2, height/2 + 10);
      }
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
      
      {/* Background Music - Retro Arcade Style */}
      <audio 
        ref={audioRef} 
        loop 
        src="https://assets.mixkit.co/music/preview/mixkit-arcade-retro-run-212.mp3" 
      />

      {/* Cheer Effect Sound */}
      <audio 
        ref={cheerRef} 
        src="https://assets.mixkit.co/sfx/preview/mixkit-video-game-treasure-2066.mp3" 
      />

      {/* Main Console Container (Handheld Style) */}
      <div className="flex flex-row items-center justify-center w-full h-full p-2 md:p-6 bg-[#2f2f2f] relative">
        
        {/* Left Controller (D-Pad) */}
        <div className="w-24 md:w-32 h-full flex flex-col justify-center items-center shrink-0 mr-2 md:mr-4">
             <div className="relative w-32 h-32 md:w-40 md:h-40">
                 {/* Cross D-Pad Background */}
                 <div className="absolute top-1/3 left-0 w-full h-1/3 bg-[#1a1a1a] rounded-sm shadow-inner"></div>
                 <div className="absolute top-0 left-1/3 w-1/3 h-full bg-[#1a1a1a] rounded-sm shadow-inner"></div>

                 {/* Center Pivot */}
                 <div className="absolute top-1/3 left-1/3 w-1/3 h-1/3 bg-[#111] rounded-full radial-gradient(circle, #222 0%, #111 100%)"></div>

                 {/* Left Button */}
                 <button 
                     className={`absolute top-1/3 left-0 w-1/3 h-1/3 bg-[#333] hover:bg-[#444] active:bg-[#222] rounded-l-md flex items-center justify-center touch-none transition-all ${activeBtn === 'ArrowLeft' ? 'translate-y-[2px] shadow-none' : 'shadow-[0_4px_0_#111]'}`}
                     onTouchStart={() => handleTouchStart('ArrowLeft')}
                     onTouchEnd={() => handleTouchEnd('ArrowLeft')}
                     onMouseDown={() => handleTouchStart('ArrowLeft')}
                     onMouseUp={() => handleTouchEnd('ArrowLeft')}
                 >
                     <span className="border-t-[10px] border-r-[15px] border-b-[10px] border-transparent border-r-gray-500/50 -ml-1"></span>
                 </button>

                 {/* Right Button */}
                 <button 
                     className={`absolute top-1/3 right-0 w-1/3 h-1/3 bg-[#333] hover:bg-[#444] active:bg-[#222] rounded-r-md flex items-center justify-center touch-none transition-all ${activeBtn === 'ArrowRight' ? 'translate-y-[2px] shadow-none' : 'shadow-[0_4px_0_#111]'}`}
                     onTouchStart={() => handleTouchStart('ArrowRight')}
                     onTouchEnd={() => handleTouchEnd('ArrowRight')}
                     onMouseDown={() => handleTouchStart('ArrowRight')}
                     onMouseUp={() => handleTouchEnd('ArrowRight')}
                 >
                     <span className="border-t-[10px] border-l-[15px] border-b-[10px] border-transparent border-l-gray-500/50 -mr-1"></span>
                 </button>
                 
                 {/* Up/Down Decorative (Non-functional for side scroller but adds to look) */}
                 <div className="absolute top-0 left-1/3 w-1/3 h-1/3 bg-[#333] rounded-t-md shadow-[0_4px_0_#111] pointer-events-none"></div>
                 <div className="absolute bottom-0 left-1/3 w-1/3 h-1/3 bg-[#333] rounded-b-md shadow-[0_4px_0_#111] pointer-events-none"></div>
             </div>
        </div>

        {/* Screen Container */}
        <div className="flex-1 aspect-[4/3] max-h-full rounded-t-xl md:rounded-xl overflow-hidden shadow-inset-pixel border-[12px] md:border-[20px] border-gray-400 bg-gray-800 relative flex flex-col max-w-[800px]">
            
            {/* Power LED (Cosmetic) */}
            <div className="absolute top-1/2 -left-[16px] md:-left-[26px] -translate-y-1/2 w-2 h-8 md:w-3 md:h-12 bg-red-900 rounded-full flex items-center justify-center">
                 <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_5px_red]"></div>
            </div>

            {/* Canvas */}
            <canvas 
                ref={canvasRef} 
                width={800} 
                height={600}
                className="w-full h-full object-contain image-pixelated bg-black"
            />
            
            {/* HUD Overlay inside Screen */}
            <div className="absolute top-0 left-0 right-0 p-2 md:p-4 flex justify-between items-start pointer-events-none">
                 <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-white font-pixel text-xs md:text-sm drop-shadow-md">
                        <Hammer size={14} className="text-mario-yellow" />
                        <span>x {localShovels}</span>
                    </div>
                    <div className="text-white font-pixel text-[10px] md:text-xs opacity-80">
                        Lvl {progress.currentLevelIndex + 1}
                    </div>
                 </div>

                 <div className="flex gap-2 pointer-events-auto">
                    <button onClick={toggleMusic} className="bg-black/50 p-1 rounded hover:text-mario-blue text-white">
                        {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    </button>
                    <button onClick={onClose} className="bg-black/50 p-1 rounded hover:text-red-500 text-white">
                        <X size={16} />
                    </button>
                 </div>
            </div>

            {/* Level Progress */}
            <div className="absolute bottom-2 right-2 text-mario-yellow font-pixel text-xs drop-shadow-md">
               ${localCoins}/{COINS_TO_PASS_LEVEL}
            </div>

            {/* Reward Modal Overlay */}
            {gameState === 'REWARD' && rewardItem && (
                <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm animate-in zoom-in duration-300">
                    <div className="relative bg-white border-4 border-mario-blue rounded-xl p-4 md:p-8 max-w-sm w-3/4 text-center shadow-[0_0_0_8px_rgba(0,0,0,0.5)] flex flex-col items-center gap-2">
                         <div className="text-6xl md:text-8xl mt-2 filter drop-shadow-md animate-bounce">
                           {rewardItem.icon}
                        </div>
                        <h2 className="text-lg md:text-2xl font-black text-gray-800 font-pixel drop-shadow-sm mt-2">
                           {rewardItem.name}
                        </h2>
                        <div className="flex gap-1 justify-center my-2">
                            {Array.from({length: 5}).map((_, i) => (
                                <Star key={i} size={16} className={i < rewardItem.rarity ? "text-mario-yellow fill-mario-yellow" : "text-gray-300"} />
                            ))}
                        </div>
                        <div className="bg-gray-100 rounded-lg p-2 w-full text-xs font-bold text-gray-500">
                            {rewardItem.type === 'GOLD' ? `+${COINS_PER_DIG} Coins` : '已收录!'}
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Right Controller (Actions) */}
        <div className="w-24 md:w-32 h-full flex flex-col justify-center items-center shrink-0 ml-2 md:ml-4 relative">
             <div className="relative w-32 h-32 md:w-40 md:h-40 rotate-[-15deg]">
                 
                 {/* A Button (Dig) - Right Top */}
                 <div className="absolute top-0 right-2 flex flex-col items-center">
                     <button 
                        className={`w-14 h-14 md:w-16 md:h-16 rounded-full bg-purple-600 border-purple-800 touch-none transition-all flex items-center justify-center ${activeBtn === 'KeyA' ? 'translate-y-[4px] border-b-0' : 'border-b-4 shadow-lg'}`}
                        onTouchStart={() => handleTouchStart('KeyA')}
                        onTouchEnd={() => handleTouchEnd('KeyA')}
                        onMouseDown={() => handleTouchStart('KeyA')}
                        onMouseUp={() => handleTouchEnd('KeyA')}
                     >
                        <Zap size={24} className="text-purple-200" />
                     </button>
                     <span className="font-pixel text-gray-400 text-xs font-bold mt-1">A</span>
                 </div>

                 {/* B Button (Jump) - Left Bottom */}
                 <div className="absolute bottom-4 left-2 flex flex-col items-center">
                     <button 
                        className={`w-14 h-14 md:w-16 md:h-16 rounded-full bg-purple-600 border-purple-800 touch-none transition-all flex items-center justify-center ${activeBtn === 'Space' ? 'translate-y-[4px] border-b-0' : 'border-b-4 shadow-lg'}`}
                        onTouchStart={() => handleTouchStart('Space')}
                        onTouchEnd={() => handleTouchEnd('Space')}
                        onMouseDown={() => handleTouchStart('Space')}
                        onMouseUp={() => handleTouchEnd('Space')}
                     >
                        <ArrowUp size={28} className="text-purple-200" />
                     </button>
                     <span className="font-pixel text-gray-400 text-xs font-bold mt-1">B</span>
                 </div>
             </div>
             
             {/* Decorative Speaker Grille */}
             <div className="absolute bottom-8 right-4 flex gap-1 rotate-[-15deg] opacity-30">
                 <div className="w-1 h-8 bg-black rounded-full"></div>
                 <div className="w-1 h-8 bg-black rounded-full"></div>
                 <div className="w-1 h-8 bg-black rounded-full"></div>
                 <div className="w-1 h-8 bg-black rounded-full"></div>
             </div>
        </div>

      </div>
    </div>
  );
};

export default MiningGame;