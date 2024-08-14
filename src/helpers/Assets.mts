import 'dotenv/config';
import cliProgress from 'cli-progress';
import contentful, { QueryOptions, PlainClientAPI, CollectionProp, AssetProps, EntryProps, KeyValueMap } from 'contentful-management';
import { createLogger } from './Loggers.mjs';
import { ILogObj, Logger } from 'tslog';

/**
 * Retrieves a collection of Assets.
 * @function
 * @param {number} [skip] - Skip value for pagination purposes.
 * @returns {Promise<CollectionProp<AssetProps>>}
 */
export async function getAssets(skip?: number): Promise<CollectionProp<AssetProps>> {
	const sysLogger: Logger<ILogObj> = createLogger(['getAssets']);

	sysLogger.debug('Creating Contentful API client...');
	const contentfulClient: PlainClientAPI = contentful.createClient(
		{
			accessToken: process.env.CONTENTFUL_CMA_TOKEN || '',
		},
		{
			type: 'plain',
			defaults: {
				spaceId: process.env.CONTENTFUL_SPACE_ID,
				environmentId: process.env.CONTENTFUL_ENVIRONMENT_ID,
			}
		}
	);
	sysLogger.debug('Contentful API client created: ', contentfulClient);

	sysLogger.debug('Calling asset.getMany method...');
	const assets: CollectionProp<AssetProps> = await contentfulClient.asset.getMany({
		query: {
			skip: skip,
			order: '-sys.createdAt',
		}
	});

	if (!assets) {
		sysLogger.warn('Failed to get Assets: ', assets)
		throw new Error(`Failed to get Assets: ${assets}`);
	}

	sysLogger.debug('Assets retrieved: ', assets);
	return assets;
}

/**
 * Retrieves and compiles a collection of all Assets.
 * @function
 * @returns {Promise<CollectionProp<AssetProps>>}
 */
export async function getAllAssets(): Promise<CollectionProp<AssetProps>> {
	const logger: Logger<ILogObj> = createLogger(['getAllAssets']);
	const progressBar: cliProgress.SingleBar = new cliProgress.SingleBar({}, cliProgress.Presets.legacy);
	const assets: CollectionProp<AssetProps> = await getAssets(0);

	const total: number = assets.total;
	const limit: number = assets.limit;
	let skip: number = limit;

	let pageCount = Math.ceil(total / limit);

	console.log('Retrieving assets from Contentful...');
	progressBar.start(total, assets.items.length);

	for (let i = 0; i < pageCount; i++) {
		logger.trace(`Calling getAssets(${skip})...`);
		const currentAssets: CollectionProp<AssetProps> = await getAssets(skip);
		logger.trace(`getAssets(${skip}) returned: `, currentAssets);

		currentAssets.items.forEach(e => assets.items.push(e));
		skip += limit;
		progressBar.increment(currentAssets.items.length);
	}

	progressBar.stop();

	console.log(`Retrieved ${assets.items.length}/${assets.total} assets.`);

	if (!assets) { 
		logger.warn('Failed to retrieve all assets.');
		throw new Error('Failed to retrieve all assets.');
	}

	logger.debug('Returning assets collection: ', assets);
	return assets;
}

/**
 * Retrieves detailed information for the given Asset.
 * @function
 * @param {string} assetId - Identifier (sys.id) of an Asset.
 * @returns {Promise<CollectionProp<AssetProps>>}
 */
export async function getAssetDetails(assetId: string): Promise<CollectionProp<EntryProps<KeyValueMap>>> {
	const logger: Logger<ILogObj> = createLogger(['getAssetDetails']);

	if (!assetId || typeof (assetId) !== 'string') {
		logger.fatal(`The 'assetId' parameter is empty or not a string.`)	
		throw new Error(`The 'assetId' parameter is empty or not a string.`);
	}

	logger.debug('Creating Contentful API client...');
	const contentfulClient: PlainClientAPI = contentful.createClient(
		{
			accessToken: process.env.CONTENTFUL_CMA_TOKEN || '',
		},
		{
			type: 'plain',
			defaults: {
				spaceId: process.env.CONTENTFUL_SPACE_ID,
				environmentId: process.env.CONTENTFUL_ENVIRONMENT_ID,
			}
		}
	);
	logger.debug('Contentful API client created: ', contentfulClient);

	const query: QueryOptions = {
		links_to_asset: assetId,
	};

	logger.debug(`Calling entry.getMany(${query})...`);
	const entries: CollectionProp<EntryProps<KeyValueMap>> = await contentfulClient.entry.getMany(
		{
			query: query
		}
	);

	if (!entries) {
		logger.warn(`Error returned from entry.getMany(${query}): `, entries);
		throw new Error(`Error returned from entry.getMany(${query})`);
	}

	logger.debug(`Returning results from entry.getMany(${query}): `, entries);
	return entries;
}