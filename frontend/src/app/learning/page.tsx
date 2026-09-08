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
        setCourses(resCourses.value?.data ?? []);
      } else {
        setCourses([]);
      }

      if (resPaths.status === 'fulfilled') {
        setPaths(resPaths.value?.data ?? []);
      } else {
        setPaths([]);
      }

      if (resProgress.status === 'fulfilled') {
        setUserProgress(resProgress.value?.data ?? []);
      } else {
        setUserProgress([]);
      }

      if (resCerts.status === 'fulfilled') {
        setCertificates(resCerts.value?.certificates ?? []);
      } else {
        setCertificates([]);
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




  return (
    <Box sx={{ bgcolor: '#090d16', minHeight: '100dvh', color: '#f8fafc', py: 4 }}>
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
