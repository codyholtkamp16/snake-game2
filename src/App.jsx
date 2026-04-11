import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import './App.css';

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const BASE_SPEED = 120;

const getRandomPosition = (gridSize) => {
  return {
    x: Math.floor(Math.random() * gridSize),
    y: Math.floor(Math.random() * gridSize)
  };
};

const generateFoods = (count, gridSize) => {
  const foods = [];
  for (let i = 0; i < count; i++) {
    foods.push(getRandomPosition(gridSize));
  }
  return foods;
};

const DIFFICULTY_OPTIONS = [
  { label: 'Easy (75% Speed)', value: 'easy', speedMultiplier: 0.75 },
  { label: 'Medium (100% Speed)', value: 'medium', speedMultiplier: 1 },
  { label: 'Hard (125% Speed)', value: 'hard', speedMultiplier: 1.25 }
];

const FOOD_OPTIONS = [
  { label: '1 Food', value: 1 },
  { label: '5 Foods', value: 5 },
  { label: '10 Foods', value: 10 }
];

const GRID_SIZE_OPTIONS = [
  { label: '15x15', value: 15 },
  { label: '20x20', value: 20 },
  { label: '25x25', value: 25 }
];

const App = () => {
  const [snake, setSnake] = useState([{ x: 10, y: 10 }]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [difficulty, setDifficulty] = useState('medium');
  const [foodCount, setFoodCount] = useState(1);
  const [gridSize, setGridSize] = useState(20);
  const [foods, setFoods] = useState(() => generateFoods(1, 20));
  const [time, setTime] = useState(0);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderFrame, setRenderFrame] = useState(0);
  
  const directionRef = useRef({ x: 1, y: 0 });
  const nextDirectionRef = useRef({ x: 1, y: 0 });
  const canChangeDirectionRef = useRef(true);
  const lastSnakeRef = useRef(null);
  const renderFrameRef = useRef(0);

  const resetGame = useCallback(() => {
    const centerPos = Math.floor(gridSize / 2);
    const newSnake = [{ x: centerPos, y: centerPos }];
    setSnake(newSnake);
    lastSnakeRef.current = newSnake;
    directionRef.current = { x: 1, y: 0 };
    nextDirectionRef.current = { x: 1, y: 0 };
    canChangeDirectionRef.current = true;
    setFoods(generateFoods(foodCount, gridSize));
    setScore(0);
    setTime(0);
    setRenderProgress(0);
    setGameOver(false);
    setIsPlaying(true);
  }, [foodCount, gridSize]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === ' ') {
        e.preventDefault();
        if (gameOver || !isPlaying) {
          resetGame();
          return;
        }
      }

        switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          if (!canChangeDirectionRef.current || directionRef.current.y !== 0) break;
          nextDirectionRef.current = { x: 0, y: -1 };
          canChangeDirectionRef.current = false;
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          if (!canChangeDirectionRef.current || directionRef.current.y !== 0) break;
          nextDirectionRef.current = { x: 0, y: 1 };
          canChangeDirectionRef.current = false;
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          if (!canChangeDirectionRef.current || directionRef.current.x !== 0) break;
          nextDirectionRef.current = { x: -1, y: 0 };
          canChangeDirectionRef.current = false;
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          if (!canChangeDirectionRef.current || directionRef.current.x !== 0) break;
          nextDirectionRef.current = { x: 1, y: 0 };
          canChangeDirectionRef.current = false;
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameOver, isPlaying, resetGame]);

  useEffect(() => {
    if (!isPlaying || gameOver) return;

    const speedMultiplier = DIFFICULTY_OPTIONS.find(d => d.value === difficulty)?.speedMultiplier || 1;
    const gameSpeed = Math.round(BASE_SPEED / speedMultiplier);

    let animationId;
    let lastTime = performance.now();
    let accumulator = 0;

    // High precision render loop for fluid movement
    const renderLoop = (currentTime) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;
      accumulator += deltaTime;

      // Smooth progress value 0->1 through each game step
      const progress = Math.min(accumulator / gameSpeed, 1);
      setRenderProgress(progress);

      // Run game logic at fixed timestep
      if (accumulator >= gameSpeed) {
        accumulator -= gameSpeed;
        setTime(t => t + 1);

         // Update snake position without triggering re-render
         const currentSnake = lastSnakeRef.current || snake;
         const newSnake = [];
         const firstSegment = currentSnake[0];
         const newHead = {
           x: firstSegment.x + directionRef.current.x,
           y: firstSegment.y + directionRef.current.y
         };
         newSnake.push(newHead);

         // Add the rest of the body segments
         for (let i = 0; i < currentSnake.length - 1; i++) {
           newSnake.push(currentSnake[i]);
         }

        // Check boundaries and self-collision
        const head = newSnake[0];
        if (head.x < 0 || head.x >= gridSize || head.y < 0 || head.y >= gridSize) {
          setGameOver(true);
          setIsPlaying(false);
          return;
        }

        if (newSnake.slice(1).some(segment => segment.x === head.x && segment.y === head.y)) {
          setGameOver(true);
          setIsPlaying(false);
          return;
        }

        // Check for food collision
        const foodIndex = foods.findIndex(f => f.x === head.x && f.y === head.y);
        if (foodIndex !== -1) {
          setScore(prev => prev + 10);
          setFoods(prev => {
            const newFoods = [...prev];
            newFoods[foodIndex] = getRandomPosition(gridSize);
            return newFoods;
          });
        } else {
          newSnake.pop();
        }

        // Update snake state
        setSnake(newSnake);
        lastSnakeRef.current = newSnake;
        directionRef.current = nextDirectionRef.current;
        canChangeDirectionRef.current = true;
      }

      // Update render frame counter
      setRenderFrame(frame => frame + 1);

      animationId = requestAnimationFrame(renderLoop);
    };

    animationId = requestAnimationFrame(renderLoop);

    return () => cancelAnimationFrame(animationId);
  }, [isPlaying, gameOver, foods, difficulty, gridSize]);

  // Calculate segment color - changes over time for tail
  const getSegmentStyle = useMemo(() => {
    return (index, length, x, y) => {
      const positionProgress = length <= 1 ? 0 : index / (length - 1);
      const timeOffset = time * 1.5;
      const hue = 140 + positionProgress * 45 + Math.sin(timeOffset / 25 + positionProgress * 2) * 15;
      const sat = 80 - (positionProgress * 20);
      const light = 58 - (positionProgress * 28);

      // Get previous position for interpolation
      const prevPos = lastSnakeRef.current && lastSnakeRef.current[index]
        ? lastSnakeRef.current[index]
        : { x, y };

      // Smoothly interpolate between positions
      const smoothX = prevPos.x + (x - prevPos.x) * renderProgress;
      const smoothY = prevPos.y + (y - prevPos.y) * renderProgress;

      return {
        left: smoothX * CELL_SIZE,
        top: smoothY * CELL_SIZE,
        background: index === 0
          ? 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)'
          : 'hsl(' + Math.round(hue % 360) + ', ' + Math.round(sat) + '%, ' + Math.round(light) + '%)',
        opacity: 1 - (positionProgress * 0.12),
        transition: 'none'
      };
    };
  }, [time, renderProgress]);

  return (
    <div className="game-container">
      <h1>Snake Game</h1>
      <div className="score">Score: {score}</div>
      
      <div className="settings-container">
        <div className="setting-group">
          <label>Difficulty:</label>
          <select 
            className="game-select" 
            value={difficulty} 
            onChange={(e) => setDifficulty(e.target.value)}
            disabled={isPlaying}
          >
            {DIFFICULTY_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        
        <div className="setting-group">
          <label>Food Count:</label>
          <select 
            className="game-select" 
            value={foodCount} 
            onChange={(e) => setFoodCount(Number(e.target.value))}
            disabled={isPlaying}
          >
            {FOOD_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        
        <div className="setting-group">
          <label>Map Size:</label>
          <select 
            className="game-select" 
            value={gridSize} 
            onChange={(e) => setGridSize(Number(e.target.value))}
            disabled={isPlaying}
          >
            {GRID_SIZE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="game-board" style={{
        width: gridSize * CELL_SIZE,
        height: gridSize * CELL_SIZE,
        boxSizing: 'content-box'
      }}>
        {snake.map((segment, index) => (
          <div
            key={index}
            className="snake-segment"
            style={getSegmentStyle(index, snake.length, segment.x, segment.y)}
          />
        ))}
        {foods.map((food, index) => (
          <div
            key={index}
            className="food"
            style={{
              left: food.x * CELL_SIZE,
              top: food.y * CELL_SIZE
            }}
          />
        ))}
      </div>

      {gameOver && (
        <div className="game-over">
          <h2>Game Over!</h2>
          <p>Final Score: {score}</p>
        </div>
      )}

      <div className="instructions">
        {!isPlaying && !gameOver && <p>Press SPACE to start</p>}
        {gameOver && <p>Press SPACE to play again</p>}
        {isPlaying && <p>Use Arrow Keys or WASD to control snake</p>}
      </div>
    </div>
  );
};

export default App;