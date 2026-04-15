import { buildInstacartUrl, buildWalmartUrl } from '@/lib/deeplinks';

test('buildInstacartUrl includes item name in URL', () => {
  const url = buildInstacartUrl(['Eggs', 'Milk', 'Bread']);
  expect(url).toContain('instacart.com');
  expect(url).toContain('Eggs');
});

test('buildWalmartUrl includes item names in URL', () => {
  const url = buildWalmartUrl(['Eggs', 'Milk']);
  expect(url).toContain('walmart.com');
  expect(url).toContain('Eggs');
});

test('buildInstacartUrl handles empty list gracefully', () => {
  const url = buildInstacartUrl([]);
  expect(url).toContain('instacart.com');
});

test('buildWalmartUrl handles empty list gracefully', () => {
  const url = buildWalmartUrl([]);
  expect(url).toContain('walmart.com');
});
