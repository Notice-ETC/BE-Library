type LogLevel = 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: unknown;
}

class Logger {
  private formatLogEntry(level: LogLevel, message: string, data?: unknown): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
    };
  }

  private log(level: LogLevel, message: string, data?: unknown): void {
    const logEntry = this.formatLogEntry(level, message, data);
    const logMessage = `[${logEntry.timestamp}] [${logEntry.level.toUpperCase()}] ${logEntry.message}`;

    switch (level) {
      case 'info':
        console.log(logMessage, data !== undefined ? data : '');
        break;
      case 'warn':
        console.warn(logMessage, data !== undefined ? data : '');
        break;
      case 'error':
        console.error(logMessage, data !== undefined ? data : '');
        break;
    }
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
}

export const logger = new Logger();

