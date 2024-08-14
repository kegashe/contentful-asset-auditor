#!/usr/bin/env node --no-warnings
import { Command } from 'commander';
import { OptionsGetAssetDetails, OptionsGetAssets } from './interfaces/Options.mjs';

import { getAssetsHandler } from './commands/getAssets.mjs';
import { getAssetDetailsHandler } from './commands/getAssetDetails.mjs';

const program = new Command();

program
	.name('contentful-cleanup')
	.description('CLI to help manage Contentful Assets.')
	.version('v0.1.0')
	.usage('contentful-cleanup <command> [options]');

program
	.command('get-assets')
	.alias('ga')
	.description('Get list of assets from Contentful space')
	.requiredOption('-o, --output-file <outputFile>', '(Required) Output file you want to write data to (JSON format)')
	.action((options: OptionsGetAssets) => getAssetsHandler(options));

program
	.command('get-asset-details')
	.alias('gad')
	.description('Get detailed information about assets')
	.requiredOption('-o --output-file <outputFile>', '(Required) Output file you want to write data to (CSV format)')
	.option('-i, --input-file <inputFile>', 'Input file you want to read data from (JSON format)')
	.option('-m, --max <maxResults>', 'Maximum number of assets to analyze', parseInt)
	.action((options: OptionsGetAssetDetails) => getAssetDetailsHandler(options));

program.parseAsync();