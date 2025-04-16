import React, { useState, useRef, useEffect, useCallback } from 'react';
import styled, { keyframes, css, ThemeProvider } from 'styled-components';

interface Card {
  id: number;
  equation: string;
  question: string;
  isCorrect: boolean;
}

type QuestionType = 
  | 'isWrong'        // Is this equation wrong?
  | 'isOdd'          // Is the answer odd?
  | 'isEven'         // Is the answer even?
  | 'isGreaterThan'  // Is answer greater than X?
  | 'isLessThan'     // Is answer less than X?
  | 'isCorrect'      // Is this statement correct?
  | 'comparison';    // Complex comparison between two expressions

type SimpleOperation = '+' | '-' | '*';

const fadeOutLeft = keyframes`
  from {
    transform: translateX(0) rotate(0);
    opacity: 1;
  }
  to {
    transform: translateX(-200%) rotate(-30deg);
    opacity: 0;
  }
`;

const fadeOutRight = keyframes`
  from {
    transform: translateX(0) rotate(0);
    opacity: 1;
  }
  to {
    transform: translateX(200%) rotate(30deg);
    opacity: 0;
  }
`;

const zoomIn = keyframes`
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
`;

const successAnimation = keyframes`
  0% {
    transform: scale(1);
    opacity: 0;
  }
  50% {
    transform: scale(1.2);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
`;

const failAnimation = keyframes`
  0% {
    transform: scale(1);
    opacity: 0;
  }
  50% {
    transform: scale(1.2);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
`;

const scoreAnimation = keyframes`
  0% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translateY(-50px) scale(1.5);
    opacity: 0;
  }
`;

const fadeOut = keyframes`
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
`;

const CardContainer = styled.div`
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f0f0f0;
  position: relative;
`;

const CardStack = styled.div`
  position: relative;
  width: 300px;
  height: 400px;
`;

const Arrow = styled.div<{ direction: 'left' | 'right'; isVisible: boolean }>`
  position: absolute;
  top: 50%;
  ${props => props.direction === 'left' ? 'left: 20%;' : 'right: 20%;'}
  transform: translateY(-50%);
  font-size: 48px;
  color: ${props => props.direction === 'left' ? '#ff4444' : '#44ff44'};
  opacity: ${props => props.isVisible ? 0.8 : 0};
  transition: opacity 0.3s ease;
  pointer-events: none;
`;

const Controls = styled.div<{ isVisible: boolean }>`
  position: absolute;
  top: calc(100% + 20px);
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 10px 20px;
  border-radius: 20px;
  font-size: 14px;
  opacity: ${props => props.isVisible ? 1 : 0};
  transition: opacity 0.5s ease;
  pointer-events: none;
`;

const GameControls = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  gap: 10px;
`;

const ControlButton = styled.div<{ isRestart?: boolean; negative?: boolean }>`
  background-color: ${props => props.negative ? 'rgba(255, 68, 68, 0.9)' : 'rgba(0, 0, 0, 0.7)'};
  color: white;
  padding: 10px 20px;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: ${props => props.negative ? 'rgba(204, 0, 0, 0.9)' : 'rgba(0, 0, 0, 0.8)'};
  }

  span {
    opacity: 0.5;
  }
`;

const BlurOverlay = styled.div<{ active: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  backdrop-filter: blur(10px);
  opacity: ${props => props.active ? 1 : 0};
  transition: opacity 0.15s ease;
  pointer-events: none;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
`;

const ScoreDisplay = styled.div`
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 10px 20px;
  border-radius: 20px;
  font-size: 18px;
`;

const HighScoreDisplay = styled.div`
  position: absolute;
  top: 20px;
  left: 20px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 10px 20px;
  border-radius: 20px;
  font-size: 18px;
`;

const RestartButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  background-color: #ff4444;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #cc0000;
  }
