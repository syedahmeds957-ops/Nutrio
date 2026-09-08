import { describe, expect, it } from 'vitest';
import { handleEstimatePhotoRequest } from '../index.js';
import { EstimatePhotoResponseSchema } from '../schema.js';

describe('Photo Calorie Estimation Edge Function (Task 3.3)', () => {
  const dummyBase64 =
    'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

  it('handles CORS preflight OPTIONS request with 200 OK', async () => {
    const req = new Request('http://localhost/estimate-photo', {
      method: 'OPTIONS',
    });
    const res = await handleEstimatePhotoRequest(req);
    expect(res.status).toBe(200);
  });

  it('rejects GET requests with 405 Method Not Allowed', async () => {
    const req = new Request('http://localhost/estimate-photo', { method: 'GET' });
    const res = await handleEstimatePhotoRequest(req);
    expect(res.status).toBe(405);
  });

  it('rejects invalid image payload with 400 Bad Request', async () => {
    const req = new Request('http://localhost/estimate-photo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: '' }),
    });
    const res = await handleEstimatePhotoRequest(req);
    expect(res.status).toBe(400);
  });

  it('estimates photo calories with database nutrient grounding and confidence bands', async () => {
    const req = new Request('http://localhost/estimate-photo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: dummyBase64,
        referenceObject: 'plate',
      }),
    });

    const res = await handleEstimatePhotoRequest(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    const validation = EstimatePhotoResponseSchema.safeParse(json);
    expect(validation.success).toBe(true);

    expect(json.success).toBe(true);
    expect(json.detectedItems.length).toBeGreaterThan(0);

    // Enforce Rule 1 & confidence band
    expect(json.resolution.totalCalories).toBeGreaterThan(400);
    expect(json.resolution.calorieBand.displayEstimate).toContain('±');
    expect(json.resolution.totalOilAddedG).toBeGreaterThan(0);

    // Verify item-level resolution
    const karahiItem = json.resolution.items.find((i: any) =>
      i.matchedFoodName.toLowerCase().includes('karahi')
    );
    expect(karahiItem).toBeDefined();
    expect(karahiItem.calories).toBeGreaterThan(0);
  });

  it('handles context notes and reference object hints', async () => {
    const req = new Request('http://localhost/estimate-photo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: dummyBase64,
        contextNote: 'chicken biryani cooked in ghee',
        referenceObject: 'spoon',
      }),
    });

    const res = await handleEstimatePhotoRequest(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.dishDetected).toContain('Biryani');
    expect(json.resolution.totalCalories).toBeGreaterThan(400);
  });
});
