import React from 'react';
import { Badge } from './ui';

export default function BlastRadiusBadge({ score, level, size = 'md' }) {
  const config = {
    low: { variant: 'success', text: 'Low Impact', color: 'green' },
    medium: { variant: 'warning', text: 'Medium Impact', color: 'amber' },
    high: { variant: 'danger', text: 'High Impact', color: 'red' }
  };

  const current = config[level] || config.low;

  return (
    <Badge variant={current.variant} size={size} dot>
      {current.text} ({score})
    </Badge>
  );
}
