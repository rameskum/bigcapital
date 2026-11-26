import { getEntriesTotal } from '../utils';

describe('getEntriesTotal', () => {
  it('should sum the line amounts as a number with a blank trailing line', () => {
    expect(getEntriesTotal([{ amount: 3200 }, { amount: '' }])).toBe(3200);
  });

  it('should skip a line without an amount', () => {
    expect(getEntriesTotal([{ amount: 100 }, {}, { amount: 50 }])).toBe(150);
  });
});
