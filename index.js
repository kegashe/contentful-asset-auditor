#!/usr/bin/env node

require('dotenv').config();
const cliProgress = require('cli-progress');
const yargs = require('yargs');
const { writeFile, readFile } = require('node:fs/promises');

const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.legacy);

const options = yargs
	.scriptName('contentful-cleanup')
	.usage('Usage: $0 <command> [options]')
	.command({
		command: 'get',
		desc: 'Get list of assets from Contentful space',
		builder: (y) => {
			y
				.usage('Usage: $0 get [-o <file_path>]')
				.example('$0 get -o assets.json')
				.option('o', {
					alias: 'output-file',
					describe: 'Output file you want to save data to'
				})
		},
		handler: (argv) => commandHandlerGet(argv)
	})
	.command({
		command: 'find',
		desc: 'Find orphaned assets',
		builder: (y) => {
			y
				.usage('Usage: $0 find [-i <file_path> | -o <file_path>]')
				.example('$0 find -i assets.json -o orphanedAssets.json')
				.option('i', {
					alias: 'input-file',
					describe: 'Input file you want to read data from',
				})
				.option('o', {
					alias: 'output-file',
					describe: 'Output file you want to write data to'
				})
				.demandOption(['input-file'])
		},
		handler: (argv) => commandHandlerFind(argv)
	})
	.alias('h', 'help')
	.parse()
	.argv;

async function commandHandlerGet(argv) {
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

async function commandHandlerFind(argv) {
	try {
		const data = await readFromFile(argv['input-file']);

		let assets = [];

		progressBar.start(data.items.length, 0);

		for (let i = 0; i < data.items.length; i++) {
			if (i % 7 == 0) {
				await sleep(1000);
			}

			let found = await findEntries(data.items[i].sys.id)

			if (found) {
				assets.push(data.items[i].sys.id);
			}

			progressBar.increment();
		}

		progressBar.stop();

		console.log(`Found ${assets.length} orphaned assets.`);

		if (argv['output-file']) {
			let data = `Asset ID\n`;
			assets.forEach((e) => data += `${e}\n`);

			await writeToFile(argv['output-file'], data);
		}
	} catch (err) {
		console.error(err);
	}
}

async function findEntries(assetId) {
	const reqHeaders = new Headers();
	reqHeaders.set('Authorization', `Bearer ${process.env.CONTENTFUL_CDA_TOKEN}`);
	const url = `${process.env.CONTENTFUL_BASE_URL_CDA}/spaces/${process.env.CONTENTFUL_SPACE_ID}/environments/${process.env.CONTENTFUL_ENVIRONMENT_ID}/entries?links_to_asset=${assetId}`;

	const req = new Request(url, {
		headers: reqHeaders
	});

	const response = await fetch(req);

	if (!response.ok) {
		throw new Error(`Error finding entries: ${response.status}`);
	}

	const results = await response.json();

	return results.total === 0;
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