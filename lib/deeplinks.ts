export function buildInstacartUrl(itemNames: string[]): string {
  if (itemNames.length === 0) return 'https://www.instacart.com';
  const query = encodeURIComponent(itemNames.join(' '));
  return `https://www.instacart.com/store/s?k=${query}`;
}

export function buildWalmartUrl(itemNames: string[]): string {
  if (itemNames.length === 0) return 'https://www.walmart.com/grocery';
  const query = encodeURIComponent(itemNames.join(' '));
  return `https://www.walmart.com/search?q=${query}&typeahead=${encodeURIComponent(itemNames[0])}`;
}
