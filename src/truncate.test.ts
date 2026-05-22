import {
  truncateString,
  truncateArray,
  truncateFieldValue,
  truncateEntry,
  truncateEntries,
} from './truncate';

describe('truncateString', () => {
  it('returns the string unchanged when within limit', () => {
    expect(truncateString('hello', 10)).toBe('hello');
  });

  it('truncates and appends default ellipsis', () => {
    expect(truncateString('hello world', 8)).toBe('hello...');
  });

  it('uses custom ellipsis', () => {
    expect(truncateString('hello world', 7, '…')).toBe('hello w…');
  });

  it('handles maxLength shorter than ellipsis', () => {
    expect(truncateString('hello', 2, '...')).toBe('..');
  });
});

describe('truncateArray', () => {
  it('returns array unchanged when within limit', () => {
    expect(truncateArray([1, 2, 3], 5)).toEqual([1, 2, 3]);
  });

  it('slices array to maxItems', () => {
    expect(truncateArray([1, 2, 3, 4, 5], 3)).toEqual([1, 2, 3]);
  });
});

describe('truncateFieldValue', () => {
  it('truncates string fields', () => {
    expect(truncateFieldValue('abcdef', { maxLength: 4 })).toBe('a...');
  });

  it('truncates array fields', () => {
    expect(truncateFieldValue([1, 2, 3, 4], { maxArrayItems: 2 })).toEqual([1, 2]);
  });

  it('passes through non-string non-array values', () => {
    expect(truncateFieldValue(42, { maxLength: 2 })).toBe(42);
    expect(truncateFieldValue(null, { maxLength: 2 })).toBeNull();
  });

  it('does not truncate string when maxLength not set', () => {
    expect(truncateFieldValue('long string', { maxArrayItems: 2 })).toBe('long string');
  });
});

describe('truncateEntry', () => {
  const entry = { msg: 'hello world', level: 'info', tags: ['a', 'b', 'c'], count: 5 };

  it('returns entry unchanged when fields list is empty', () => {
    expect(truncateEntry(entry, [], { maxLength: 5 })).toEqual(entry);
  });

  it('truncates specified string fields', () => {
    const result = truncateEntry(entry, ['msg'], { maxLength: 8 });
    expect(result.msg).toBe('hello...');
    expect(result.level).toBe('info');
  });

  it('truncates specified array fields', () => {
    const result = truncateEntry(entry, ['tags'], { maxArrayItems: 2 });
    expect(result.tags).toEqual(['a', 'b']);
  });

  it('ignores fields not present in entry', () => {
    const result = truncateEntry(entry, ['nonexistent'], { maxLength: 3 });
    expect(result).toEqual(entry);
  });

  it('does not mutate the original entry', () => {
    const original = { msg: 'hello world' };
    truncateEntry(original, ['msg'], { maxLength: 5 });
    expect(original.msg).toBe('hello world');
  });
});

describe('truncateEntries', () => {
  it('applies truncation to all entries', () => {
    const entries = [
      { msg: 'first message', level: 'info' },
      { msg: 'second message', level: 'warn' },
    ];
    const result = truncateEntries(entries, ['msg'], { maxLength: 8 });
    expect(result[0].msg).toBe('first...');
    expect(result[1].msg).toBe('secon...');
  });

  it('returns empty array for empty input', () => {
    expect(truncateEntries([], ['msg'], { maxLength: 5 })).toEqual([]);
  });
});
