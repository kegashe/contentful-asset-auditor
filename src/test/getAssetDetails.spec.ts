import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { getAssets, getAssetDetails } from '../helpers/Assets.mjs';

const expect = chai.expect;

chai.use(chaiAsPromised);

describe('getAssetDetails', function () {
	before(async function () {
		this.assets = await getAssets(0);
	});

	it(`should return an object with the 'total' field`, async function () {
		const assetDetails = await getAssetDetails(this.assets.items[0].sys.id);
		expect(assetDetails).to.have.property('total');
	});

	it(`should fail if the 'assetId' parameter is not a valid asset ID`, async function () {
		expect(getAssetDetails('badId')).to.eventually.be.rejectedWith(Error);
	});
});