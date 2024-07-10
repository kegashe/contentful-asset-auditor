#!/usr/bin/env node

require('dotenv').config();
const cliProgress = require('cli-progress');
const yargs = require('yargs');
const { writeFile } = require('node:fs/promises');

const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.legacy);

yargs
	.scriptName('contentful-cleanup')
	.usage('Usage: $0 <command> [options]')
	.command({
		command: 'get-assets',
		desc: 'Get list of assets from Contentful space',
		builder: (y) => {
			y
				.usage('Usage: $0 get-assets [-o <file_path>]')
				.example('$0 get-assets -o assets.json')
				.option('o', {
					alias: 'output-file',
					describe: 'Output file you want to save data to (JSON format)'
				})
				.demandOption(['output-file'])
		},
		handler: (argv) => commandHandlerGetAssets(argv)
	})
	.command({
		command: 'get-asset-details',
		desc: 'Get detailed information about assets',
		builder: (y) => {
			y
				.usage('Usage: $0 get-asset-details [-i <file_path> | -o <file_path>]')
				.example('$0 get-asset-details -i assets.json -o orphanedAssets.json')
				.option('i', {
					alias: 'input-file',
					describe: 'Input file you want to read data from (JSON format)',
				})
				.option('o', {
					alias: 'output-file',
					describe: 'Output file you want to write data to (CSV format)'
				})
				.option('m', {
					alias: 'max',
					describe: 'Maximum number of assets to analyze'
				})
				.demandOption(['input-file', 'output-file'])
		},
		handler: (argv) => commandHandlerGetAssetDetails(argv)
	})
	.alias('h', 'help')
	.parse()
	.argv;

async function commandHandlerGetAssets(argv) {
	try {
		const assetsInitial = await getAssets(0);

		const total = assetsInitial.total;
		const limit = assetsInitial.limit;
		const assets = {
			items: []
		};

		let skip = assetsInitial.skip;
		let pageCount = Math.ceil(total / limit);

		progressBar.start(pageCount, 0);

		for (let i = 0; i < pageCount; i++) {
			const currentAssets = await getAssets(skip);
			const items = currentAssets.items;

			items.forEach((e) => assets.items.push(e));

			progressBar.increment();

			skip += limit;
		}

		progressBar.stop();

		console.log(`Found ${assets.items.length} items`);

		if (argv['output-file']) {
			await writeToFile(argv['output-file'], JSON.stringify(assets));
		}
	} catch (err) {
		console.error(err);
	}
}

async function commandHandlerGetAssetDetails(argv) {
	try {
		const readData = await readFromFile(argv['input-file']);
		const assets = readData.items;
		const assetCount = argv.max || assets.length;

		let writeData = `Asset ID,Asset Title,Filename,Content Type,Published At,Updated At,Created At,Count of Linked Entries\n`;

		progressBar.start(assetCount, 0);

		for (let i = 0; i < assetCount; i++) {
			let assetDetails = await getAssetDetails(assets[i]['sys']['id']);

			writeData += (assets[i]?.['sys']?.['id'] || '') + ',';
			writeData += (assets[i]?.['fields']?.['title']?.['en-US'] || '') + ',';
			writeData += (assets[i]?.['fields']?.['file']?.['en-US']?.['fileName'] || '') + ',';
			writeData += (assets[i]?.['fields']?.['file']?.['en-US']?.['contentType'] || '') + ',';
			writeData += (assets[i]?.['sys']?.['publishedAt'] || '') + ',';
			writeData += (assets[i]?.['sys']?.['updatedAt'] || '' ) + ',';
			writeData += (assets[i]?.['sys']?.['createdAt'] || '') + ',';
			writeData += assetDetails['total'] + '\n';

			progressBar.increment();
		}

		progressBar.stop();

		await writeToFile(argv['output-file'], writeData);
	} catch (err) {
		console.error(err);
	}
}

async function getAssetDetails(assetId) {
	const requestHeaders = new Headers();
	requestHeaders.set('Authorization', `Bearer ${process.env.CONTENTFUL_CDA_TOKEN}`);
	const url = `${process.env.CONTENTFUL_BASE_URL_CDA}/spaces/${process.env.CONTENTFUL_SPACE_ID}/environments/${process.env.CONTENTFUL_ENVIRONMENT_ID}/entries?links_to_asset=${assetId}`;

	const request = new Request(url, {
		headers: requestHeaders
	});

	const response = await fetch(request);

	if (!response.ok) {
		if (response.headers.get('X-Contentful-RateLimit-Second-Remaining') === 0) {
			sleep(1000);
			getAssetDetails(assetId);
		} 
		throw new Error(`Error finding entries: ${response.status}`);
	}

	const results = await response.json();

	return results;
}

async function getAssets(skipInput) {
	let skip = skipInput || 0;

	const reqHeaders = new Headers();
	reqHeaders.set('Authorization', `Bearer ${process.env.CONTENTFUL_CMA_TOKEN}`);
	const url = `${process.env.CONTENTFUL_BASE_URL_CMA}/spaces/${process.env.CONTENTFUL_SPACE_ID}/environments/${process.env.CONTENTFUL_ENVIRONMENT_ID}/assets?order=sys.createdAt&skip=${skip}`;

	const req = new Request(url, {
		headers: reqHeaders
	});

	const response = await fetch(req);

	if (!response.ok) {
		throw new Error('Error fetching assets from Contentful');
	}

	const assets = await response.json();

	return assets;
}

async function writeToFile(path, data) {
	try {
		await writeFile(path, data);
	} catch (err) {
		throw new Error(err);
	}
}

function readFromFile(path) {
	try {
		const data = require(path);
		return data;
	} catch (err) {
		throw new Error(err);
	}
}

function sleep(ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}