`;

const CardWrapper = styled.div<{ 
  isDragging: boolean; 
  x: number; 
  y: number; 
  rotation: number;
  isExiting?: boolean;
  exitDirection?: 'left' | 'right';
  isEntering?: boolean;
}>`
  position: absolute;
  width: 100%;
  height: 100%;
  background-color: white;
  border-radius: 20px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  cursor: grab;
  transform: ${props => `translate(${props.x}px, ${props.y}px) rotate(${props.rotation}deg)`};
  transition: ${props => props.isDragging ? 'none' : 'transform 0.1s ease-out'};
  user-select: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  animation: ${props => {
    if (props.isExiting && props.exitDirection === 'left') return fadeOutLeft;
    if (props.isExiting && props.exitDirection === 'right') return fadeOutRight;
    if (props.isEntering) return zoomIn;
    return 'none';
  }} 0.25s ease-out forwards;
`;

const Equation = styled.div`
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 20px;
  color: #333;
`;

const Question = styled.div`
  font-size: 20px;
  color: #666;
  margin-bottom: 10px;
`;

const FeedbackText = styled.div<{ type: 'success' | 'fail' }>`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 48px;
  font-weight: bold;
  color: ${props => props.type === 'success' ? '#0066ff' : '#ff4444'};
  pointer-events: none;
  animation: ${props => props.type === 'success' ? successAnimation : failAnimation} 1s ease-out;
`;

const ScoreChange = styled.div<{ type: 'positive' | 'negative' }>`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 32px;
  font-weight: bold;
  color: ${props => props.type === 'positive' ? '#0066ff' : '#ff4444'};
  pointer-events: none;
  animation: ${scoreAnimation} 1s ease-out;
`;

const TrueFalseText = styled.div<{ side: 'left' | 'right' }>`
  position: absolute;
  top: 50%;
  ${props => props.side === 'left' ? 'left: 20%;' : 'right: 20%;'}
  transform: translateY(-50%);
  font-size: 24px;
  font-weight: bold;
  color: ${props => props.side === 'left' ? '#ff4444' : '#0066ff'};
  opacity: 0.8;
  pointer-events: none;
