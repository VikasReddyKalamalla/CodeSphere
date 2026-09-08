import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Curriculum } from '../components/Curriculum.jsx';
import { VisualRoadmapTree } from '../components/VisualRoadmapTree.jsx';
import { BackButton } from '@components/common/BackButton.jsx';
import { fetchCourseDetailsAPI, fetchPathProgressAPI, markLessonCompleteAPI, enrollAPI } from '../services/learningAPI.js';
import { Map, List, CheckCircle2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

import { NATIVE_ROADMAPS } from '../data/nativeRoadmapsData.js';

export const LearningDetails = () => {
  const params = useParams();
  const courseId = params.pathId || params.courseId;
  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('roadmap'); // 'roadmap' | 'list'
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    if (!courseId) return;
    setLoading(true);
    
    const cleanId = courseId.toLowerCase().trim();
    const nativeMatch = NATIVE_ROADMAPS.find(r => 
      r.id.toLowerCase() === cleanId || 
      (r._id && r._id.toString().toLowerCase() === cleanId) ||
      (r.slug && r.slug.toLowerCase() === cleanId) ||
      r.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').includes(cleanId)
    );
    
    Promise.allSettled([
      fetchCourseDetailsAPI(courseId),
      fetchPathProgressAPI(courseId)
    ]).then(([courseRes, progRes]) => {
      if (courseRes.status === 'fulfilled' && courseRes.value?.data) {
        setCourse(courseRes.value.data);
      } else if (nativeMatch) {
        setCourse(nativeMatch);
      }
      if (progRes.status === 'fulfilled' && progRes.value?.data) {
        setProgress(progRes.value.data);
      }
    }).catch(() => {
      if (nativeMatch) setCourse(nativeMatch);
    }).finally(() => {
      setLoading(false);
    });
  }, [courseId]);


  const handleMarkComplete = async (lessonId, unmark = false) => {
    try {
      const res = await markLessonCompleteAPI(lessonId, unmark, courseId);
      if (res?.data) setProgress(res.data);
      toast.success(unmark ? 'Lesson marked incomplete' : 'Lesson completed! ✓');
    } catch (err) {
      console.error('Lesson completion error:', err);
      const msg = err?.data?.message || err?.message || 'Could not update lesson progress';
      toast.error(msg);
    }
  };

  const handleEnroll = async () => {
    if (!courseId) return;
    setEnrolling(true);
    try {
      await enrollAPI(courseId);
      const prog = await fetchPathProgressAPI(courseId);
      if (prog?.data) setProgress(prog.data);
      toast.success(`Enrolled in ${course?.title || 'Learning Path'}! 🎉`);
    } catch {
      toast.error('Enrollment failed');
    }
    setEnrolling(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-500 font-mono text-xs select-none">
        <div className="w-8 h-8 rounded-full border-2 border-[#04AA6D] border-t-transparent animate-spin" />
        <p>Loading Dedicated Roadmap Canvas...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center py-20 gap-4 text-center select-none">
        <BackButton fallbackPath="/learning" />
        <p className="text-slate-400 font-mono text-xs">Learning Path not found or unavailable.</p>
      </div>
    );
  }

  const isEnrolled = !!progress;
  const completionPct = progress?.completionPercentage || 0;

  return (
    <div className="w-full flex flex-col gap-6 select-none animate-fade-in font-sans pb-16">
      
      {/* ── Top Navigation Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
        <Link 
          to="/learning" 
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-[#04AA6D] text-xs font-mono font-bold transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Paths</span>
        </Link>

        <div className="flex items-center gap-3">
          {!isEnrolled ? (
            <button
              onClick={handleEnroll}
              disabled={enrolling}
              className="px-4 py-2 rounded-xl bg-[#04AA6D] hover:bg-emerald-600 text-white font-mono font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              {enrolling ? 'Enrolling...' : 'Enroll in Path'}
            </button>
          ) : (
            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-[#04AA6D] border border-emerald-500/30 text-xs font-mono font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Enrolled ({completionPct}% Complete)</span>
            </span>
          )}

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('roadmap')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                viewMode === 'roadmap'
                  ? 'bg-[#04AA6D] text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              <span>Visual Roadmap</span>
            </button>

            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                viewMode === 'list'
                  ? 'bg-[#04AA6D] text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Module Syllabus</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Dedicated View Canvas ── */}
      {viewMode === 'roadmap' ? (
        <VisualRoadmapTree
          modules={course.modules || []}
          pathProgress={progress}
          onMarkLessonComplete={handleMarkComplete}
          pathTitle={course.title}
          category={course.category}
          trackId={course.id || course._id || courseId}
        />
      ) : (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <Curriculum modules={course.modules || []} courseId={courseId} />
        </div>
      )}
    </div>
  );
};


