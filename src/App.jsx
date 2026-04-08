import { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SPEED = 120;

const getRandomPosition = () => {
  return {
    x: Math.floor(Math.random() * GRID_SIZE),
    y: Math.floor(Math.random() * GRID_SIZE)
  };
};

const App = () => {
  const [snake, setSnake] = useState([{ x: 10, y: 10 }]);
  const [direction, setDirection] = useState({ x: 1, y: 0 });
  const [food, setFood] = useState(getRandomPosition);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const directionRef = useRef(direction);

  const resetGame = useCallback(() => {
    setSnake([{ x: 10, y: 10 }]);
    setDirection({ x: 1, y: 0 });
    directionRef.current = { x: 1, y: 0 };
    setFood(getRandomPosition());
    setScore(0);
    setGameOver(false);
    setIsPlaying(true);
  }, []);

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
          e.preventDefault();
          if (directionRef.current.y !== 0) break;
          setDirection({ x: 0, y: -1 });
          directionRef.current = { x: 0, y: -1 };
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (directionRef.current.y !== 0) break;
          setDirection({ x: 0, y: 1 });
          directionRef.current = { x: 0, y: 1 };
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (directionRef.current.x !== 0) break;
          setDirection({ x: -1, y: 0 });
          directionRef.current = { x: -1, y: 0 };
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (directionRef.current.x !== 0) break;
          setDirection({ x: 1, y: 0 });
          directionRef.current = { x: 1, y: 0 };
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameOver, isPlaying, resetGame]);

  useEffect(() => {
    if (!isPlaying || gameOver) return;

    const gameLoop = setInterval(() => {
      setSnake(prevSnake => {
        const head = prevSnake[0];
        const newHead = {
          x: head.x + directionRef.current.x,
          y: head.y + directionRef.current.y
        };

        // Wall collision
        if (
          newHead.x < 0 ||
          newHead.x >= GRID_SIZE ||
          newHead.y < 0 ||
          newHead.y >= GRID_SIZE
        ) {
          setGameOver(true);
          setIsPlaying(false);
          return prevSnake;
        }

        // Self collision
        if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
          setGameOver(true);
          setIsPlaying(false);
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        // Food collision
        if (newHead.x === food.x && newHead.y === food.y) {
          setScore(prev => prev + 10);
          setFood(getRandomPosition());
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    }, INITIAL_SPEED);

    return () => clearInterval(gameLoop);
  }, [isPlaying, gameOver, food]);

  return (
    <div className="game-container">
      <h1>Snake Game</h1>
      <div className="score">Score: {score}</div>
      
      <div className="game-board">
        {snake.map((segment, index) => (
          <div
            key={index}
            className="snake-segment"
            style={{
              left: segment.x * CELL_SIZE,
              top: segment.y * CELL_SIZE,
              width: CELL_SIZE - 1,
              height: CELL_SIZE - 1,
            }}
          />
        ))}
        <div
          className="food"
          style={{
            left: food.x * CELL_SIZE,
            top: food.y * CELL_SIZE,
            width: CELL_SIZE - 1,
            height: CELL_SIZE - 1,
          }}
        />
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
        {isPlaying && <p>Use Arrow Keys to control snake</p>}
      </div>
    </div>
  );
};

export default App;