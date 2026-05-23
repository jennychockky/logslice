#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { parseLogLine } from './parser';
import { chunkEntries, ChunkOptions } from './chunk';

function printUsage(): void {
  console.error([
    'Usage: logslice-chunk [options] [file]',
    '',
    'Options:',
    '  --size <n>        Split into chunks of N entries',
    '  --field <name>    Split by unique values of a field',
    '  --max-chunks <n>  Limit output to first N chunks',
    '  --out-dir <dir>   Write each chunk to a separate file in dir',
    '  -h, --help        Show this help',
  ].join('\n'));
}

export function parseChunkArgs(argv: string[]): { options: ChunkOptions; file?: string; outDir?: string } {
  const options: ChunkOptions = {};
  let file: string | undefined;
  let outDir: string | undefined;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '-h' || arg === '--help') { printUsage(); process.exit(0); }
    else if (arg === '--size') { options.size = parseInt(argv[++i], 10); }
    else if (arg === '--field') { options.field = argv[++i]; }
    else if (arg === '--max-chunks') { options.maxChunks = parseInt(argv[++i], 10); }
    else if (arg === '--out-dir') { outDir = argv[++i]; }
    else if (!arg.startsWith('-')) { file = arg; }
  }

  return { options, file, outDir };
}

async function main(): Promise<void> {
  const { options, file, outDir } = parseChunkArgs(process.argv.slice(2));

  const input = file ? fs.createReadStream(file) : process.stdin;
  const rl = readline.createInterface({ input, crlfDelay: Infinity });

  const entries = [];
  for await (const line of rl) {
    const entry = parseLogLine(line);
    if (entry) entries.push(entry);
  }

  const chunks = chunkEntries(entries, options);

  if (outDir) {
    fs.mkdirSync(outDir, { recursive: true });
    chunks.forEach((chunk, i) => {
      const outPath = path.join(outDir, `chunk-${String(i + 1).padStart(4, '0')}.ndjson`);
      fs.writeFileSync(outPath, chunk.map(e => JSON.stringify(e)).join('\n') + '\n');
    });
    console.error(`Wrote ${chunks.length} chunk(s) to ${outDir}`);
  } else {
    chunks.forEach((chunk, i) => {
      console.log(`# chunk ${i + 1} (${chunk.length} entries)`);
      chunk.forEach(e => console.log(JSON.stringify(e)));
    });
  }
}

main().catch(err => { console.error(err.message); process.exit(1); });
