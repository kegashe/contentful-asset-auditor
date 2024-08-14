import { writeFile } from 'node:fs/promises';
import { Logger, ILogObj } from 'tslog';

import { getAllAssets } from '../helpers/Assets.mjs';
import { createLogger } from '../helpers/Loggers.mjs';
import { OptionsGetAssets } from '../interfaces/Options.mjs';

export async function getAssetsHandler(options: OptionsGetAssets): Promise<void> {
	const logger: Logger<ILogObj> = createLogger(['getUsers']);

	const { outputFile } = options as OptionsGetAssets;

	const assets = await getAllAssets();

	try {
		console.log(`Writing results to file '${outputFile}'...`);
		await writeFile(outputFile, JSON.stringify(assets));
		console.log('File written successfully.');
	} catch (err) {
		logger.fatal(`Error writing results to file ${outputFile}: `, err)
		console.log(`Error writing results to file ${outputFile}: `, err)
		throw new Error(err as string);
	}
}