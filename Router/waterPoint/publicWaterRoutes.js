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
const publicFields = 'waterPointCode waterSourceType region district villageOrSite status location updatedAt';
function publicPoint(p) {
  return {
    code: p.waterPointCode, type: labels[p.waterSourceType] || 'Unknown',
    region: p.region?.name || 'Unknown', district: p.district?.name || 'Unknown',
    village: p.villageOrSite || '', status: labels[p.status] || 'Unknown',
    coordinates: p.location?.coordinates || null, updatedAt: p.updatedAt || null,
  };
}
router.get('/water-infrastructure/points', require('../../middleWare/requireDatabaseReady'), async (req, res) => {
  try {
    const q = req.query;
    if (Object.keys(q).some(k => !['q', 'region', 'district', 'type', 'status', 'page'].includes(k)) || Object.values(q).some(v => typeof v !== 'string' || v.length > 160)) return res.status(400).json({ message: 'Invalid filters' });
    const page = Number(q.page || 1), limit = 12;
    if (!Number.isSafeInteger(page) || page < 1 || page > 100000) return res.status(400).json({ message: 'Invalid page' });
    const match = { isActive: true };
    for (const field of ['region', 'district']) {
      if (q[field]) {
        if (!/^[a-f\d]{24}$/i.test(q[field])) return res.status(400).json({ message: 'Invalid location filter' });
        match[field] = q[field];
      }
    }
    for (const [param, field, allowed] of [['type', 'waterSourceType', ['BOREHOLE', 'SHALLOW_WELL']], ['status', 'status', ['FUNCTIONAL', 'NON_FUNCTIONAL', 'UNDER_MAINTENANCE', 'PARTIALLY_FUNCTIONAL', 'ABANDONED', 'UNKNOWN']]]) {
      if (q[param]) {
        if (!allowed.includes(q[param])) return res.status(400).json({ message: 'Invalid filter' });
        match[field] = q[param];
      }
    }
    if (q.q?.trim()) {
      const text = q.q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      match.$or = ['waterPointCode', 'villageOrSite'].map(field => ({ [field]: { $regex: text, $options: 'i' } }));
    }
    const [points, total, regionIds, districtIds] = await Promise.all([
      WaterPoint.find(match).select(publicFields).populate('region', 'name').populate('district', 'name').sort({ waterPointCode: 1, _id: 1 }).skip((page - 1) * limit).limit(limit).lean().maxTimeMS(10000),
      WaterPoint.countDocuments(match).maxTimeMS(10000),
      WaterPoint.distinct('region', { isActive: true }).maxTimeMS(10000),
      WaterPoint.distinct('district', { isActive: true, ...(q.region ? { region: q.region } : {}) }).maxTimeMS(10000),
    ]);
    const [regions, districts] = await Promise.all([
      Region.find({ _id: { $in: regionIds } }).select('name').sort({ name: 1 }).lean().maxTimeMS(10000),
      District.find({ _id: { $in: districtIds } }).select('name').sort({ name: 1 }).lean().maxTimeMS(10000),
    ]);
    const options = rows => rows.map(r => ({ value: String(r._id), label: r.name }));
    res.set('Cache-Control', 'no-store').json({ public: true, items: points.map(publicPoint), total, page, limit, regions: options(regions), districts: options(districts) });
  } catch { res.status(503).json({ message: 'Public water infrastructure data is temporarily unavailable.' }); }
});
router.get('/water-infrastructure/points/:code', require('../../middleWare/requireDatabaseReady'), async (req, res) => {
  try {
    if (req.params.code.length > 160) return res.status(400).json({ message: 'Invalid code' });
    const point = await WaterPoint.findOne({ waterPointCode: req.params.code, isActive: true }).select(publicFields).populate('region', 'name').populate('district', 'name').lean().maxTimeMS(10000);
    if (!point) return res.status(404).json({ message: 'Water point not found' });
    res.set('Cache-Control', 'no-store').json({ public: true, item: publicPoint(point) });
  } catch { res.status(503).json({ message: 'Public water infrastructure data is temporarily unavailable.' }); }
});
module.exports = router;
