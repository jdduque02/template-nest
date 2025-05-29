import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { retry, catchError } from 'rxjs/operators';
import { firstValueFrom, from, throwError } from 'rxjs';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class LoggingService {
  private readonly logger = new Logger(LoggingService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendLog(data: unknown, severity: string = 'INFO') {
    const logData = {
      severity,
      data,
      source:
        'configuration-service' +
        (this.configService.get<string>('APP_DEV', 'false') === 'true' ? '_dev' : ''),
    };

    const logServiceUrl = this.configService.get<string>('LOG_SERVICE_URL');

    if (!logServiceUrl) {
      this.logger.error('LOG_SERVICE_URL is not defined');
      this.saveLogLocally(logData);
      return;
    }

    try {
      await firstValueFrom(
        from(axios.post(logServiceUrl, logData)).pipe(
          retry(3),
          catchError(() => {
            return throwError(() => new Error('Error sending log'));
          }),
        ),
      );
    } catch {
      this.saveLogLocally(logData);
    }
  }

  private saveLogLocally(log: any) {
    const logDir = path.join(__dirname, '../../logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const logFile = path.join(logDir, 'fallback-logs.json');
    const logEntry = JSON.stringify(log) + '\n';

    fs.appendFile(logFile, logEntry, (err) => {
      if (err) this.logger.error(`Error saving log local: ${err.message}`);
    });
  }
}
