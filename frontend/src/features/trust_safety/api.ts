import { trustSafetyApi } from './services/trustSafetyApi';

export { trustSafetyApi };
export const safetyApi = trustSafetyApi;

export const getSafetyCases = trustSafetyApi.getSafetyCases.bind(trustSafetyApi);
export const getCaseDetails = trustSafetyApi.getCaseDetails.bind(trustSafetyApi);
export const claimCase = trustSafetyApi.claimCase.bind(trustSafetyApi);
export const assignCase = trustSafetyApi.assignCase.bind(trustSafetyApi);
export const updateCaseStatus = trustSafetyApi.updateCaseStatus.bind(trustSafetyApi);
export const takeModerationAction = trustSafetyApi.takeModerationAction.bind(trustSafetyApi);
export const getModerationDecisions = trustSafetyApi.getModerationDecisions.bind(trustSafetyApi);
export const getUserAppeals = trustSafetyApi.getUserAppeals.bind(trustSafetyApi);
export const getAppeals = trustSafetyApi.getAppeals.bind(trustSafetyApi);
export const submitAppeal = trustSafetyApi.submitAppeal.bind(trustSafetyApi);
export const resolveAppeal = trustSafetyApi.resolveAppeal.bind(trustSafetyApi);
export const getSafetyPolicies = trustSafetyApi.getSafetyPolicies.bind(trustSafetyApi);
export const updateSafetyPolicy = trustSafetyApi.updateSafetyPolicy.bind(trustSafetyApi);
export const createSafetyPolicy = trustSafetyApi.createSafetyPolicy.bind(trustSafetyApi);
export const getUserRestrictions = trustSafetyApi.getUserRestrictions.bind(trustSafetyApi);
export const createRestriction = trustSafetyApi.createRestriction.bind(trustSafetyApi);
export const liftRestriction = trustSafetyApi.liftRestriction.bind(trustSafetyApi);
export const getUserBlocks = trustSafetyApi.getUserBlocks.bind(trustSafetyApi);
export const blockUser = trustSafetyApi.blockUser.bind(trustSafetyApi);
export const unblockUser = trustSafetyApi.unblockUser.bind(trustSafetyApi);
export const getUserMutes = trustSafetyApi.getUserMutes.bind(trustSafetyApi);
export const muteUser = trustSafetyApi.muteUser.bind(trustSafetyApi);
export const unmuteUser = trustSafetyApi.unmuteUser.bind(trustSafetyApi);
export const submitReport = trustSafetyApi.submitReport.bind(trustSafetyApi);
export const getUserReports = trustSafetyApi.getUserReports.bind(trustSafetyApi);
export const getSafetyMetrics = trustSafetyApi.getSafetyMetrics.bind(trustSafetyApi);
export const getReputationSignals = trustSafetyApi.getReputationSignals.bind(trustSafetyApi);
export const getModeratorWorkloads = trustSafetyApi.getModeratorWorkloads.bind(trustSafetyApi);
export const getSafetyRules = trustSafetyApi.getSafetyRules.bind(trustSafetyApi);
export const updateSafetyRule = trustSafetyApi.updateSafetyRule.bind(trustSafetyApi);

// Legacy Export for Compatibility
export const trustApi = {
  getReports: async (status?: string) => {
    const reports = await trustSafetyApi.getUserReports();
    return {
      data: reports.map((r) => ({
        id: r.id,
        reporter_id: r.reporter_id || 'u-1',
        target_type: r.target_type,
        target_id: r.target_id,
        target_name: r.target_title || 'Reported Entity',
        category: r.category,
        reason: r.description,
        status: status || r.status,
        created_at: r.created_at,
      })),
      count: reports.length,
    };
  },
  submitReport: async (payload: { target_type: string; target_id: string; category: string; reason: string }) => {
    const res = await trustSafetyApi.submitReport({
      target_type: payload.target_type,
      target_id: payload.target_id,
      category: payload.category,
      description: payload.reason,
    });
    return {
      message: 'Report submitted successfully',
      report: {
        id: res.id,
        reporter_id: res.reporter_id || 'u-1',
        target_type: res.target_type,
        target_id: res.target_id,
        target_name: res.target_title || 'Reported Entity',
        category: res.category,
        reason: res.description,
        status: res.status,
        created_at: res.created_at,
      },
    };
  },
  executeModerationAction: async (reportID: string, payload: { action: string; notes?: string }) => {
    const act = await trustSafetyApi.takeModerationAction({
      case_id: reportID,
      action: payload.action,
      notes: payload.notes,
    });
    return {
      message: 'Action executed',
      action: {
        id: act.id,
        moderator_id: act.moderator_id,
        target_id: act.target_id,
        target_type: act.target_type,
        action: act.action,
        notes: act.notes,
        created_at: act.created_at,
      },
    };
  },
  blockUser: async (blockedID: string, reason?: string) => {
    await trustSafetyApi.blockUser(blockedID, reason);
    return { message: 'User blocked successfully' };
  },
  getFraudLogs: async () => {
    return {
      data: [
        {
          id: 'f-1',
          entity_type: 'job',
          entity_id: 'j-1',
          entity_title: 'Remote Crypto Analyst',
          fraud_score: 95.0,
          triggers: ['advance_payment_request', 'telegram_only'],
          action_taken: 'Flagged for Human Review',
          created_at: new Date().toISOString(),
        },
      ],
      count: 1,
    };
  },
  getBadges: async () => {
    return {
      data: [
        {
          id: 'b-1',
          entity_id: 'u-1',
          entity_type: 'user',
          badge_type: 'identity_verified',
          issued_at: new Date().toISOString(),
        },
      ],
      count: 1,
    };
  },
};

export default trustApi;
