'use client';

import React, { useEffect, useState } from 'react';
import { Typography, TypographyProps } from '@mui/material';
import { useReducedMotion } from 'framer-motion';

interface AnimatedCounterProps extends TypographyProps {
  value: string;
  duration?: number;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 1500,
  sx,
  ...props
}) => {
  const reducedMotion = useReducedMotion();
  const numericMatch = value.match(/\d+/g);
  const targetNumber = numericMatch ? parseInt(numericMatch.join(''), 10) : null;
  const prefix = value.match(/^[^\d]+/)?.[0] || '';
  const suffix = value.match(/[^\d]+$/)?.[0] || '';

  const [count, setCount] = useState(0);

  useEffect(() => {
    if (targetNumber === null || reducedMotion) return;

    let start = 0;
    const increment = Math.ceil(targetNumber / (duration / 30));
    const timer = setInterval(() => {
      start += increment;
      if (start >= targetNumber) {
        setCount(targetNumber);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 30);

    return () => clearInterval(timer);
  }, [targetNumber, duration, reducedMotion]);

  if (targetNumber === null) {
    return <Typography sx={sx} {...props}>{value}</Typography>;
  }

  return (
    <Typography sx={sx} {...props}>
      {prefix}
      {(reducedMotion ? targetNumber : count).toLocaleString()}
      {suffix}
    </Typography>
  );
};

export default AnimatedCounter;
