import { maskValue, maskEntry, maskEntries, parseMaskFields } from './mask';

const entry = {
  timestamp: '2024-01-01T00:00:00Z',
  level: 'info',
  message: 'user login',
  email: 'user@example.com',
  token: 'abc123secret',
  age: 30,
};

describe('maskValue', () => {
  it('masks entire string by default', () => {
    expect(maskValue('hello')).toBe('*****');
  });

  it('uses custom mask character', () => {
    expect(maskValue('hello', '#')).toBe('#####');
  });

  it('uses fixed mask length', () => {
    expect(maskValue('hello', '*', 4)).toBe('****');
  });

  it('shows last N characters', () => {
    expect(maskValue('abc123secret', '*', undefined, 4)).toBe('********cret');
  });

  it('handles non-string values', () => {
    expect(maskValue(12345)).toBe('*****');
  });
});

describe('maskEntry', () => {
  it('masks specified fields', () => {
    const result = maskEntry(entry, { fields: ['email', 'token'] });
    expect(result.email).toBe('****************');
    expect(result.token).toBe('************');
    expect(result.message).toBe('user login');
  });

  it('leaves unspecified fields unchanged', () => {
    const result = maskEntry(entry, { fields: ['token'] });
    expect(result.email).toBe('user@example.com');
    expect(result.age).toBe(30);
  });

  it('does not mutate original entry', () => {
    maskEntry(entry, { fields: ['email'] });
    expect(entry.email).toBe('user@example.com');
  });

  it('uses showLast option', () => {
    const result = maskEntry(entry, { fields: ['token'], showLast: 4 });
    expect(result.token).toBe('********cret');
  });

  it('ignores fields not present in entry', () => {
    const result = maskEntry(entry, { fields: ['nonexistent'] });
    expect(result).toEqual(entry);
  });
});

describe('maskEntries', () => {
  it('masks all entries', () => {
    const entries = [entry, { ...entry, token: 'xyz789' }];
    const results = maskEntries(entries, { fields: ['token'] });
    expect(results[0].token).toBe('************');
    expect(results[1].token).toBe('******');
  });
});

describe('parseMaskFields', () => {
  it('splits comma-separated fields', () => {
    expect(parseMaskFields('email,token,password')).toEqual(['email', 'token', 'password']);
  });

  it('trims whitespace', () => {
    expect(parseMaskFields('email , token')).toEqual(['email', 'token']);
  });

  it('filters empty entries', () => {
    expect(parseMaskFields('email,,token')).toEqual(['email', 'token']);
  });
});
