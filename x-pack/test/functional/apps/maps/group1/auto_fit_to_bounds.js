/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import expect from '@kbn/expect';

export default function ({ getPageObjects, getService }) {
  const { maps } = getPageObjects(['maps']);
  const security = getService('security');

  describe('auto fit map to bounds', () => {
    describe('initial location', () => {
      before(async () => {
        await security.testUser.setRoles(['global_maps_all', 'test_logstash_reader']);
        await maps.loadSavedMap('document example - auto fit to bounds for initial location');
      });

      after(async () => {
        await security.testUser.restoreDefaults();
      });

      it('should automatically fit to bounds on initial map load', async () => {
        const hits = await maps.getHits();
        expect(hits).to.equal('6');

        const { lat, lon } = await maps.getView();
        expect(Math.round(lat)).to.be.within(41, 43);
        expect(Math.round(lon)).to.equal(-99);
      });
    });

    describe('without joins', () => {
      before(async () => {
        await maps.loadSavedMap('document example');
        await maps.enableAutoFitToBounds();
      });

      it('should automatically fit to bounds when query is applied', async () => {
        // Set view to other side of world so no matching results
        await maps.setView(-15, -100, 6);

        // Setting query should trigger fit to bounds and move map
        const origView = await maps.getView();
        await maps.setAndSubmitQuery('machine.os.raw : "ios"');
        await maps.waitForMapPanAndZoom(origView);

        const hits = await maps.getHits();
        expect(hits).to.equal('2');

        const { lat, lon } = await maps.getView();
        expect(Math.round(lat)).to.equal(43);
        expect(Math.round(lon)).to.equal(-102);
      });

      it('should sync layers even when there is not data', async () => {
        await maps.setAndSubmitQuery('machine.os.raw : "fake_os_with_no_matches"');

        const hits = await maps.getHits();
        expect(hits).to.equal('0');
      });
    });

    describe('with joins', () => {
      before(async () => {
        await maps.loadSavedMap('join example');
        await maps.enableAutoFitToBounds();
      });

      it('should automatically fit to bounds when query is applied', async () => {
        // Set view to other side of world so no matching results
        await maps.setView(0, 0, 6);

        // Setting query should trigger fit to bounds and move map
        const origView = await maps.getView();
        await maps.setAndSubmitQuery('prop1 >= 11');
        await maps.waitForMapPanAndZoom(origView);

        const { lat, lon } = await maps.getView();
        expect(Math.round(lat)).to.equal(0);
        expect(Math.round(lon)).to.equal(60);
      });
    });
  });
}
