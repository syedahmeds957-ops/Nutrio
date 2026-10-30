import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { EXERCISES } from '@nutrio/workout-core';
import { EXERCISE_IMAGES } from '../exerciseImages.js';

describe('bundled exercise images', () => {
  it('has a start and an end frame for every catalogue exercise', () => {
    for (const exercise of EXERCISES) {
      const frames = EXERCISE_IMAGES[exercise.id];
      expect(frames, exercise.id).toBeDefined();
      expect(frames).toHaveLength(2);
      for (const [index, frame] of frames.entries()) {
        const uri = (frame as { uri: string }).uri;
        expect(uri, exercise.id).toMatch(new RegExp(`/${exercise.id}-${index}\\.jpg$`));
        expect(fs.existsSync(uri), uri).toBe(true);
      }
    }
  });

  it('has no images for exercises that are not in the catalogue', () => {
    const ids = new Set(EXERCISES.map((exercise) => exercise.id));
    for (const id of Object.keys(EXERCISE_IMAGES)) expect(ids.has(id), id).toBe(true);
  });
});
