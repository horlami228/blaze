import { ConfigService } from '@nestjs/config';
import { Params } from 'nestjs-pino';

export const loggerConfigFactory = (configService: ConfigService): Params => {
  const nodeEnv = configService.get<string>('NODE_ENV');
  const logLevel = configService.get<string>('LOG_LEVEL', 'info');
  const betterstackEnabled = configService.get<boolean>(
    'BETTERSTACK_ENABLED',
    false,
  );
  const betterstackToken = configService
    .get<string>('BETTERSTACK_TOKEN')
    ?.trim();
  const betterstackEndpoint = configService
    .get<string>('BETTERSTACK_ENDPOINT')
    ?.trim();

  return {
    pinoHttp: {
      level: logLevel,

      transport: {
        targets: [
          // 1. Local Development: Pretty logs in terminal
          ...(nodeEnv !== 'production'
            ? [
                {
                  target: 'pino-pretty',
                  options: {
                    colorize: true,
                    translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
                    ignore: 'pid,hostname',
                    singleLine: false,
                  },
                },
              ]
            : []),
          // 2. Data Warehouse: Send to BetterStack if enabled and token is provided
          ...(betterstackEnabled && betterstackToken
            ? [
                {
                  target: '@logtail/pino',
                  options: {
                    sourceToken: betterstackToken,
                    options: betterstackEndpoint
                      ? { endpoint: betterstackEndpoint }
                      : {},
                  },
                },
              ]
            : []),
        ],
      },

      // ✅ Redact sensitive data from logs (CRITICAL for security)
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'req.headers["set-cookie"]',
          'req.body.password',
          'req.body.confirmPassword',
          'req.body.oldPassword',
          'req.body.newPassword',
          'req.body.pin',
          'req.body.otp',
          'req.body.token',
          'req.body.refreshToken',
          'req.body.cardNumber',
          'req.body.cvv',
          'req.body.cardCvv',
          'req.body.accountNumber',
          'req.body.bvn',
          'req.body.ssn',
          'res.headers["set-cookie"]',
          '*.password',
          '*.token',
          '*.apiKey',
          '*.secret',
        ],
        censor: '[REDACTED]',
        remove: true,
      },

      serializers: {
        req(req) {
          return {
            id: req.id,
            method: req.method,
            url: req.url,
            query: req.query,
            params: req.params,
            remoteAddress: req.remoteAddress,
            remotePort: req.remotePort,
          };
        },
        res(res) {
          return {
            statusCode: res.statusCode,
          };
        },
      },

      autoLogging: {
        ignore: (req) => {
          return req.url === '/health' || req.url === '/metrics';
        },
      },

      customLogLevel: (req, res, err) => {
        if (res.statusCode >= 500 || err) {
          return 'error';
        }
        if (res.statusCode >= 400) {
          return 'warn';
        }
        return 'info';
      },

      customSuccessMessage: (req, res) => {
        return `${req.method} ${req.url} - ${res.statusCode}`;
      },

      customErrorMessage: (req, res, err) => {
        return `${req.method} ${req.url} - ${res.statusCode} - ${err.message}`;
      },
    },
  };
};
