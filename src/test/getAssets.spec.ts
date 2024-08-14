import * as chai from 'chai';
import { getAssets } from '../helpers/Assets.mjs';

const expect = chai.expect;

describe('getAssets', function () {
	it(`should return successfully when 'skipInput' parameter is not provided`, async function () {
		const assets = await getAssets();
		expect(assets).to.haveOwnProperty('items');
	});

	it(`should return successfully when 'skipInput' parameter is equal to 0`, async function () {
		const assets = await getAssets(0);
		expect(assets).to.have.property('items');
	});

	it(`should return successfully when 'skipInput' parameter is less than total`, async function () {
		const assetsInitial = await getAssets();

		const assets = await getAssets(assetsInitial.total - 1);
		expect(assets).to.have.property('items');
	});

	it(`should return 0 items when 'skipInput' parameters is greater than or equal to total`, async function() {
		const assetsInitial = await getAssets();

		const assets = await getAssets(assetsInitial.total + 1);
		expect(assets).to.have.property('items')
		expect(assets).property('items').to.have.lengthOf(0);
	});
});