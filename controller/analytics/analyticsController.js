const crypto = require("crypto");

const DailyAnalytics = require(
  "../../modules/analytics/dailyAnalyticsModel",
);

const DailyPageAnalytics = require(
  "../../modules/analytics/dailyPageAnalyticsModel",
);

const DailyVisitor = require(
  "../../modules/analytics/dailyVisitorModel",
);

/* =========================================================
   CONFIG
   ========================================================= */

const MAX_PATH_LENGTH = 500;
const MAX_VISITOR_ID_LENGTH = 200;

/*
 * Used only to prevent duplicate counting of the same
 * anonymous browser on the same day.
 *
 * Temporary DailyVisitor records expire automatically.
 */
const VISITOR_RETENTION_DAYS = 8;

/* =========================================================
   DATE HELPERS

   Analytics days use UTC consistently on the backend.
   ========================================================= */

function dateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function startOfUtcDay(date = new Date()) {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      0,
      0,
      0,
      0,
    ),
  );
}

function addUtcDays(date, amount) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + amount);
  return result;
}

function keyFromUtcDate(date) {
  return date.toISOString().slice(0, 10);
}

function dateKeyDaysAgo(days) {
  return keyFromUtcDate(
    addUtcDays(
      startOfUtcDay(),
      -days,
    ),
  );
}

/* =========================================================
   INPUT HELPERS
   ========================================================= */

function normalizePath(value) {
  if (typeof value !== "string") {
    return null;
  }

  let path = value.trim();

  if (
    !path ||
    path.length > MAX_PATH_LENGTH
  ) {
    return null;
  }

  /*
   * Only pathname is needed.
   *
   * Do not keep query parameters because they can contain
   * tokens, search text, IDs or other unnecessary data.
   */
  path = path.split("?")[0];
  path = path.split("#")[0];

  if (!path.startsWith("/")) {
    path = `/${path}`;
  }

  /*
   * Normalize duplicate slashes.
   */
  path = path.replace(/\/{2,}/g, "/");

  /*
   * Avoid creating separate analytics records only because
   * of a trailing slash.
   */
  if (
    path.length > 1 &&
    path.endsWith("/")
  ) {
    path = path.slice(0, -1);
  }

  return path;
}

function validVisitorId(value) {
  return (
    typeof value === "string" &&
    value.length >= 16 &&
    value.length <= MAX_VISITOR_ID_LENGTH &&
    /^[A-Za-z0-9_-]+$/.test(value)
  );
}

function visitorHash(visitorId) {
  const secret =
    process.env.ANALYTICS_HASH_SECRET ||
    process.env.JWT_SECRET ||
    "moewr-public-analytics";

  return crypto
    .createHmac("sha256", secret)
    .update(visitorId)
    .digest("hex");
}

function duplicateKey(error) {
  return error?.code === 11000;
}

/* =========================================================
   PUBLIC
   RECORD PAGE VIEW

   POST /api/public/analytics/view
   ========================================================= */

