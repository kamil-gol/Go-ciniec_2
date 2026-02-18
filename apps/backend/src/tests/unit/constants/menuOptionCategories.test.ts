import { menuOptionCategories } from '../../../constants/menuOptionCategories';

describe('menuOptionCategories', () => {
  // Import may be default or named — handle both
  const categories = (menuOptionCategories as any)?.default || menuOptionCategories;

  it('should be defined', () => {
    expect(categories).toBeDefined();
  });

  it('should be an array or object with entries', () => {
    if (Array.isArray(categories)) {
      expect(categories.length).toBeGreaterThan(0);
    } else if (typeof categories === 'object') {
      expect(Object.keys(categories).length).toBeGreaterThan(0);
    }
  });
});
