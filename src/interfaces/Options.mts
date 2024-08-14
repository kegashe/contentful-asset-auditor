import { PathLike } from 'node:fs';

/**
 * Describes the 'options' object for the get-asset-details command.
 * @property {PathLike} inputFile - Filepath of input file.
 * @property {PathLike} outputFile - Filepath of output file.
 * @property {number} max - Maximum number of items to query and return.
 */
export interface OptionsGetAssetDetails {
	inputFile: PathLike,
	outputFile: PathLike,
	max: number,
};

/**
 * Describes the 'options' object for the get-assets command.
 * @property {PathLike} outputFile - Filepath of output file.
 */
export interface OptionsGetAssets {
	outputFile: PathLike,
}