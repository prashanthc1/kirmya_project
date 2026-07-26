'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  Grid,
  Card,
  CardContent,
  Alert,
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import RouteIcon from '@mui/icons-material/Route';
import PsychologyIcon from '@mui/icons-material/Psychology';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

import { learningApi } from '../../features/learning/api';
import {
  Course,
  LearningPath,
  UserLearningProgress,
  Certificate,
  CourseCategory,
  SubmitAssessmentPayload,
} from '../../features/learning/types';
import CourseGrid from '../../features/learning/components/CourseGrid';
import LearningPathCard from '../../features/learning/components/LearningPathCard';
import SkillAssessmentModal from '../../features/learning/components/SkillAssessmentModal';
import CertificatesViewer from '../../features/learning/components/CertificatesViewer';

export default function LearningPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [courses, setCourses] = useState<Course[]>([]);
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [userProgress, setUserProgress] = useState<UserLearningProgress[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  const [assessmentModalOpen, setAssessmentModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resCourses, resPaths, resProgress, resCerts] = await Promise.allSettled([
        learningApi.getCourses(),
        learningApi.getLearningPaths(),
        learningApi.getUserProgress(),
        learningApi.getCertificates(),
      ]);

      if (resCourses.status === 'fulfilled') {
        setCourses(resCourses.value?.data || mockCourses);
      } else {
        setCourses(mockCourses);
      }

      if (resPaths.status === 'fulfilled') {
        setPaths(resPaths.value?.data || mockPaths);
      } else {
        setPaths(mockPaths);
      }

      if (resProgress.status === 'fulfilled') {
        setUserProgress(resProgress.value?.data || mockProgress);
      } else {
        setUserProgress(mockProgress);
      }

      if (resCerts.status === 'fulfilled') {
        setCertificates(resCerts.value?.certificates || mockCertificates);
      } else {
        setCertificates(mockCertificates);
      }
    } catch (err) {
      console.error('Error fetching learning hub data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEnrollCourse = async (course: Course) => {
    await learningApi.enroll(course.id);
    await fetchData();
  };

  const handleUpdateLessonProgress = async (courseId: string, completedLessons: number) => {
    await learningApi.updateProgress({
      course_id: courseId,
      completed_lessons: completedLessons,
      time_spent_minutes: 45,
    });
    await fetchData();
  };

  const handleSubmitAssessment = async (domain: CourseCategory, answers: Record<string, number>) => {
    const res = await learningApi.submitSkillAssessment({ domain, answers });
    await fetchData();
    return res.assessment;
  };

  // Mock initial data fallbacks for instant rich UI rendering
  const mockCourses: Course[] = [
    {
      id: 'a1111111-1111-1111-1111-111111111111',
      title: 'Full-Stack Web Development with Go & Next.js',
      description: 'Master modern full-stack web applications, REST APIs, database indexing, and React state management.',
      category: 'Technology',
      difficulty_level: 'intermediate',
      provider: 'kirmya',
      duration_hours: 18,
      total_lessons: 16,
      rating: 4.9,
      skills_covered: ['Go', 'Next.js', 'PostgreSQL', 'TypeScript', 'REST API'],
      created_at: new Date().toISOString(),
    },
    {
      id: 'a2222222-2222-2222-2222-222222222222',
      title: 'Agile Product Management & Scrum Leadership',
      description: 'Learn sprint planning, backlog prioritization, stakeholder management, and product roadmap execution.',
      category: 'Management',
      difficulty_level: 'intermediate',
      provider: 'kirmya',
      duration_hours: 12,
      total_lessons: 10,
      rating: 4.8,
      skills_covered: ['Agile', 'Scrum', 'Product Roadmap', 'Jira', 'Prioritization'],
      created_at: new Date().toISOString(),
    },
    {
      id: 'a3333333-3333-3333-3333-333333333333',
      title: 'Executive Communication & Salary Negotiation',
      description: 'Build persuasive presentation skills, emotional intelligence, cross-team influence, and career negotiation tactics.',
      category: 'Soft skills',
      difficulty_level: 'all_levels',
      provider: 'kirmya',
      duration_hours: 8,
      total_lessons: 8,
      rating: 4.95,
      skills_covered: ['Public Speaking', 'Negotiation', 'Emotional Intelligence', 'Conflict Resolution'],
      created_at: new Date().toISOString(),
    },
    {
      id: 'a4444444-4444-4444-4444-444444444444',
      title: 'FAANG Technical Interview & System Design Masterclass',
      description: 'Cracking coding interviews: Data structures, algorithm optimization, system design blueprints, and mock interviews.',
      category: 'Interview preparation',
      difficulty_level: 'advanced',
      provider: 'kirmya',
      duration_hours: 20,
      total_lessons: 18,
      rating: 4.9,
      skills_covered: ['Algorithms', 'Data Structures', 'System Design', 'Mock Interviews'],
      created_at: new Date().toISOString(),
    },
    {
      id: 'a5555555-5555-5555-5555-555555555555',
      title: 'AWS Certified Solutions Architect Official Prep',
      description: 'Comprehensive preparation for AWS SAA-C03 certification exam covering S3, EC2, VPC, Lambda, and IAM security.',
      category: 'Industry certifications',
      difficulty_level: 'intermediate',
      provider: 'coursera',
      external_url: 'https://coursera.org/learn/aws-architect',
      duration_hours: 24,
      total_lessons: 20,
      rating: 4.85,
      skills_covered: ['AWS', 'Cloud Architecture', 'IAM', 'Serverless', 'Security'],
      created_at: new Date().toISOString(),
    },
  ];

  const mockPaths: LearningPath[] = [
    {
      id: 'b1111111-1111-1111-1111-111111111111',
      title: 'Job-Ready Senior Software Engineer Track',
      description: 'Step-by-step career transformation path from technical coding to system architecture and FAANG interview readiness.',
      target_role: 'Senior Full-Stack Engineer',
      category: 'Technology',
      estimated_weeks: 6,
      course_ids: ['a1111111-1111-1111-1111-111111111111', 'a4444444-4444-4444-4444-444444444444'],
      badge_name: 'Certified Job-Ready Engineer',
      created_at: new Date().toISOString(),
    },
    {
      id: 'b2222222-2222-2222-2222-222222222222',
      title: 'Product Manager & Technical Leadership Accelerator',
      description: 'Transition into high-impact management with mastery over agile methodologies, executive communication, and team leadership.',
      target_role: 'Technical Product Manager',
      category: 'Management',
      estimated_weeks: 4,
      course_ids: ['a2222222-2222-2222-2222-222222222222', 'a3333333-3333-3333-3333-333333333333'],
      badge_name: 'Certified Product Leader',
      created_at: new Date().toISOString(),
    },
  ];

  const mockProgress: UserLearningProgress[] = [
    {
      id: 'prog-1',
      user_id: '9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d',
      course_id: 'a1111111-1111-1111-1111-111111111111',
      course_title: 'Full-Stack Web Development with Go & Next.js',
      status: 'in_progress',
      completed_lessons: 12,
      total_lessons: 16,
      completion_percentage: 75,
      time_spent_minutes: 540,
      last_accessed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    },
  ];

  const mockCertificates: Certificate[] = [
    {
      id: 'cert-101',
      user_id: '9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d',
      user_name: 'Alex Rivera',
      course_id: 'a3333333-3333-3333-3333-333333333333',
      title: 'Certified Professional: Executive Communication & Negotiation',
      verification_code: 'KIRMYA-EXEC-8F391A',
      skills_mastered: ['Public Speaking', 'Negotiation', 'Emotional Intelligence'],
      issue_date: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
    },
  ];

  return (
    <Box sx={{ bgcolor: '#090d16', minHeight: '100vh', color: '#f8fafc', py: 4 }}>
      <Container maxWidth="xl">
        {/* Header & Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ color: '#f8fafc', background: 'linear-gradient(90deg, #38bdf8 0%, #a855f7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Kirmya Learning Hub
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
              Empowering job-seekers to upskill, master career tracks, and earn verified industry credentials.
            </Typography>
          </Box>

          <Button
            variant="contained"
            onClick={() => setAssessmentModalOpen(true)}
            startIcon={<AutoAwesomeIcon />}
            sx={{ bgcolor: '#38bdf8', color: '#0f172a', fontWeight: 'bold', px: 3, py: 1, '&:hover': { bgcolor: '#0284c7' } }}
          >
            Take Skill Assessment
          </Button>
        </Box>

        {/* Top Metric Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2 }}>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#94a3b8' }}>Courses Enrolled</Typography>
                  <SchoolIcon sx={{ color: '#38bdf8' }} />
                </Box>
                <Typography variant="h4" fontWeight="bold" sx={{ color: '#f8fafc', mt: 1 }}>
                  {userProgress.length || 1}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2 }}>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#94a3b8' }}>Learning Paths</Typography>
                  <RouteIcon sx={{ color: '#a855f7' }} />
                </Box>
                <Typography variant="h4" fontWeight="bold" sx={{ color: '#a855f7', mt: 1 }}>
                  {paths.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2 }}>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#94a3b8' }}>Skill Assessment Score</Typography>
                  <PsychologyIcon sx={{ color: '#10b981' }} />
                </Box>
                <Typography variant="h4" fontWeight="bold" sx={{ color: '#10b981', mt: 1 }}>
                  85%
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2 }}>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#94a3b8' }}>Earned Credentials</Typography>
                  <WorkspacePremiumIcon sx={{ color: '#f59e0b' }} />
                </Box>
                <Typography variant="h4" fontWeight="bold" sx={{ color: '#f59e0b', mt: 1 }}>
                  {certificates.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tab Navigation */}
        <Paper sx={{ mb: 3, bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 1.5 }}>
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            textColor="inherit"
            indicatorColor="primary"
            sx={{
              '& .MuiTabs-indicator': { bgcolor: '#38bdf8' },
              '& .MuiTab-root': { color: '#94a3b8', fontWeight: 'bold', textTransform: 'none' },
              '& .Mui-selected': { color: '#38bdf8' },
            }}
          >
            <Tab icon={<SchoolIcon fontSize="small" />} iconPosition="start" label="Recommended Courses" />
            <Tab icon={<RouteIcon fontSize="small" />} iconPosition="start" label="Learning Paths" />
            <Tab icon={<WorkspacePremiumIcon fontSize="small" />} iconPosition="start" label="Verified Certificates" />
          </Tabs>
        </Paper>

        {/* Tab 0: Recommended Courses */}
        {activeTab === 0 && (
          <CourseGrid
            courses={courses}
            userProgress={userProgress}
            onEnrollCourse={handleEnrollCourse}
            onUpdateLessonProgress={handleUpdateLessonProgress}
          />
        )}

        {/* Tab 1: Learning Paths */}
        {activeTab === 1 && (
          <Grid container spacing={3}>
            {paths.map((path) => (
              <Grid item xs={12} md={6} key={path.id}>
                <LearningPathCard
                  path={path}
                  onEnrollPath={(p) => handleEnrollCourse({ id: p.course_ids[0] } as any)}
                />
              </Grid>
            ))}
          </Grid>
        )}

        {/* Tab 2: Verified Certificates */}
        {activeTab === 2 && (
          <CertificatesViewer certificates={certificates} />
        )}

        {/* Skill Assessment Modal */}
        <SkillAssessmentModal
          open={assessmentModalOpen}
          onClose={() => setAssessmentModalOpen(false)}
          onSubmitAssessment={handleSubmitAssessment}
        />
      </Container>
    </Box>
  );
}
