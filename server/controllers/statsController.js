import FeedbackForm from "../models/FeedbackForm.js";
import Submission from "../models/Submission.js";

export async function getStats(req, res) {
  try {
    const userId = req.userId;

    const [bugStats, submissionStats] = await Promise.all([
      FeedbackForm.aggregate([
        { $match: { userId } },
        {
          $facet: {
            totalCount: [{ $count: "count" }],
            byStatus: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
            bySeverity: [{ $group: { _id: "$severity", count: { $sum: 1 } } }],
            byType: [{ $group: { _id: "$bugType", count: { $sum: 1 } } }],
            byPriority: [{ $group: { _id: "$priority", count: { $sum: 1 } } }],
          },
        },
      ]),
      Submission.aggregate([
        { $match: { userId } },
        {
          $facet: {
            totalCount: [{ $count: "count" }],
            byStatus: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
          },
        },
      ]),
    ]);

    const bugFacet = bugStats[0] || {};
    const subFacet = submissionStats[0] || {};

    const totalBugs = bugFacet.totalCount?.[0]?.count || 0;
    const bugsByStatus = (bugFacet.byStatus || []).reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {});
    const bugsBySeverity = (bugFacet.bySeverity || []).reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {});
    const bugsByType = (bugFacet.byType || []).reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {});
    const bugsByPriority = (bugFacet.byPriority || []).reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {});

    const totalSubmissions = subFacet.totalCount?.[0]?.count || 0;
    const submissionsByStatus = (subFacet.byStatus || []).reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {});

    const openBugs = bugsByStatus["Open"] || 0;
    const inProgressBugs = bugsByStatus["In Progress"] || 0;
    const criticalBugs = bugsBySeverity["Critical"] || 0;

    const acceptanceRate =
      totalSubmissions > 0
        ? Math.round(
            ((submissionsByStatus["Accepted"] || 0) / totalSubmissions) * 100
          )
        : 0;

    res.json({
      overview: {
        totalBugs, openBugs, inProgressBugs,
        criticalBugs, totalSubmissions, acceptanceRate,
      },
      bugsByStatus,
      bugsBySeverity,
      bugsByType,
      bugsByPriority,
      submissionsByStatus,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