`;

const GameOverCard = styled(CardWrapper)`
  background: linear-gradient(145deg, #2c3e50, #3498db);
  color: white;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
`;

const GameOverContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
`;

const GameOverTitle = styled.div`
  color: white;
  font-size: 36px;
  font-weight: bold;
  margin-bottom: 30px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
`;

const GameOverScore = styled.div`
  color: white;
  font-size: 72px;
  font-weight: bold;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  margin-bottom: 10px;
`;

const ScoreLabel = styled.div`
  color: rgba(255, 255, 255, 0.8);
  font-size: 20px;
  margin-bottom: 30px;
`;

const GameOverQuestion = styled.div`
  color: rgba(255, 255, 255, 0.9);
  font-size: 24px;
  text-align: center;
`;

const ActionHint = styled(TrueFalseText)<{ side: 'left' | 'right' }>`
  color: ${props => props.side === 'left' ? '#ff4444' : '#0066ff'};
  font-size: 20px;
  opacity: 0.9;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  background: rgba(0, 0, 0, 0.2);
  padding: 10px 20px;
  border-radius: 20px;
  ${props => props.side === 'left' ? 'left: 10%;' : 'right: 10%;'}
`;

const calculateResult = (num1: number, num2: number, operation: SimpleOperation): number => {
  switch (operation) {
    case '+': return num1 + num2;
    case '-': return num1 - num2;
    case '*': return num1 * num2;
    default: return 0;
  }
};

const isOddNumber = (n: number): boolean => {
  return Math.abs(n) % 2 === 1;
};

const isEvenNumber = (n: number): boolean => {
  return Math.abs(n) % 2 === 0;
};

const generateSimpleEquation = (): { equation: string; result: number } => {
  const operations: SimpleOperation[] = ['+', '-', '*'];
  const operation = operations[Math.floor(Math.random() * operations.length)];
  
  let num1: number;
  let num2: number;
  
  if (operation === '*') {
    // For multiplication, one number should be small (1-9)
    if (Math.random() > 0.5) {
      num1 = Math.floor(Math.random() * 9) + 1;  // 1-9
      num2 = Math.floor(Math.random() * 20) + 1; // 1-20
    } else {
      num1 = Math.floor(Math.random() * 20) + 1; // 1-20
      num2 = Math.floor(Math.random() * 9) + 1;  // 1-9
    }
  } else {
    num1 = Math.floor(Math.random() * 12) + 1; // 1-12
    num2 = Math.floor(Math.random() * 12) + 1; // 1-12
  }

  const operatorMap = {
    '+': ' + ',
    '-': ' - ',
    '*': ' × '
  };

  return {
    equation: `${num1}${operatorMap[operation]}${num2}`,
    result: calculateResult(num1, num2, operation)
  };
};

const generateEquation = (): Card => {
  const questionTypes: QuestionType[] = [
    'isWrong', 'isOdd', 'isEven', 'isGreaterThan', 'isLessThan', 'isCorrect', 'comparison'
  ];
  const questionType = questionTypes[Math.floor(Math.random() * questionTypes.length)];

  if (questionType === 'comparison') {
    // Generate complex comparison between two expressions
    const leftSide = generateSimpleEquation();
    const rightSide = generateSimpleEquation();
    
    const comparisons = ['>', '<', '=', '≤', '≥'];
    const comparison = comparisons[Math.floor(Math.random() * comparisons.length)];
    
    const equation = `${leftSide.equation} ${comparison} ${rightSide.equation}`;
    const question = 'Is this statement correct?';
    
    let isCorrect: boolean;
    switch (comparison) {
      case '>':
        isCorrect = leftSide.result > rightSide.result;
        break;
      case '<':
        isCorrect = leftSide.result < rightSide.result;
        break;
      case '=':
        isCorrect = leftSide.result === rightSide.result;
        break;
      case '≤':
        isCorrect = leftSide.result <= rightSide.result;
        break;
      case '≥':
        isCorrect = leftSide.result >= rightSide.result;
        break;
      default:
        isCorrect = false;
    }

    return { id: Math.random(), equation, question, isCorrect };
  } else {
    // Generate single expression with various question types
    const expr = generateSimpleEquation();
    let equation = expr.equation;
    let question: string;
    let isCorrect: boolean;
    let displayedResult: number;

    switch (questionType) {
      case 'isWrong':
        displayedResult = expr.result + (Math.random() > 0.5 ? 1 : -1);
        equation = `${equation} = ${displayedResult}`;
        question = 'Is this equation wrong?';
        isCorrect = displayedResult !== expr.result;
        break;

      case 'isOdd':
        question = 'Is the answer odd?';
        isCorrect = isOddNumber(expr.result);
        break;

      case 'isEven':
        question = 'Is the answer even?';
        isCorrect = isEvenNumber(expr.result);
        break;

      case 'isGreaterThan':
        const threshold1 = Math.floor((expr.result + 1) / 2);
        question = `Is the answer greater than ${threshold1}?`;
        isCorrect = expr.result > threshold1;
        break;

      case 'isLessThan':
        const threshold2 = Math.ceil(expr.result * 1.5);
        question = `Is the answer less than ${threshold2}?`;
        isCorrect = expr.result < threshold2;
        break;

      case 'isCorrect':
      default:
        displayedResult = Math.random() > 0.5 ? expr.result : expr.result + (Math.random() > 0.5 ? 1 : -1);
        equation = `${equation} = ${displayedResult}`;
        question = 'Is this equation correct?';
        isCorrect = displayedResult === expr.result;
        break;
    }

    return { id: Math.random(), equation, question, isCorrect };
  }
};

const generateCards = (count: number): Card[] => {
  return Array.from({ length: count }, generateEquation);
};

const CardGame: React.FC = () => {
  const [cards, setCards] = useState<Card[]>(generateCards(10));
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 });
  const [isExiting, setIsExiting] = useState(false);
  const [exitDirection, setExitDirection] = useState<'left' | 'right'>('left');
  const [isEntering, setIsEntering] = useState(true);
  const [score, setScore] = useState(0);
  const [showFeedback, setShowFeedback] = useState<'success' | 'fail' | null>(null);
  const [showScoreChange, setShowScoreChange] = useState<{ value: number; type: 'positive' | 'negative' } | null>(null);
  const [highScore, setHighScore] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const [showControls, setShowControls] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [hasSwipedFirstCard, setHasSwipedFirstCard] = useState(false);
  const [wrongStreak, setWrongStreak] = useState(0);
  const [showingHighScore, setShowingHighScore] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showGameOverAnimation, setShowGameOverAnimation] = useState(false);
  const [shouldShowEnterAnimation, setShouldShowEnterAnimation] = useState(false);

  const handleRestart = () => {
    setCards(generateCards(10));
    setCurrentCardIndex(0);
    setScore(0);
    setWrongStreak(0);
    setIsGameOver(false);
    setShowGameOverAnimation(false);
    setShouldShowEnterAnimation(false);
    setIsEntering(true);
  };

  const handlePause = () => {
    setIsPaused(true);
    setTimeout(() => {
      const newCards = [...cards];
      newCards[currentCardIndex] = generateEquation();
      setCards(newCards);
    }, 150);
  };

  const handleUnpause = () => {
    setIsPaused(false);
  };

  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    if (isExiting) return;
    
    if (!hasSwipedFirstCard) {
      setHasSwipedFirstCard(true);
      setShowControls(false);
    }

    if (showingHighScore) {
      if (direction === 'right') {
        setShowingHighScore(false);
      }
      return;
    }

    if (isGameOver) {
      setIsExiting(true);
      setExitDirection(direction);
      setShowGameOverAnimation(true);

      setTimeout(() => {
        setIsExiting(false);
        setPosition({ x: 0, y: 0 });
        setShowGameOverAnimation(false);
        
        if (direction === 'right') {
          handleRestart();
        } else {
          setShouldShowEnterAnimation(true);
          setTimeout(() => {
            setShouldShowEnterAnimation(false);
          }, 250);
        }
      }, 250);
      return;
    }

    if (currentCardIndex >= cards.length - 1) {
      setShowingHighScore(true);
      return;
    }

    const currentCard = cards[currentCardIndex];
    const isRightAnswer = direction === 'right';
    const isCorrect = currentCard.isCorrect === isRightAnswer;
    
    setIsExiting(true);
    setExitDirection(direction);
    setShowFeedback(isCorrect ? 'success' : 'fail');

    let scoreChange;
    if (isCorrect) {
      scoreChange = 2;
      setWrongStreak(prev => Math.max(0, prev - 1));
    } else {
      setWrongStreak(prev => prev + 1);
      scoreChange = -(wrongStreak + 1);
    }

    setShowScoreChange({ 
      value: scoreChange, 
      type: isCorrect ? 'positive' : 'negative' 
    });
    
    setTimeout(() => {
      const newScore = score + scoreChange;
      setScore(newScore);
      
      if (newScore > highScore) {
        setHighScore(newScore);
      }

      if (newScore < 0) {
        setIsGameOver(true);
      } else {
        if (currentCardIndex >= cards.length - 3) {
          const newCards = [...cards, ...generateCards(5)];
          setCards(newCards);
        }
        setCurrentCardIndex(prev => prev + 1);
      }

      setIsExiting(false);
      setPosition({ x: 0, y: 0 });
      setShowFeedback(null);
      setShowScoreChange(null);
    }, 250);
  }, [currentCardIndex, cards, isExiting, score, hasSwipedFirstCard, highScore, wrongStreak, showingHighScore, isGameOver]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (isPaused && e.key.toLowerCase() !== 'p') {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'arrowleft':
        case 'a':
          handleSwipe('left');
          break;
        case 'arrowright':
        case 'd':
          handleSwipe('right');
          break;
        case 'p':
          if (isPaused) {
            handleUnpause();
          } else {
            handlePause();
          }
          break;
        case 'r':
          handleRestart();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleSwipe, isPaused, handleUnpause, handlePause, handleRestart]);

  useEffect(() => {
    setIsEntering(true);
    const timer = setTimeout(() => setIsEntering(false), 500);
    return () => clearTimeout(timer);
  }, [currentCardIndex]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartPosition({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - startPosition.x;
    const deltaY = e.clientY - startPosition.y;
    setPosition({ x: deltaX, y: deltaY });
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    
    setIsDragging(false);
    const threshold = 100;
    
    if (Math.abs(position.x) > threshold) {
      handleSwipe(position.x > 0 ? 'right' : 'left');
    } else {
      setPosition({ x: 0, y: 0 });
    }
  };

  const rotation = position.x * 0.1;
  const showLeftArrow = position.x < -20;
  const showRightArrow = position.x > 20;

  return (
    <ThemeProvider theme={{ score }}>
      <CardContainer>
        <GameControls>
          {!isGameOver && (
            <ControlButton onClick={() => {
              if (isPaused) {
                handleUnpause();
              } else {
                handlePause();
              }
            }}>
              {isPaused ? 'Unpause' : 'Pause'} <span>(P)</span>
            </ControlButton>
          )}
          <ControlButton isRestart negative={isGameOver} onClick={handleRestart}>
            Restart <span>(R)</span>
          </ControlButton>
        </GameControls>
        <ScoreDisplay>Score: {score}</ScoreDisplay>
        <HighScoreDisplay>High Score: {highScore}</HighScoreDisplay>
        
        <TrueFalseText side="left">← FALSE</TrueFalseText>
        <TrueFalseText side="right">TRUE →</TrueFalseText>
        
        {showFeedback && <FeedbackText type={showFeedback}>{showFeedback === 'success' ? '✓' : '✗'}</FeedbackText>}
        {showScoreChange && (
          <ScoreChange type={showScoreChange.type}>
            {showScoreChange.type === 'positive' ? '+' : ''}{showScoreChange.value}
          </ScoreChange>
        )}
        
        <CardStack>
          <BlurOverlay active={isPaused}>PAUSED</BlurOverlay>
          {!showingHighScore && !isGameOver && currentCardIndex < cards.length && (
            <CardWrapper
              ref={cardRef}
              isDragging={isDragging && !isPaused}
              x={position.x}
              y={position.y}
              rotation={rotation}
              isExiting={isExiting}
              exitDirection={exitDirection}
              isEntering={isEntering}
              onMouseDown={e => !isPaused && handleMouseDown(e)}
              onMouseMove={e => !isPaused && handleMouseMove(e)}
              onMouseUp={e => !isPaused && handleMouseUp()}
              onMouseLeave={e => !isPaused && handleMouseUp()}
            >
              <Equation>{cards[currentCardIndex].equation}</Equation>
              <Question>{cards[currentCardIndex].question}</Question>
            </CardWrapper>
          )}
          {showingHighScore && !isGameOver && (
            <GameOverCard
              ref={cardRef}
              isDragging={isDragging}
              x={position.x}
              y={position.y}
              rotation={rotation}
              isExiting={isExiting}
              exitDirection={exitDirection}
              isEntering={isEntering}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <GameOverContent>
                <GameOverTitle>Current High Score</GameOverTitle>
                <GameOverScore>{highScore}</GameOverScore>
                <ScoreLabel>High Score</ScoreLabel>
                <GameOverQuestion>Swipe right to continue playing</GameOverQuestion>
              </GameOverContent>
            </GameOverCard>
          )}
          {(isGameOver || showGameOverAnimation) && (
            <GameOverCard
              ref={cardRef}
              isDragging={isDragging}
              x={position.x}
              y={position.y}
              rotation={rotation}
              isExiting={isExiting}
              exitDirection={exitDirection}
              isEntering={(!showGameOverAnimation && isEntering) || shouldShowEnterAnimation}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <GameOverContent>
                <GameOverTitle>Game Over!</GameOverTitle>
                <GameOverScore>{score}</GameOverScore>
                <ScoreLabel>Final Score</ScoreLabel>
                <GameOverQuestion>Do you want to play again?</GameOverQuestion>
              </GameOverContent>
            </GameOverCard>
          )}
        </CardStack>

        <Controls isVisible={showControls}>
          Use ← → or A D keys to swipe cards
        </Controls>
      </CardContainer>
    </ThemeProvider>
  );
};

export default CardGame; 