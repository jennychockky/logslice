# logslice

Command-line utility to filter and extract structured JSON log entries by time range and field patterns.

## Installation

```bash
npm install -g logslice
```

## Usage

```bash
logslice [options] <logfile>
```

### Options

| Flag | Description |
|------|-------------|
| `--from <timestamp>` | Start of time range (ISO 8601 or Unix ms) |
| `--to <timestamp>` | End of time range (ISO 8601 or Unix ms) |
| `--field <key=value>` | Filter by field pattern (repeatable) |
| `--output <file>` | Write results to file instead of stdout |

### Examples

Filter logs from the last hour by log level:

```bash
logslice --from 2024-01-15T10:00:00Z --to 2024-01-15T11:00:00Z app.log
```

Extract only error entries and write to a file:

```bash
logslice --from 2024-01-15T10:00:00Z --field level=error --output errors.log app.log
```

Pipe from stdin:

```bash
cat app.log | logslice --from 2024-01-15T10:00:00Z --field service=api
```

## Requirements

- Node.js 18+
- Log files must contain newline-delimited JSON (NDJSON)

## Contributing

Pull requests are welcome. Please open an issue first to discuss any significant changes.

## License

[MIT](LICENSE)