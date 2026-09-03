package http

import (
	"kirmya/internal/common/swagger"
	"kirmya/internal/interview_prep/models"
)

// swaggerInterviewPrepCreate documents POST /api/v1/interview-prep
//
// @Summary      Create interview preparation workspace
// @Description  Initializes a prep space for a target company, role, or interview round
// @Tags         Interview Prep
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        request  body      models.CreatePreparationRequest  true  "Target job details"
// @Success      201      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Router       /api/v1/interview-prep [post]
func swaggerInterviewPrepCreate() {}

// swaggerInterviewPrepList documents GET /api/v1/interview-prep
//
// @Summary      List interview preparations
// @Description  Returns user's active and archived interview prep workspaces
// @Tags         Interview Prep
// @Security     BearerAuth
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Router       /api/v1/interview-prep [get]
func swaggerInterviewPrepList() {}

// swaggerInterviewPrepGetByID documents GET /api/v1/interview-prep/{id}
//
// @Summary      Get interview prep workspace
// @Description  Returns preparation details, checklist progress and readiness score
// @Tags         Interview Prep
// @Security     BearerAuth
// @Produce      json
// @Param        id   path      string  true  "Workspace ID"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Router       /api/v1/interview-prep/{id} [get]
func swaggerInterviewPrepGetByID() {}

// swaggerInterviewPrepUpdate documents PUT /api/v1/interview-prep/{id}
//
// @Summary      Update interview prep workspace
// @Description  Updates target date, interview round or status
// @Tags         Interview Prep
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        id       path      string                                true  "Workspace ID"
// @Param        request  body      models.UpdatePreparationRequest  true  "Updated fields"
// @Success      200      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Failure      404      {object}  swagger.ErrorResponse
// @Router       /api/v1/interview-prep/{id} [put]
func swaggerInterviewPrepUpdate() {}

// swaggerInterviewPrepDelete documents DELETE /api/v1/interview-prep/{id}
//
// @Summary      Delete interview prep workspace
// @Description  Removes interview prep workspace and associated mock sessions
// @Tags         Interview Prep
// @Security     BearerAuth
// @Produce      json
// @Param        id   path      string  true  "Workspace ID"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Router       /api/v1/interview-prep/{id} [delete]
func swaggerInterviewPrepDelete() {}

// swaggerInterviewPrepGenerateQuestions documents POST /api/v1/interview-prep/questions/generate
//
// @Summary      Generate AI interview questions
// @Description  Generates role-tailored behavioral and technical interview questions
// @Tags         Interview Prep
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        request  body      models.GenerateQuestionsRequest  true  "Generation context"
// @Success      200      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Router       /api/v1/interview-prep/questions/generate [post]
func swaggerInterviewPrepGenerateQuestions() {}

// swaggerInterviewPrepListQuestions documents GET /api/v1/interview-prep/questions
//
// @Summary      List interview question bank
// @Description  Returns saved questions filtered by preparation workspace or category
// @Tags         Interview Prep
// @Security     BearerAuth
// @Produce      json
// @Param        preparation_id  query     string  false  "Preparation workspace ID"
// @Param        category        query     string  false  "Behavioral, Technical, System Design"
// @Success      200             {object}  swagger.SuccessResponse
// @Failure      401             {object}  swagger.ErrorResponse
// @Router       /api/v1/interview-prep/questions [get]
func swaggerInterviewPrepListQuestions() {}

// swaggerInterviewPrepSaveQuestion documents POST /api/v1/interview-prep/questions
//
// @Summary      Save question to prep bank
// @Description  Adds a question and STAR answer notes to user's question bank
// @Tags         Interview Prep
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        request  body      models.SaveQuestionRequest  true  "Question details"
// @Success      201      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Router       /api/v1/interview-prep/questions [post]
func swaggerInterviewPrepSaveQuestion() {}

// swaggerInterviewPrepUpdateQuestion documents PUT /api/v1/interview-prep/questions/{id}
//
// @Summary      Update question practice notes
// @Description  Updates candidate's answer draft, STAR points, or practice status
// @Tags         Interview Prep
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        id       path      string                                true  "Question ID"
// @Param        request  body      models.UpdateQuestionPracticeRequest  true  "Updated notes"
// @Success      200      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Failure      404      {object}  swagger.ErrorResponse
// @Router       /api/v1/interview-prep/questions/{id} [put]
func swaggerInterviewPrepUpdateQuestion() {}

// swaggerInterviewPrepDeleteQuestion documents DELETE /api/v1/interview-prep/questions/{id}
//
// @Summary      Remove question from bank
// @Description  Deletes question from user's prep library
// @Tags         Interview Prep
// @Security     BearerAuth
// @Produce      json
// @Param        id   path      string  true  "Question ID"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Router       /api/v1/interview-prep/questions/{id} [delete]
func swaggerInterviewPrepDeleteQuestion() {}

// swaggerInterviewPrepMockStart documents POST /api/v1/interview-prep/mock/sessions
//
// @Summary      Start AI mock interview
// @Description  Begins an interactive simulated mock interview session
// @Tags         Interview Prep
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        request  body      models.StartMockSessionRequest  true  "Mock setup"
// @Success      201      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Router       /api/v1/interview-prep/mock/sessions [post]
func swaggerInterviewPrepMockStart() {}

// swaggerInterviewPrepMockList documents GET /api/v1/interview-prep/mock/sessions
//
// @Summary      List mock interview sessions
// @Description  Returns history of completed and in-progress AI mock interviews
// @Tags         Interview Prep
// @Security     BearerAuth
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Router       /api/v1/interview-prep/mock/sessions [get]
func swaggerInterviewPrepMockList() {}

