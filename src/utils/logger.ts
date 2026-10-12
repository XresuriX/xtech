export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: unknown;
}

class Logger {
  private logs: LogEntry[] = [];
  private isDevelopment = import.meta.env.DEV;

  private log(level: LogLevel, message: string, data?: unknown): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      data,
    };

    this.logs.push(entry);

    if (this.isDevelopment) {
      const colors = {
        debug: '#6b7280',
        info: '#1e3a8a',
        warn: '#f59e0b',
        error: '#ef4444',
      };

      console.log(
        `%c[${level.toUpperCase()}] ${entry.timestamp}`,
        `color: ${colors[level]}`,
        message,
        data ?? ''
      );
    }
  }

  debug(message: string, data?: unknown): void {
    this.log('debug', message, data);
  }

  info(message: string, data?: unknown): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: unknown): void {
    this.log('warn', message, data);
  }

  error(message: string, data?: unknown): void {
    this.log('error', message, data);
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }
}

export const logger = new Logger();

// TODO: Add remote logging integration (e.g., Sentry, LogRocket)
// export const logToRemote = (entry: LogEntry) => {
//   // Send to remote logging service
// };