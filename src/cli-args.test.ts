import { parseCliArgs, buildFilterOptions } from './cli-args';

describe('parseCliArgs', () => {
  const base = ['node', 'logslice'];

  it('parses positional input file', () => {
    const args = parseCliArgs([...base, 'app.log']);
    expect(args.input).toBe('app.log');
  });

  it('parses --from and --to', () => {
    const args = parseCliArgs([...base, '--from', '2024-01-01', '--to', '2024-01-31']);
    expect(args.from).toBe('2024-01-01');
    expect(args.to).toBe('2024-01-31');
  });

  it('parses --level', () => {
    const args = parseCliArgs([...base, '--level', 'error']);
    expect(args.level).toBe('error');
  });

  it('parses multiple --field flags', () => {
    const args = parseCliArgs([...base, '--field', 'service=api', '--field', 'env=prod']);
    expect(args.field).toEqual(['service=api', 'env=prod']);
  });

  it('parses --output', () => {
    const args = parseCliArgs([...base, '--output', 'pretty']);
    expect(args.output).toBe('pretty');
  });

  it('sets help flag', () => {
    const args = parseCliArgs([...base, '--help']);
    expect(args.help).toBe(true);
  });
});

describe('buildFilterOptions', () => {
  it('converts from/to strings to Date objects', () => {
    const opts = buildFilterOptions({ from: '2024-01-15T00:00:00Z', to: '2024-01-16T00:00:00Z' });
    expect(opts.from).toBeInstanceOf(Date);
    expect(opts.to).toBeInstanceOf(Date);
  });

  it('ignores invalid dates', () => {
    const opts = buildFilterOptions({ from: 'not-a-date' });
    expect(opts.from).toBeUndefined();
  });

  it('splits comma-separated levels', () => {
    const opts = buildFilterOptions({ level: 'info,warn,error' });
    expect(opts.level).toEqual(['info', 'warn', 'error']);
  });

  it('parses exact field match', () => {
    const opts = buildFilterOptions({ field: ['service=api'] });
    expect(opts.fields?.service).toBe('api');
  });

  it('parses regex field match', () => {
    const opts = buildFilterOptions({ field: ['message=/failed/'] });
    expect(opts.fields?.message).toBeInstanceOf(RegExp);
    expect((opts.fields?.message as RegExp).test('connection failed')).toBe(true);
  });

  it('returns empty options for no args', () => {
    const opts = buildFilterOptions({});
    expect(Object.keys(opts)).toHaveLength(0);
  });
});
