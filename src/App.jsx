import { useState, useEffect, useCallback, useRef } from 'react';
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
  const [foods, setFoods] = useState(() => generateFoods(1));
  
  const directionRef = useRef({ x: 1, y: 0 });
  const nextDirectionRef = useRef({ x: 1, y: 0 });
  const canChangeDirectionRef = useRef(true);

  const resetGame = useCallback(() => {
    const centerPos = Math.floor(gridSize / 2);
    setSnake([{ x: centerPos, y: centerPos }]);
    directionRef.current = { x: 1, y: 0 };
    nextDirectionRef.current = { x: 1, y: 0 };
    canChangeDirectionRef.current = true;
    setFoods(generateFoods(foodCount, gridSize));
    setScore(0);
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

    const gameLoop = setInterval(() => {
      setSnake(prevSnake => {
        directionRef.current = nextDirectionRef.current;
        canChangeDirectionRef.current = true;
        
        const head = prevSnake[0];
        const newHead = {
          x: head.x + directionRef.current.x,
          y: head.y + directionRef.current.y
        };

        if (newHead.x < 0 || newHead.x >= gridSize || newHead.y < 0 || newHead.y >= gridSize) {
          setGameOver(true);
          setIsPlaying(false);
          return prevSnake;
        }

        if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
          setGameOver(true);
          setIsPlaying(false);
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];
        
        // Check for food collision
        const foodIndex = foods.findIndex(f => f.x === newHead.x && f.y === newHead.y);
        if (foodIndex !== -1) {
          setScore(prev => prev + 10);
          // Replace eaten food with new one
          setFoods(prev => {
            const newFoods = [...prev];
            newFoods[foodIndex] = getRandomPosition(gridSize);
            return newFoods;
          });
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    }, gameSpeed);

    return () => clearInterval(gameLoop);
  }, [isPlaying, gameOver, foods, difficulty]);

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
        height: gridSize * CELL_SIZE
      }}>
        {snake.map((segment, index) => (
          <div
            key={index}
            className="snake-segment"
            style={{
              left: segment.x * CELL_SIZE,
              top: segment.y * CELL_SIZE
            }}
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