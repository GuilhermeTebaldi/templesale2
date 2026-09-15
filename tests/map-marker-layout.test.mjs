import { test } from 'node:test';
import assert from 'node:assert/strict';
import { layoutMapMarkers, MAP_PIN_SIZE, MAP_PIN_ANCHOR, MAP_LABEL_SIZE, MAP_LABEL_ANCHOR } from '../src/lib/map-marker-layout.ts';

const viewport = { x: 390, y: 700 };
const point = (key, x = 195, y = 350, priority = false) => ({ key, x, y, priority });
const keys = groups => groups.flatMap(g => g.keys).sort();
function assertNoOverlap(groups) {
  const rects = groups.map(g => g.detailed
    ? [g.x - MAP_LABEL_ANCHOR[0], g.y - MAP_LABEL_ANCHOR[1], ...MAP_LABEL_SIZE]
    : [g.x - MAP_PIN_ANCHOR[0], g.y - MAP_PIN_ANCHOR[1], MAP_PIN_SIZE, MAP_PIN_ANCHOR[1]]);
  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      const [x, y, w, h] = rects[i], [a, b, c, d] = rects[j];
      assert.ok(x + w <= a || a + c <= x || y + h <= b || b + d <= y, `overlap: ${i}, ${j}`);
    }
  }
}

test('one company stays visible but loses its large balloon at distant zooms', () => {
  for (const zoom of [2, 5, 8, 10, 13]) {
    const groups = layoutMapMarkers([point('pizza')], zoom, viewport);
    assert.equal(groups.length, 1);
    assert.equal(groups[0].detailed, false);
  }
  assert.equal(layoutMapMarkers([point('pizza')], 14, viewport)[0].detailed, true);
});

test('zooming out combines companies and zooming in separates them without losing identities', () => {
  const companies = [point('pizza', 0, 0), point('bar', 100, 0), point('salon', 0, 100)];
  const project = scale => companies.map(p => ({ ...p, x: 140 + p.x * scale, y: 300 + p.y * scale }));
  const far = layoutMapMarkers(project(0.1), 5, viewport);
  assert.equal(far.length, 1);
  assert.equal(far[0].keys.length, 3);
  const near = layoutMapMarkers(project(1), 16, viewport);
  assert.equal(near.length, 3);
  assert.deepEqual(keys(near), keys(far));
  assertNoOverlap(near);
});

test('80 companies at one address remain one count, including at maximum zoom', () => {
  const items = Array.from({ length: 80 }, (_, i) => Object.freeze(point(`store-${i}`)));
  for (const zoom of [4, 14, 18]) {
    const groups = layoutMapMarkers(items, zoom, viewport);
    assert.equal(groups.length, 1);
    assert.equal(groups[0].keys.length, 80);
    assert.equal(groups[0].x, 195);
    assert.equal(groups[0].y, 350);
    assert.equal(groups[0].detailed, false);
    assert.deepEqual(keys(groups), items.map(p => p.key).sort());
  }
});

test('balancing merged centers, rotation and panning do not introduce overlapping markers', () => {
  const items = Array.from({ length: 80 }, (_, i) => point(`s${i}`, (i % 10) * 48, Math.floor(i / 10) * 65));
  for (const angle of [0, 30, 45, 90, 180, 270]) {
    const radians = angle * Math.PI / 180;
    const projected = items.map(p => ({ ...p,
      x: 600 + p.x * Math.cos(radians) - p.y * Math.sin(radians),
      y: 600 + p.x * Math.sin(radians) + p.y * Math.cos(radians),
    }));
    const groups = layoutMapMarkers(projected, 16, { x: 1600, y: 1600 });
    assert.deepEqual(keys(groups), items.map(p => p.key).sort());
    assertNoOverlap(groups);
    assert.deepEqual(layoutMapMarkers([...projected].reverse(), 16, { x: 1600, y: 1600 }), groups);
    const shifted = layoutMapMarkers(projected.map(p => ({ ...p, x: p.x + 10, y: p.y + 10 })), 16, { x: 1600, y: 1600 });
    assertNoOverlap(shifted);
  }
});

test('a focused company gets label priority; conflicting labels stay compact', () => {
  const groups = layoutMapMarkers([point('a', 300, 300), point('b', 460, 300, true)], 16, { x: 800, y: 700 });
  assert.equal(groups.find(g => g.keys[0] === 'b').detailed, true);
  assert.equal(groups.find(g => g.keys[0] === 'a').detailed, false);
  assertNoOverlap(groups);
});

test('labels do not cover GPS/search points or extend beyond a narrow viewport', () => {
  const company = point('pizza');
  assert.equal(layoutMapMarkers([company], 16, viewport, [{ x: 195, y: 310 }])[0].detailed, false);
  assert.equal(layoutMapMarkers([point('edge', 30, 350)], 16, viewport)[0].detailed, false);
  assert.equal(layoutMapMarkers([company], 16, viewport, [{ x: 350, y: 600 }])[0].detailed, true);
});

test('repeated data is not counted twice; offscreen data reappears after panning', () => {
  const items = [point('a'), point('a'), point('b', 1000, 350)];
  const groups = layoutMapMarkers(items, 10, viewport);
  assert.deepEqual(keys(groups), ['a']);
  const panned = layoutMapMarkers(items.map(p => ({ ...p, x: p.x - 805 })), 10, viewport);
  assert.deepEqual(keys(panned), ['b']);
  assert.deepEqual(layoutMapMarkers([], 10, viewport), []);
});
