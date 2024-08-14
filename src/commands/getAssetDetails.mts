import { readFile, writeFile } from 'node:fs/promises';
import { AssetProps, CollectionProp, EntryProps, KeyValueMap, UserProps } from 'contentful-management';
import cliProgress from 'cli-progress';

import { getAllAssets, getAssetDetails } from '../helpers/Assets.mjs';
import { getAllUsers, getUserName } from '../helpers/Users.mjs';
import { Csv, Row, addColumn, addRow, render } from '../interfaces/Csv.mjs';
import { OptionsGetAssetDetails } from '../interfaces/Options.mjs';

export async function getAssetDetailsHandler(options: OptionsGetAssetDetails): Promise<void> {
	const {
		inputFile,
		outputFile,
		max
	} = options as OptionsGetAssetDetails;

	const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.legacy);

	let assets: CollectionProp<AssetProps>;

	if (inputFile) {
		console.log(`Retrieving assets from '${inputFile}'...`);
		const readData: string = await readFile(inputFile, { encoding: 'utf-8' });
		assets = JSON.parse(readData);
	} else {
		assets = await getAllAssets();
	}

	const assetCount: number = max || assets.total;

	const csv: Csv = {
		columns: [],
		rows: [],
	};

	addColumn(csv, { name: 'Asset ID', order: 1 });
	addColumn(csv, { name: 'Asset Title', order: 2 });
	addColumn(csv, { name: 'Filename', order: 3 });
	addColumn(csv, { name: 'Content Type', order: 4 });
	addColumn(csv, { name: 'Published At', order: 5 });
	addColumn(csv, { name: 'Updated At', order: 6 });
	addColumn(csv, { name: 'Created At', order: 7 });
	addColumn(csv, { name: 'Count of Linked Entries', order: 8 });
	addColumn(csv, { name: 'Author', order: 9 });

	console.log('Retrieving users from Contentful...');
	const users: CollectionProp<UserProps> = await getAllUsers();

	console.log('Retrieving asset details from Contentful...');
	progressBar.start(assetCount, 0);

	for (let i = 0; i < assetCount; i++) {
		let assetDetails: CollectionProp<EntryProps<KeyValueMap>> = await getAssetDetails(assets['items'][i]['sys']['id']);

		if (!assetDetails) {
			throw new Error(`Failed to retrieve details for ${assets['items'][i]['sys']['id']}`);
		}

		const author = getUserName(users, assets['items'][i]?.['sys']?.['createdBy']?.['sys']?.['id'] || '');

		const newRow: Row = {
			number: csv.rows.length + 1,
			cells: [
				{
					column: 'Asset ID',
					value: assets['items'][i]?.['sys']?.['id']
				},
				{
					column: 'Asset Title',
					value: assets['items'][i]?.['fields']?.['title']?.['en-US']
				},
				{
					column: 'Filename',
					value: assets['items'][i]?.['fields']?.['file']?.['en-US']?.['fileName']
				},
				{
					column: 'Content Type',
					value: assets['items'][i]?.['fields']?.['file']?.['en-US']?.['contentType']
				},
				{
					column: 'Published At',
					value: assets['items'][i]?.['sys']?.['publishedAt'] || ''
				},
				{
					column: 'Updated At',
					value: assets['items'][i]?.['sys']?.['updatedAt']
				},
				{
					column: 'Created At',
					value: assets['items'][i]?.['sys']?.['createdAt']
				},
				{
					column: 'Count of Linked Entries',
					value: assetDetails['total']
				},
				{
					column: 'Author',
					value: author
				}
			]
		};

		addRow(csv, newRow);

		progressBar.increment();
	}

	progressBar.stop();

	console.log(`Retrieved details for ${assets.items.length}/${assets.total} assets.`);

	try {
		console.log(`Writing results to file '${outputFile}'...`);
		await writeFile(outputFile, render(csv));
		console.log('File written successfully.');
	} catch (err) {
		throw new Error(err as string);
	}
}