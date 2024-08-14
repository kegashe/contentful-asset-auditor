import { Logger, ILogObj } from 'tslog';
import { createStream } from 'rotating-file-stream';

/**
 * Creates and initalizes a system logger. Messages are written to log file.
 * @function
 * @param {string[]} prefix - Array of values to prefix log messages.
 * @returns {Logger<ILogObj>}
 */
export function createLogger(prefix: string[]): Logger<ILogObj> {
	const stream = createStream('logs/tslog.log', {
		size: '10M',
		compress: 'gzip',
	});

	const logger: Logger<ILogObj> = new Logger({
		name: 'System Logger',
		type: "json",
		prefix: prefix,
		overwrite: {
			transportJSON: (logObjWithMeta: any) => {
				stream.write(JSON.stringify(logObjWithMeta) + '\n');
			}
		}
	});

	return logger;
}