// swaggerInterviewPrepMockGetByID documents GET /api/v1/interview-prep/mock/sessions/{id}
//
// @Summary      Get mock interview session
// @Description  Returns transcript, question list, and scoring for a mock session
// @Tags         Interview Prep
// @Security     BearerAuth
// @Produce      json
// @Param        id   path      string  true  "Session ID"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Router       /api/v1/interview-prep/mock/sessions/{id} [get]
func swaggerInterviewPrepMockGetByID() {}

// swaggerInterviewPrepMockSubmit documents POST /api/v1/interview-prep/mock/sessions/{id}/submit
//
// @Summary      Submit answer in mock session
// @Description  Submits spoken or typed answer for real-time AI critique and score
// @Tags         Interview Prep
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        id       path      string                          true  "Session ID"
// @Param        request  body      models.SubmitMockAnswerRequest  true  "Answer payload"
// @Success      200      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Router       /api/v1/interview-prep/mock/sessions/{id}/submit [post]
func swaggerInterviewPrepMockSubmit() {}

// swaggerInterviewPrepMockComplete documents POST /api/v1/interview-prep/mock/sessions/{id}/complete
//
// @Summary      Complete mock session
// @Description  Finalizes interview score report and generates comprehensive debrief
// @Tags         Interview Prep
// @Security     BearerAuth
// @Produce      json
// @Param        id   path      string  true  "Session ID"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Router       /api/v1/interview-prep/mock/sessions/{id}/complete [post]
func swaggerInterviewPrepMockComplete() {}

// swaggerInterviewPrepTaskCreate documents POST /api/v1/interview-prep/tasks
//
// @Summary      Add prep checklist task
// @Description  Creates preparation to-do task (e.g., company research, portfolio review)
// @Tags         Interview Prep
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        request  body      models.CreateTaskRequest  true  "Task content"
// @Success      201      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Router       /api/v1/interview-prep/tasks [post]
func swaggerInterviewPrepTaskCreate() {}

// swaggerInterviewPrepTaskList documents GET /api/v1/interview-prep/tasks
//
// @Summary      List prep checklist tasks
// @Description  Returns checklist items for preparation workspaces
// @Tags         Interview Prep
// @Security     BearerAuth
// @Produce      json
// @Param        preparation_id  query     string  false  "Workspace ID"
// @Success      200             {object}  swagger.SuccessResponse
// @Failure      401             {object}  swagger.ErrorResponse
// @Router       /api/v1/interview-prep/tasks [get]
func swaggerInterviewPrepTaskList() {}

// swaggerInterviewPrepTaskToggle documents PUT /api/v1/interview-prep/tasks/{id}
//
// @Summary      Toggle task completion
// @Description  Marks a preparation checklist item as done or pending
// @Tags         Interview Prep
// @Security     BearerAuth
// @Produce      json
// @Param        id   path      string  true  "Task ID"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Router       /api/v1/interview-prep/tasks/{id} [put]
func swaggerInterviewPrepTaskToggle() {}

// swaggerInterviewPrepTaskDelete documents DELETE /api/v1/interview-prep/tasks/{id}
//
// @Summary      Delete prep task
// @Description  Removes checklist item
// @Tags         Interview Prep
// @Security     BearerAuth
// @Produce      json
// @Param        id   path      string  true  "Task ID"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Router       /api/v1/interview-prep/tasks/{id} [delete]
func swaggerInterviewPrepTaskDelete() {}

// swaggerInterviewPrepNoteSave documents POST /api/v1/interview-prep/notes
//
// @Summary      Save debrief notes
// @Description  Saves freeform research and post-interview debrief notes
// @Tags         Interview Prep
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        request  body      models.SaveInterviewNoteRequest  true  "Note content"
// @Success      200      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Router       /api/v1/interview-prep/notes [post]
func swaggerInterviewPrepNoteSave() {}

// swaggerInterviewPrepNoteGet documents GET /api/v1/interview-prep/notes
//
// @Summary      Get workspace debrief note
// @Description  Returns notes for a target preparation workspace
// @Tags         Interview Prep
// @Security     BearerAuth
// @Produce      json
// @Param        preparation_id  query     string  true  "Workspace ID"
// @Success      200             {object}  swagger.SuccessResponse
// @Failure      401             {object}  swagger.ErrorResponse
// @Router       /api/v1/interview-prep/notes [get]
func swaggerInterviewPrepNoteGet() {}

// swaggerInterviewPrepReadiness documents GET /api/v1/interview-prep/readiness
//
// @Summary      Get candidate readiness score
// @Description  Computes overall readiness index across practiced questions and completed tasks
// @Tags         Interview Prep
// @Security     BearerAuth
// @Produce      json
// @Param        preparation_id  query     string  false  "Workspace ID"
// @Success      200             {object}  swagger.SuccessResponse
// @Failure      401             {object}  swagger.ErrorResponse
// @Router       /api/v1/interview-prep/readiness [get]
func swaggerInterviewPrepReadiness() {}

// swaggerInterviewPrepCoachChat documents POST /api/v1/interview-prep/coach/chat
//
// @Summary      Chat with AI Interview Coach
// @Description  Interactively practices answers and asks role-specific interview coaching questions
// @Tags         Interview Prep
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        request  body      models.AICoachChatRequest  true  "User message"
// @Success      200      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Router       /api/v1/interview-prep/coach/chat [post]
func swaggerInterviewPrepCoachChat() {}

var (
	_ models.CreatePreparationRequest
	_ swagger.ErrorResponse
)
