import { motion, useAnimation } from 'framer-motion';
import styled from 'styled-components';
import { useGesture } from '@use-gesture/react';
import { useState } from 'react';

interface CardProps {
  imageUrl: string;
  title: string;
  description: string;
  onSwipe?: (direction: 'left' | 'right') => void;
}

const CardContainer = styled(motion.div)`
  position: absolute;
  width: 300px;
  height: 400px;
  border-radius: 10px;
  background: white;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  cursor: grab;
  
  &:active {
    cursor: grabbing;
  }
`;

const CardImage = styled.div<{ url: string }>`
  width: 100%;
  height: 70%;
  background-image: url(${props => props.url});
  background-size: cover;
  background-position: center;
`;

const CardContent = styled.div`
  padding: 1rem;
`;

const CardTitle = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  color: #333;
`;

const CardDescription = styled.p`
  margin: 0.5rem 0 0;
  font-size: 1rem;
  color: #666;
`;

export const Card: React.FC<CardProps> = ({ imageUrl, title, description, onSwipe }) => {
  const controls = useAnimation();
  const [isDragging, setIsDragging] = useState(false);

  const bind = useGesture({
    onDrag: ({ movement: [x], down, direction: [xDir], velocity }) => {
      setIsDragging(down);
      controls.start({
        x: down ? x : 0,
        rotate: down ? x * 0.1 : 0,
        scale: down ? 1.05 : 1,
        transition: { type: 'spring', bounce: 0.4 }
      });

      if (!down && Math.abs(velocity) > 0.5) {
        const direction = xDir > 0 ? 'right' : 'left';
        const moveX = xDir > 0 ? 500 : -500;
        
        controls.start({
          x: moveX,
          rotate: xDir > 0 ? 50 : -50,
          transition: { duration: 0.3 }
        });

        onSwipe?.(direction);
      }
    }
  });

  return (
    <CardContainer
      {...bind()}
      animate={controls}
      initial={{ scale: 1 }}
      whileHover={{ scale: 1.02 }}
      style={{ touchAction: 'none' }}
    >
      <CardImage url={imageUrl} />
      <CardContent>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardContent>
    </CardContainer>
  );
}; 