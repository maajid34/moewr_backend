const router = require('express').Router();
const WaterPoint = require('../../modules/waterPoint/waterPointModel');
const Region = require('../../modules/waterPoint/regionModel');
const District = require('../../modules/waterPoint/districtModel');
const labels = { BOREHOLE: 'Borehole', SHALLOW_WELL: 'Shallow Well', FUNCTIONAL: 'Functional', NON_FUNCTIONAL: 'Non-Functional', UNDER_MAINTENANCE: 'Under Maintenance', PARTIALLY_FUNCTIONAL: 'Partially Functional', ABANDONED: 'Abandoned', UNKNOWN: 'Unknown' };
const sum = (field, value) => ({ $sum: { $cond: [{ $eq: ['$' + field, value] }, 1, 0] } });

// Anonymous, read-only projection. No admin controller or full document response.
router.get('/water-infrastructure', require('../../middleWare/requireDatabaseReady'), async (_req, res) => {
  try {
    const [result] = await WaterPoint.aggregate([
      { $match: { isActive: true } },
      { $facet: {
        totals: [{ $group: { _id: null, total: { $sum: 1 }, boreholes: sum('waterSourceType', 'BOREHOLE'), shallowWells: sum('waterSourceType', 'SHALLOW_WELL'), functional: sum('status', 'FUNCTIONAL'), nonFunctional: sum('status', 'NON_FUNCTIONAL'), underMaintenance: sum('status', 'UNDER_MAINTENANCE') } }, { $project: { _id: 0 } }],
        regions: [{ $group: { _id: '$region', count: { $sum: 1 } } }],
        points: [{ $sort: { _id: 1 } }, { $limit: 1000 }, { $project: { _id: 0, waterPointCode: 1, waterSourceType: 1, region: 1, district: 1, villageOrSite: 1, status: 1, location: 1 } }],
      } },
    ]).option({ maxTimeMS: 10000 });
    const [regions, districts] = await Promise.all([
      Region.find({ _id: { $in: result.regions.map(r => r._id) } }).select('name').lean().maxTimeMS(10000),
      District.find({ _id: { $in: result.points.map(p => p.district) } }).select('name').lean().maxTimeMS(10000),
    ]);
    const names = rows => new Map(rows.map(r => [String(r._id), r.name]));
    const regionNames = names(regions), districtNames = names(districts);
    res.set('Cache-Control', 'no-store').json({
      public: true,
      summary: result.totals[0] || { total: 0, boreholes: 0, shallowWells: 0, functional: 0, nonFunctional: 0, underMaintenance: 0 },
      regions: result.regions.map(r => ({ name: regionNames.get(String(r._id)) || 'Unknown', count: r.count })).sort((a, b) => a.name.localeCompare(b.name)),
      gis: { type: 'FeatureCollection', features: result.points.map(p => ({
        type: 'Feature', geometry: { type: 'Point', coordinates: p.location.coordinates },
        properties: { code: p.waterPointCode, type: labels[p.waterSourceType] || 'Unknown', region: regionNames.get(String(p.region)) || 'Unknown', district: districtNames.get(String(p.district)) || 'Unknown', village: p.villageOrSite, status: labels[p.status] || 'Unknown' },
      })) },
    });
  } catch {
    res.status(503).json({ message: 'Public water infrastructure data is temporarily unavailable.' });
  }
});
module.exports = router;
