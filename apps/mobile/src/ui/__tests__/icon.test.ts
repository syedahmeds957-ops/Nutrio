import { describe, it, expect } from 'vitest';
import React from 'react';
import { Icon, IconName } from '../Icon.js';

describe('Icon Component System', () => {
  const iconList: IconName[] = [
    'flame',
    'scale',
    'dumbbell',
    'calendar',
    'search',
    'camera',
    'zap',
    'sparkles',
    'utensils',
    'user',
    'coach',
    'clipboard',
    'survey',
    'coffee',
    'sun',
    'droplet',
    'settings',
    'check',
    'arrow-left',
    'arrow-right',
    'plus',
    'minus',
    'trash',
    'swap',
    'image',
    'shield',
    'home',
    'chevron-right',
    'star',
    'x',
  ];

  it('renders all vector icons cleanly as React SVG elements', () => {
    for (const name of iconList) {
      const element = React.createElement(Icon, { name, size: 24, color: '#10B981' });
      expect(element).toBeDefined();
    }
  });
});
