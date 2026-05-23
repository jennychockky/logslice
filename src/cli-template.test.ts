import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { execSync } from 'child_process';
import { parseTemplateArgs } from './cli-template';

function writeTempFile(lines: string[]): string {
  const file = path.join(os.tmpdir(), `logslice-template-${Date.now()}.ndjson`);
  fs.writeFileSync(file, lines.join('\n') + '\n');
  return file;
}

describe('parseTemplateArgs', () => {
  it('parses --template flag', () => {
    const opts = parseTemplateArgs(['node', 'cli', '--template', '{{level}}']);
    expect(opts.template).toBe('{{level}}');
  });

  it('parses --field flag', () => {
    const opts = parseTemplateArgs([
      'node', 'cli', '--template', '{{level}}', '--field', 'summary',
    ]);
    expect(opts.field).toBe('summary');
  });

  it('parses --missing flag', () => {
    const opts = parseTemplateArgs([
      'node', 'cli', '--template', '{{x}}', '--missing', 'N/A',
    ]);
    expect(opts.missingValue).toBe('N/A');
  });

  it('parses positional input file', () => {
    const opts = parseTemplateArgs([
      'node', 'cli', '--template', '{{level}}', 'app.log',
    ]);
    expect(opts.inputFile).toBe('app.log');
  });

  it('defaults missingValue to empty string', () => {
    const opts = parseTemplateArgs(['node', 'cli', '--template', '{{x}}']);
    expect(opts.missingValue).toBe('');
  });
});

describe('cli-template integration', () => {
  it('renders template lines from file', () => {
    const file = writeTempFile([
      JSON.stringify({ level: 'info', message: 'started' }),
      JSON.stringify({ level: 'error', message: 'failed' }),
    ]);
    const out = execSync(
      `ts-node src/cli-template.ts --template "[{{level}}] {{message}}" ${file}`
    ).toString().trim();
    expect(out).toBe('[info] started\n[error] failed');
  });

  it('enriches entries with --field', () => {
    const file = writeTempFile([
      JSON.stringify({ level: 'warn', message: 'slow' }),
    ]);
    const out = execSync(
      `ts-node src/cli-template.ts --template "{{level}}: {{message}}" --field summary ${file}`
    ).toString().trim();
    const parsed = JSON.parse(out);
    expect(parsed.summary).toBe('warn: slow');
  });

  it('uses --missing for absent fields', () => {
    const file = writeTempFile([
      JSON.stringify({ level: 'info' }),
    ]);
    const out = execSync(
      `ts-node src/cli-template.ts --template "{{missing}}" --missing N/A ${file}`
    ).toString().trim();
    expect(out).toBe('N/A');
  });
});
