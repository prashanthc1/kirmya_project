import axios from 'axios';
import {
  InterviewPreparation,
  InterviewQuestion,
  MockInterviewSession,
  MockInterviewAnswer,
  PreparationTask,
  InterviewNote,
  InterviewReadinessScore,
  AICoachSession,
  CreatePreparationRequest,
  UpdatePreparationRequest,
  GenerateQuestionsRequest,
  SaveQuestionRequest,
  UpdateQuestionPracticeRequest,
  StartMockSessionRequest,
  SubmitMockAnswerRequest,
  CreateTaskRequest,
  SaveInterviewNoteRequest,
  AICoachChatRequest,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export const InterviewPrepAPI = {
  // Preparations Workspaces
  async listPreparations(): Promise<InterviewPreparation[]> {
    const res = await axios.get(`${API_BASE}/interview-prep`, { withCredentials: true });
    return res.data || [];
  },

  async getPreparation(id: string): Promise<InterviewPreparation> {
    const res = await axios.get(`${API_BASE}/interview-prep/${id}`, { withCredentials: true });
    return res.data;
  },

  async createPreparation(req: CreatePreparationRequest): Promise<InterviewPreparation> {
    const res = await axios.post(`${API_BASE}/interview-prep`, req, { withCredentials: true });
    return res.data;
  },

  async updatePreparation(id: string, req: UpdatePreparationRequest): Promise<InterviewPreparation> {
    const res = await axios.put(`${API_BASE}/interview-prep/${id}`, req, { withCredentials: true });
    return res.data;
  },

  async deletePreparation(id: string): Promise<void> {
    await axios.delete(`${API_BASE}/interview-prep/${id}`, { withCredentials: true });
  },

  // Questions & AI Generation
  async generateQuestions(req: GenerateQuestionsRequest): Promise<InterviewQuestion[]> {
    const res = await axios.post(`${API_BASE}/interview-prep/questions/generate`, req, { withCredentials: true });
    return res.data || [];
  },

  async listQuestions(prepID?: string): Promise<InterviewQuestion[]> {
    const params = prepID ? { preparation_id: prepID } : {};
    const res = await axios.get(`${API_BASE}/interview-prep/questions`, { params, withCredentials: true });
    return res.data || [];
  },

  async saveQuestion(req: SaveQuestionRequest): Promise<InterviewQuestion> {
    const res = await axios.post(`${API_BASE}/interview-prep/questions`, req, { withCredentials: true });
    return res.data;
  },

  async updateQuestionPractice(id: string, req: UpdateQuestionPracticeRequest): Promise<InterviewQuestion> {
    const res = await axios.put(`${API_BASE}/interview-prep/questions/${id}`, req, { withCredentials: true });
    return res.data;
  },

  async deleteQuestion(id: string): Promise<void> {
    await axios.delete(`${API_BASE}/interview-prep/questions/${id}`, { withCredentials: true });
  },

  // AI Mock Interview Sessions
  async startMockSession(req: StartMockSessionRequest): Promise<MockInterviewSession> {
    const res = await axios.post(`${API_BASE}/interview-prep/mock/sessions`, req, { withCredentials: true });
    return res.data;
  },

  async listMockSessions(): Promise<MockInterviewSession[]> {
    const res = await axios.get(`${API_BASE}/interview-prep/mock/sessions`, { withCredentials: true });
    return res.data || [];
  },

  async getMockSession(id: string): Promise<MockInterviewSession> {
    const res = await axios.get(`${API_BASE}/interview-prep/mock/sessions/${id}`, { withCredentials: true });
    return res.data;
  },

  async submitMockAnswer(sessionId: string, req: SubmitMockAnswerRequest): Promise<MockInterviewAnswer> {
    const res = await axios.post(`${API_BASE}/interview-prep/mock/sessions/${sessionId}/submit`, req, { withCredentials: true });
    return res.data;
  },

  async completeMockSession(sessionId: string): Promise<MockInterviewSession> {
    const res = await axios.post(`${API_BASE}/interview-prep/mock/sessions/${sessionId}/complete`, {}, { withCredentials: true });
    return res.data;
  },

  // Preparation Tasks
  async createTask(req: CreateTaskRequest): Promise<PreparationTask> {
    const res = await axios.post(`${API_BASE}/interview-prep/tasks`, req, { withCredentials: true });
    return res.data;
  },

  async listTasks(prepID: string): Promise<PreparationTask[]> {
    const res = await axios.get(`${API_BASE}/interview-prep/tasks`, { params: { preparation_id: prepID }, withCredentials: true });
    return res.data || [];
  },

  async toggleTaskCompletion(id: string, isCompleted: boolean): Promise<void> {
    await axios.put(`${API_BASE}/interview-prep/tasks/${id}`, {}, { params: { is_completed: isCompleted }, withCredentials: true });
  },

  async deleteTask(id: string): Promise<void> {
    await axios.delete(`${API_BASE}/interview-prep/tasks/${id}`, { withCredentials: true });
  },

  // Notes, Readiness & AI Coach
  async saveNote(req: SaveInterviewNoteRequest): Promise<InterviewNote> {
    const res = await axios.post(`${API_BASE}/interview-prep/notes`, req, { withCredentials: true });
    return res.data;
  },

  async getNote(prepID: string): Promise<InterviewNote> {
    const res = await axios.get(`${API_BASE}/interview-prep/notes`, { params: { preparation_id: prepID }, withCredentials: true });
    return res.data;
  },

  async getReadinessScore(): Promise<InterviewReadinessScore> {
    const res = await axios.get(`${API_BASE}/interview-prep/readiness`, { withCredentials: true });
    return res.data;
  },

  async chatAICoach(req: AICoachChatRequest): Promise<AICoachSession> {
    const res = await axios.post(`${API_BASE}/interview-prep/coach/chat`, req, { withCredentials: true });
    return res.data;
  },
};