exports.recordView = async (req, res) => {
  try {
    const {
      path: rawPath,
      visitorId,
    } = req.body || {};

    const pagePath =
      normalizePath(rawPath);

    if (!pagePath) {
      return res.status(400).json({
        success: false,
        message: "Invalid analytics path",
      });
    }

    if (
      !validVisitorId(visitorId)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid analytics visitor identifier",
      });
    }

    /*
     * Never count Admin routes.
     */
    if (
      pagePath === "/admin" ||
      pagePath.startsWith("/admin/")
    ) {
      return res.status(204).end();
    }

    const today = dateKey();

    /*
     * 1. Count the page view.
     *
     * One document per page per day.
     */
    await DailyPageAnalytics.findOneAndUpdate(
      {
        date: today,
        path: pagePath,
      },
      {
        $inc: {
          views: 1,
        },
        $setOnInsert: {
          date: today,
          path: pagePath,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    );

    /*
     * 2. Increase today's total views.
     */
    await DailyAnalytics.findOneAndUpdate(
      {
        date: today,
      },
      {
        $inc: {
          totalViews: 1,
        },
        $setOnInsert: {
          date: today,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    );

    /*
     * 3. Check whether this browser has already been
     * counted as a unique visitor today.
     *
     * We store only a one-way hash.
     *
     * No raw IP address.
     */
    const hash =
      visitorHash(visitorId);

    const expiresAt = addUtcDays(
      startOfUtcDay(),
      VISITOR_RETENTION_DAYS,
    );

    let firstVisitToday = false;

    try {
      await DailyVisitor.create({
        date: today,
        visitorHash: hash,
        expiresAt,
      });

      firstVisitToday = true;
    } catch (error) {
      /*
       * Duplicate means this browser has already been
       * counted today.
       */
      if (!duplicateKey(error)) {
        throw error;
      }
    }

    /*
     * Only increment uniqueVisitors the first time
     * this visitor appears today.
     */
    if (firstVisitToday) {
      await DailyAnalytics.findOneAndUpdate(
        {
          date: today,
        },
        {
          $inc: {
            uniqueVisitors: 1,
          },
        },
      );
    }

    return res.status(202).json({
      success: true,
    });
  } catch (error) {
    console.error(
      "Analytics record view error:",
      error,
    );

    /*
     * Analytics must never expose internal errors.
     */
    return res.status(500).json({
      success: false,
      message:
        "Unable to record analytics",
    });
  }
};

/* =========================================================
   ADMIN DASHBOARD

   GET /api/admin/analytics?days=30
   ========================================================= */

exports.dashboard = async (
  req,
  res,
) => {
  try {
    const rawDays = Number(
      req.query.days || 30,
    );

    const days = [
      7,
      14,
      30,
      90,
      365,
    ].includes(rawDays)
      ? rawDays
      : 30;

    const today = dateKey();
    const yesterday =
      dateKeyDaysAgo(1);

    const chartStart =
      dateKeyDaysAgo(days - 1);

    const weekStart =
      dateKeyDaysAgo(6);

    const monthStart =
      dateKeyDaysAgo(29);

    const [
      todayRecord,
      yesterdayRecord,
      weekTotals,
      monthTotals,
      allTimeTotals,
      chartRecords,
      topPages,
    ] = await Promise.all([
      DailyAnalytics.findOne({
        date: today,
      })
        .select(
          "date totalViews uniqueVisitors -_id",
        )
        .lean(),

      DailyAnalytics.findOne({
        date: yesterday,
      })
        .select(
          "date totalViews uniqueVisitors -_id",
        )
        .lean(),

      DailyAnalytics.aggregate([
        {
          $match: {
            date: {
              $gte: weekStart,
              $lte: today,
            },
          },
        },
        {
          $group: {
            _id: null,
            views: {
              $sum: "$totalViews",
            },
            visitors: {
              $sum: "$uniqueVisitors",
            },
          },
        },
      ]),

      DailyAnalytics.aggregate([
        {
          $match: {
            date: {
              $gte: monthStart,
              $lte: today,
            },
          },
        },
        {
          $group: {
            _id: null,
            views: {
              $sum: "$totalViews",
            },
            visitors: {
              $sum: "$uniqueVisitors",
            },
          },
        },
      ]),

      DailyAnalytics.aggregate([
        {
          $group: {
            _id: null,
            views: {
              $sum: "$totalViews",
            },
            visitors: {
              $sum: "$uniqueVisitors",
            },
          },
        },
      ]),

      DailyAnalytics.find({
        date: {
          $gte: chartStart,
          $lte: today,
        },
      })
        .select(
          "date totalViews uniqueVisitors -_id",
        )
        .sort({
          date: 1,
        })
        .lean(),

      DailyPageAnalytics.aggregate([
        {
          $match: {
            date: {
              $gte: monthStart,
              $lte: today,
            },
          },
        },
        {
          $group: {
            _id: "$path",
            views: {
              $sum: "$views",
            },
          },
        },
        {
          $sort: {
            views: -1,
            _id: 1,
          },
        },
        {
          $limit: 10,
        },
        {
          $project: {
            _id: 0,
            path: "$_id",
            views: 1,
          },
        },
      ]),
    ]);

    /*
     * Fill missing chart dates with zero.
     *
     * This keeps the frontend chart continuous even when
     * there were no recorded visits on a particular day.
     */
    const chartMap = new Map(
      chartRecords.map(
        (record) => [
          record.date,
          record,
        ],
      ),
    );

    const chart = [];

    for (
      let i = days - 1;
      i >= 0;
      i -= 1
    ) {
      const key =
        dateKeyDaysAgo(i);

      const record =
        chartMap.get(key);

      chart.push({
        date: key,
        views:
          record?.totalViews || 0,
        visitors:
          record?.uniqueVisitors || 0,
      });
    }

    const week =
      weekTotals[0] || {
        views: 0,
        visitors: 0,
      };

    const month =
      monthTotals[0] || {
        views: 0,
        visitors: 0,
      };

    const allTime =
      allTimeTotals[0] || {
        views: 0,
        visitors: 0,
      };

    return res
      .set(
        "Cache-Control",
        "no-store",
      )
      .json({
        success: true,

        range: {
          days,
          from: chartStart,
          to: today,
        },

        summary: {
          today: {
            views:
              todayRecord
                ?.totalViews || 0,
            visitors:
              todayRecord
                ?.uniqueVisitors || 0,
          },

          yesterday: {
            views:
              yesterdayRecord
                ?.totalViews || 0,
            visitors:
              yesterdayRecord
                ?.uniqueVisitors || 0,
          },

          last7Days: {
            views:
              week.views || 0,
            visitors:
              week.visitors || 0,
          },

          last30Days: {
            views:
              month.views || 0,
            visitors:
              month.visitors || 0,
          },

          allTime: {
            views:
              allTime.views || 0,
            visitors:
              allTime.visitors || 0,
          },
        },

        chart,

        /*
         * Top pages currently represent the last 30 days.
         */
        topPages,

        generatedAt:
          new Date().toISOString(),
      });
  } catch (error) {
    console.error(
      "Analytics dashboard error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load website analytics",
    });
  }
};