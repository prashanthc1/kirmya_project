import React, { useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Button,
  Chip,
  Rating,
  Tabs,
  Tab,
  LinearProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Course, CourseCategory, UserLearningProgress } from '../types';

interface CourseGridProps {
  courses: Course[];
  userProgress: UserLearningProgress[];
  onEnrollCourse: (course: Course) => void;
  onUpdateLessonProgress: (courseId: string, completedLessons: number) => void;
}

export const CourseGrid: React.FC<CourseGridProps> = ({
  courses,
  userProgress,
  onEnrollCourse,
  onUpdateLessonProgress,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = [
    'All',
    'Technology',
    'Management',
    'Soft skills',
    'Interview preparation',
    'Industry certifications',
  ];

  const filteredCourses = courses.filter((c) => {
    if (selectedCategory === 'All') return true;
    return c.category === selectedCategory;
  });

  const getProviderBadge = (provider: string) => {
    switch (provider) {
      case 'coursera':
        return { label: 'Coursera', bg: '#0056D2', color: '#fff' };
      case 'udemy':
        return { label: 'Udemy', bg: '#A435F0', color: '#fff' };
      case 'pluralsight':
        return { label: 'Pluralsight', bg: '#F15B2A', color: '#fff' };
      default:
        return { label: 'Kirmya Native', bg: '#38bdf8', color: '#0f172a' };
    }
  };

  const getProgressForCourse = (courseId: string) => {
    return userProgress.find((p) => p.course_id === courseId);
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Category Tabs */}
      <Box sx={{ mb: 3, borderBottom: '1px solid #334155' }}>
        <Tabs
          value={selectedCategory}
          onChange={(_, val) => setSelectedCategory(val)}
          variant="scrollable"
          scrollButtons="auto"
          textColor="inherit"
          indicatorColor="primary"
          sx={{
            '& .MuiTabs-indicator': { bgcolor: '#38bdf8' },
            '& .MuiTab-root': { color: '#94a3b8', fontWeight: 'bold', textTransform: 'none' },
            '& .Mui-selected': { color: '#38bdf8' },
          }}
        >
          {categories.map((cat) => (
            <Tab key={cat} value={cat} label={cat} />
          ))}
        </Tabs>
      </Box>

      {/* Course Cards Grid */}
      <Grid container spacing={3}>
        {filteredCourses.map((course) => {
          const providerInfo = getProviderBadge(course.provider);
          const prog = getProgressForCourse(course.id);
          const isEnrolled = Boolean(prog);
          const isCompleted = prog?.status === 'completed';

          return (
            <Grid item xs={12} sm={6} md={4} key={course.id}>
              <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2.5, height: '100%', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-3px)' } }}>
                <Box sx={{ position: 'relative' }}>
                  <CardMedia
                    component="img"
                    height="140"
                    image={course.thumbnail_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500'}
                    alt={course.title}
                  />
                  <Chip
                    label={providerInfo.label}
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      bgcolor: providerInfo.bg,
                      color: providerInfo.color,
                      fontWeight: 'bold',
                      fontSize: '0.7rem',
                    }}
                  />
                  {isCompleted && (
                    <Chip
                      icon={<CheckCircleIcon sx={{ color: '#fff !important' }} />}
                      label="COMPLETED"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 12,
                        left: 12,
                        bgcolor: '#22c55e',
                        color: '#fff',
                        fontWeight: 'bold',
                        fontSize: '0.7rem',
                      }}
                    />
                  )}
                </Box>

                <CardContent sx={{ p: 2.5, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="caption" sx={{ color: '#38bdf8', fontWeight: 'bold' }}>
                      {course.category}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Rating value={course.rating} precision={0.1} readOnly size="small" />
                      <Typography variant="caption" sx={{ color: '#f59e0b', fontWeight: 'bold' }}>{course.rating}</Typography>
                    </Box>
                  </Box>

                  <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#f8fafc', mb: 1, lineHeight: 1.3 }}>
                    {course.title}
                  </Typography>

                  <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2, flexGrow: 1, fontSize: '0.85rem' }}>
                    {course.description}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 2, color: '#64748b', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <AccessTimeIcon fontSize="small" />
                      <Typography variant="caption">{course.duration_hours} Hours</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <MenuBookIcon fontSize="small" />
                      <Typography variant="caption">{course.total_lessons} Lessons</Typography>
                    </Box>
                  </Box>

                  {/* Skills Tags */}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                    {course.skills_covered?.slice(0, 3).map((skill, idx) => (
                      <Chip
                        key={idx}
                        label={skill}
                        size="small"
                        sx={{ bgcolor: '#0f172a', color: '#94a3b8', fontSize: '0.65rem', border: '1px solid #334155' }}
                      />
                    ))}
                  </Box>

                  {/* User Progress Bar if enrolled */}
                  {prog && (
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                          Progress ({prog.completed_lessons}/{prog.total_lessons} lessons)
                        </Typography>
                        <Typography variant="caption" fontWeight="bold" sx={{ color: '#38bdf8' }}>
                          {prog.completion_percentage}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={prog.completion_percentage}
                        sx={{ height: 6, borderRadius: 3, bgcolor: '#0f172a', '& .MuiLinearProgress-bar': { bgcolor: prog.completion_percentage === 100 ? '#22c55e' : '#38bdf8' } }}
                      />
                    </Box>
                  )}

                  {/* Action Buttons */}
                  {course.external_url ? (
                    <Button
                      variant="outlined"
                      fullWidth
                      href={course.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      endIcon={<OpenInNewIcon />}
                      sx={{ color: '#38bdf8', borderColor: '#38bdf8', fontWeight: 'bold' }}
                    >
                      View On {providerInfo.label}
                    </Button>
                  ) : !isEnrolled ? (
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => onEnrollCourse(course)}
                      startIcon={<PlayCircleOutlineIcon />}
                      sx={{ bgcolor: '#38bdf8', color: '#0f172a', fontWeight: 'bold', '&:hover': { bgcolor: '#0284c7' } }}
                    >
                      Enroll Free
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => onUpdateLessonProgress(course.id, Math.min(course.total_lessons, (prog?.completed_lessons || 0) + 1))}
                      sx={{ bgcolor: isCompleted ? '#22c55e' : '#38bdf8', color: isCompleted ? '#fff' : '#0f172a', fontWeight: 'bold' }}
                    >
                      {isCompleted ? 'Course Completed ✓' : 'Continue Next Lesson'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};
export default CourseGrid;
