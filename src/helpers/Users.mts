import 'dotenv/config';
import cliProgress from 'cli-progress';
import contentful, { PlainClientAPI, CollectionProp, UserProps } from "contentful-management";
import { Logger, ILogObj } from 'tslog';

import { createLogger } from './Loggers.mjs';

/**
 * Retrieves a collection of Users.
 * @function
 * @param {number} [skip] - Skip value for pagination purposes.
 * @returns	{Promise<CollectionProp<UserProps>>}
 */
export async function getUsers(skip?: number): Promise<CollectionProp<UserProps>> {
	const logger: Logger<ILogObj> = createLogger(['getUsers']);

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

	logger.debug('Calling user.getManyForSpace()...');
	const users: CollectionProp<UserProps> = await contentfulClient.user.getManyForSpace(
		{
			spaceId: process.env.CONTENTFUL_SPACE_ID || '',
			query: {
				limit: 100,
				skip: skip,
				order: '-sys.createdAt',
			}
		}
	);

	if (!users) {
		logger.warn(`Error returned from user.getManyForSpace(): `, users);
		throw new Error('Failed to retrieve users.');
	}

	logger.debug('Returning results from user.getManyForSpace(): ', users);
	return users;
}

/**
 * Retrieves and compiles a collection of all Users.
 * @function
 * @returns {Promise<CollectionProp<UserProps>>}
 */
export async function getAllUsers(): Promise<CollectionProp<UserProps>> {
	const logger: Logger<ILogObj> = createLogger(['getAllUsers']);
	const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.legacy);
	const users: CollectionProp<UserProps> = await getUsers(0);

	const total: number = users.total;
	const limit: number = users.limit || 100;
	let skip: number = limit;
	let pageCount: number = Math.ceil(total / limit);

	progressBar.start(total, users.items.length);

	for (let i = 0; i < pageCount; i++) {
		let currentUsers: CollectionProp<UserProps> = await getUsers(skip);
		currentUsers.items.forEach(u => users.items.push(u));
		skip += limit;
		progressBar.increment(currentUsers.items.length);
	}

	progressBar.stop();

	if (!users) {
		logger.warn('Error getting all users.')
		throw new Error('Failed to retrieve users.');
	}

	logger.info(`Retrieved ${users.items.length}/${users.total} users.`)
	return users;
}

/**
 * Retrieves the name of the given User.
 * @function
 * @param {CollectionProp<UserProps>} users - Collection of Users.
 * @param {string} userId - Identifier of a given User.
 * @returns {string}
 */
export function getUserName(users: CollectionProp<UserProps>, userId: string): string {
	const logger: Logger<ILogObj> = createLogger(['getUserName']);

	logger.debug(`Looking for ${userId} in 'users' collection...`);
	const user: UserProps | undefined = users.items.find(u => u.sys.id === userId);

	if (!user) {
		logger.info(`${userId} was not found in 'users' collection.`);
		return 'N/A';
	}

	return user.firstName + ' ' + user.lastName;
}