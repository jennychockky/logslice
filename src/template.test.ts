import {
  resolvePath,
  renderTemplate,
  renderTemplates,
  enrichWithTemplate,
} from './template';

const entry = {
  level: 'info',
  message: 'hello world',
  user: { id: 42, name: 'alice' },
  timestamp: '2024-01-01T00:00:00Z',
};

describe('resolvePath', () => {
  it('resolves a top-level field', () => {
    expect(resolvePath(entry, 'level')).toBe('info');
  });

  it('resolves a nested field', () => {
    expect(resolvePath(entry, 'user.id')).toBe(42);
  });

  it('returns undefined for missing path', () => {
    expect(resolvePath(entry, 'user.email')).toBeUndefined();
  });

  it('returns undefined when intermediate key is missing', () => {
    expect(resolvePath(entry, 'meta.region')).toBeUndefined();
  });
});

describe('renderTemplate', () => {
  it('replaces a single placeholder', () => {
    expect(renderTemplate('Level: {{level}}', entry)).toBe('Level: info');
  });

  it('replaces multiple placeholders', () => {
    expect(renderTemplate('{{level}} — {{message}}', entry)).toBe(
      'info — hello world'
    );
  });

  it('replaces nested path placeholder', () => {
    expect(renderTemplate('User: {{user.name}} ({{user.id}})', entry)).toBe(
      'User: alice (42)'
    );
  });

  it('uses empty string for missing field by default', () => {
    expect(renderTemplate('{{missing}}', entry)).toBe('');
  });

  it('uses custom missingValue for missing field', () => {
    expect(renderTemplate('{{missing}}', entry, 'N/A')).toBe('N/A');
  });

  it('handles whitespace inside braces', () => {
    expect(renderTemplate('{{ level }}', entry)).toBe('info');
  });
});

describe('renderTemplates', () => {
  it('renders template for each entry', () => {
    const entries = [
      { level: 'info', msg: 'a' },
      { level: 'error', msg: 'b' },
    ];
    const result = renderTemplates(entries, { template: '[{{level}}] {{msg}}' });
    expect(result).toEqual(['[info] a', '[error] b']);
  });
});

describe('enrichWithTemplate', () => {
  it('adds a new field with rendered value', () => {
    const entries = [{ level: 'warn', msg: 'oops' }];
    const result = enrichWithTemplate(entries, 'summary', {
      template: '{{level}}: {{msg}}',
    });
    expect(result[0]).toMatchObject({ level: 'warn', summary: 'warn: oops' });
  });

  it('does not mutate original entries', () => {
    const entries = [{ level: 'info', msg: 'hi' }];
    const result = enrichWithTemplate(entries, 'label', { template: '{{level}}' });
    expect(entries[0]).not.toHaveProperty('label');
    expect(result[0]).toHaveProperty('label', 'info');
  });
});
