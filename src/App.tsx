import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sun,
  Moon,
  Wifi,
  ChevronRight,
  ChevronLeft,
  Heart,
  Brain,
  Sparkles,
  BookOpen,
  ClipboardCheck,
  Smile,
  ShieldAlert,
  HelpCircle,
  Star,
  Activity,
  User as UserIcon,
  Home,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowRight,
  ExternalLink,
  Video,
  RotateCcw,
  PhoneCall,
  Share2,
  FileText,
  Send,
  Zap,
  LogIn,
  LogOut,
  History,
  CloudCheck,
  Calendar,
  GraduationCap,
  BarChart2,
  PlusCircle,
  Battery,
  Signal
} from 'lucide-react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';

import campusImage from './assets/images/siu_campus_backdrop_1790474985662.jpg';
import appLogo from './assets/images/siu_app_logo_1790475000929.jpg';
import avatarImage from './assets/images/student_nurse_avatar_1790475012184.jpg';

import { PersonalInfo, MentalHealthResult, SatisfactionSurvey } from './types';
import { QUIZ_QUESTIONS } from './data/quizQuestions';
import {
  SPST_QUESTIONS,
  EXTERNAL_ASSESSMENT_LINKS,
  IN_APP_VIDEOS
} from './data/assessmentData';
import { PSYCHOEDUCATION_DATA } from './data/psychoeducationData';
import { SATISFACTION_QUESTIONS, SATISFACTION_REFERENCE } from './data/satisfactionQuestions';
import { VideoModal } from './components/VideoModal';
import { QuizReviewModal } from './components/QuizReviewModal';
import { AssessmentQuizModal } from './components/AssessmentQuizModal';
import { HistoryModal } from './components/HistoryModal';
import {
  auth,
  loginWithGoogle,
  logoutUser,
  saveUserProfile,
  getUserProfile,
  saveMentalHealthRecord,
  getMentalHealthHistory,
  saveSatisfactionSurvey,
  StoredMentalRecord
} from './firebase';

type ScreenId =
  | 'splash'
  | 'instructions'
  | 'personal_info'
  | 'pretest'
  | 'assessment_dashboard'
  | 'assessment_summary'
  | 'psychoeducation'
  | 'posttest'
  | 'satisfaction'
  | 'profile';

export default function App() {
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('siu_theme') === 'dark';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('siu_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('siu_theme', 'light');
    }
  }, [isDarkMode]);

  // Online / Offline & Network Speed Detection
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [networkSpeedMbps, setNetworkSpeedMbps] = useState<number>(18.5);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [networkLabel, setNetworkLabel] = useState<string>('กำลังตรวจสอบความเร็วเครือข่าย...');

  // Firebase Auth State
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // Historical records from Firestore
  const [historyRecords, setHistoryRecords] = useState<StoredMentalRecord[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);

  // Monitor Auth Changes and load user profile & history from Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        setIsCloudSyncing(true);
        try {
          const remoteProfile = await getUserProfile(user.uid);
          if (remoteProfile) {
            setPersonalInfo(remoteProfile);
            localStorage.setItem('siu_personal_info', JSON.stringify(remoteProfile));
          }

          const records = await getMentalHealthHistory(user.uid);
          setHistoryRecords(records);
          setLastSyncTime(new Date().toLocaleTimeString('th-TH'));
        } catch (err) {
          console.error('Failed to sync data with Firestore:', err);
        } finally {
          setIsCloudSyncing(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const refreshHistory = async () => {
    if (!currentUser) return;
    setIsHistoryLoading(true);
    try {
      const records = await getMentalHealthHistory(currentUser.uid);
      setHistoryRecords(records);
    } catch (err) {
      console.error('Error refreshing history:', err);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const nav = navigator as unknown as { connection?: { downlink?: number; effectiveType?: string } };
    let estSpeed = 15;
    if (nav.connection?.downlink) {
      estSpeed = nav.connection.downlink;
    }
    setNetworkSpeedMbps(estSpeed);

    if (estSpeed >= 10) {
      setNetworkLabel(`5G/Wi-Fi (${estSpeed.toFixed(1)} Mbps)`);
    } else if (estSpeed >= 3) {
      setNetworkLabel(`4G (${estSpeed.toFixed(1)} Mbps)`);
    } else {
      setNetworkLabel(`3G/Standard (${estSpeed.toFixed(1)} Mbps)`);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Current screen
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('splash');
  const [navHistory, setNavHistory] = useState<ScreenId[]>([]);

  const navigateTo = (screen: ScreenId) => {
    setNavHistory(prev => [...prev, currentScreen]);
    setCurrentScreen(screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoBack = () => {
    if (navHistory.length > 0) {
      const prev = navHistory[navHistory.length - 1];
      setNavHistory(h => h.slice(0, h.length - 1));
      setCurrentScreen(prev);
    } else {
      if (currentScreen === 'instructions') setCurrentScreen('splash');
      else if (currentScreen === 'personal_info') setCurrentScreen('instructions');
      else if (currentScreen === 'pretest') setCurrentScreen('personal_info');
      else if (currentScreen === 'assessment_dashboard') setCurrentScreen('pretest');
      else if (currentScreen === 'assessment_summary') setCurrentScreen('assessment_dashboard');
      else if (currentScreen === 'psychoeducation') setCurrentScreen('assessment_summary');
      else if (currentScreen === 'posttest') setCurrentScreen('psychoeducation');
      else if (currentScreen === 'satisfaction') setCurrentScreen('posttest');
      else if (currentScreen === 'profile') setCurrentScreen('instructions');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Splash Loading Logic (Speed-based 2 to 5 seconds)
  useEffect(() => {
    if (currentScreen !== 'splash') return;

    const targetSeconds = Math.max(2.0, Math.min(4.5, 35 / (networkSpeedMbps || 10)));
    const intervalMs = 50;
    const stepIncrement = (100 / (targetSeconds * 1000)) * intervalMs;

    const timer = setInterval(() => {
      setLoadingProgress(prev => {
        const next = prev + stepIncrement;
        if (next >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            setCurrentScreen('instructions');
          }, 350);
          return 100;
        }
        return next;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [currentScreen, networkSpeedMbps]);

  // Screen 2 Consent Checkbox (Instructions)
  const [hasConsented, setHasConsented] = useState<boolean>(false);

  // Screen 2: ข้อมูลส่วนตัว (Personal Info)
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>(() => {
    const saved = localStorage.getItem('siu_personal_info');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return {
      gender: '',
      age: '',
      year: '',
      gpa: '',
      hasChronicDisease: 'ไม่มี',
      chronicDiseaseDetail: ''
    };
  });

  const handleUpdatePersonalInfo = async (field: keyof PersonalInfo, value: string) => {
    const updated = { ...personalInfo, [field]: value };
    setPersonalInfo(updated);
    localStorage.setItem('siu_personal_info', JSON.stringify(updated));

    if (currentUser) {
      try {
        await saveUserProfile(currentUser.uid, updated);
        setLastSyncTime(new Date().toLocaleTimeString('th-TH'));
      } catch (err) {
        console.error('Error syncing profile to Firestore:', err);
      }
    }
  };

  // Screen 3: แบบทดสอบ Pretest (20 ข้อ)
  const [preTestCurrentQuestion, setPreTestCurrentQuestion] = useState<number>(0);
  const [preTestAnswers, setPreTestAnswers] = useState<number[]>(() => {
    const saved = localStorage.getItem('siu_pretest_answers');
    return saved ? JSON.parse(saved) : Array(20).fill(-1);
  });
  const [isPreTestSubmitted, setIsPreTestSubmitted] = useState<boolean>(false);

  // Screen 7: แบบทดสอบ Post Test (20 ข้อ)
  const [postTestCurrentQuestion, setPostTestCurrentQuestion] = useState<number>(0);
  const [postTestAnswers, setPostTestAnswers] = useState<number[]>(() => {
    const saved = localStorage.getItem('siu_posttest_answers');
    return saved ? JSON.parse(saved) : Array(20).fill(-1);
  });
  const [isPostTestSubmitted, setIsPostTestSubmitted] = useState<boolean>(false);

  // Score Calculations
  const preTestScore = useMemo(() => {
    return preTestAnswers.reduce((acc, ans, idx) => {
      return ans === QUIZ_QUESTIONS[idx]?.correctIndex ? acc + 1 : acc;
    }, 0);
  }, [preTestAnswers]);

  const postTestScore = useMemo(() => {
    return postTestAnswers.reduce((acc, ans, idx) => {
      return ans === QUIZ_QUESTIONS[idx]?.correctIndex ? acc + 1 : acc;
    }, 0);
  }, [postTestAnswers]);

  // Screen 4 & 5: Mental Health Assessment State
  const [mentalHealthResult, setMentalHealthResult] = useState<MentalHealthResult>(() => {
    const saved = localStorage.getItem('siu_assessment_result');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return {
      stress: {
        score: 34,
        level: 'เครียดปานกลาง',
        statusClass: 'text-rose-500 bg-rose-50 dark:bg-rose-950/40 border-rose-200'
      },
      depression: {
        twoQPositive: true,
        nineQScore: 14,
        nineQLevel: 'ปานกลาง',
        eightQScore: 2,
        eightQLevel: 'ระดับน้อย',
        summaryLevel: 'ปานกลาง',
        statusClass: 'text-rose-500 bg-rose-50 dark:bg-rose-950/40 border-rose-200'
      },
      resilience: {
        score: 25,
        level: 'ดี',
        statusClass: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200'
      },
      happiness: {
        score: 26,
        level: 'ปานกลาง',
        statusClass: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200'
      },
      burnout: {
        score: 32,
        level: 'สูง',
        statusClass: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-200'
      },
      primaryRisk: 'คุณมีความเสี่ยงที่จะเป็น ซึมเศร้า ในระดับปานกลาง',
      primaryRiskDetail: 'ควรหาเวลาพักผ่อน ปรึกษาอาจารย์ที่ปรึกษา หรือสายด่วนสุขภาพจิต 1323'
    };
  });

  const handleSaveAssessmentResult = async (partial: Partial<MentalHealthResult>) => {
    const updated = { ...mentalHealthResult, ...partial };
    setMentalHealthResult(updated);
    localStorage.setItem('siu_assessment_result', JSON.stringify(updated));

    if (currentUser) {
      setIsCloudSyncing(true);
      try {
        await saveMentalHealthRecord(currentUser.uid, updated, preTestScore, postTestScore);
        const refreshed = await getMentalHealthHistory(currentUser.uid);
        setHistoryRecords(refreshed);
        setLastSyncTime(new Date().toLocaleTimeString('th-TH'));
      } catch (err) {
        console.error('Error saving record to Firestore:', err);
      } finally {
        setIsCloudSyncing(false);
      }
    }
  };

  // Screen 6: Psychoeducation Active SubTab (ความเสี่ยง | แนวทางสร้างเสริมสุขภาพ | คำแนะนำ)
  const [selectedSubTab, setSelectedSubTab] = useState<'risk' | 'healthPromotion' | 'advice'>('risk');

  // Screen 8: Satisfaction Survey State (10 Items)
  const [satisfactionSurvey, setSatisfactionSurvey] = useState<SatisfactionSurvey>(() => {
    const saved = localStorage.getItem('siu_satisfaction_survey');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return {
      ratings: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
      feedback: '',
      submittedAt: undefined
    };
  });
  const [isSatisfactionSubmitted, setIsSatisfactionSubmitted] = useState<boolean>(false);

  // Modals
  const [activeVideo, setActiveVideo] = useState<typeof IN_APP_VIDEOS[0] | null>(null);
  const [reviewModalState, setReviewModalState] = useState<{
    isOpen: boolean;
    answers: number[];
    title: string;
  }>({
    isOpen: false,
    answers: [],
    title: ''
  });

  const [assessmentModalState, setAssessmentModalState] = useState<{
    isOpen: boolean;
    dimension: 'stress' | 'depression' | 'resilience' | 'happiness' | 'burnout';
  }>({
    isOpen: false,
    dimension: 'stress'
  });

  // Google Login Handler
  const handleGoogleLogin = async () => {
    try {
      const user = await loginWithGoogle();
      if (user) {
        await saveUserProfile(user.uid, personalInfo);
      }
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setHistoryRecords([]);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col items-center justify-start transition-colors duration-200">
      {/* Mobile Frame (390px - 430px wide, identical to iPhone 15 / 16 frame shown in image.png) */}
      <div className="w-full max-w-[420px] min-h-screen bg-white dark:bg-slate-900 shadow-2xl relative flex flex-col overflow-hidden sm:my-3 sm:rounded-[36px] sm:border sm:border-slate-200/80 dark:sm:border-slate-800">
        
        {/* iOS-Style Top Status Bar matching image.png (9:41, Signal, Wifi, Battery) */}
        <div className="px-6 pt-3 pb-1 flex items-center justify-between text-xs font-semibold select-none z-50 text-slate-900 dark:text-slate-100">
          <span className="font-mono tracking-tight font-bold">9:41</span>
          <div className="flex items-center gap-2">
            <Signal className="w-3.5 h-3.5 fill-current" />
            <Wifi className="w-3.5 h-3.5" />
            <Battery className="w-4 h-4 fill-current" />
            {/* Quick dark mode & history toggles */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="ml-1 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              title="สลับโหมดมืด/สว่าง"
            >
              {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Top Header with Back button and centered title (Screens 2 - 8 in image.png) */}
        {currentScreen !== 'splash' && (
          <div className="px-4 py-2.5 flex items-center justify-between border-b border-slate-50 dark:border-slate-800/80 bg-white dark:bg-slate-900 relative">
            <button
              onClick={handleGoBack}
              className="p-1 -ml-1 text-slate-800 dark:text-slate-200 hover:text-sky-600 transition-colors"
              title="ย้อนกลับ"
            >
              <ChevronLeft className="w-6 h-6 stroke-[2.2]" />
            </button>

            <h1 className="text-base font-bold text-slate-900 dark:text-slate-100 font-heading tracking-tight absolute left-1/2 -translate-x-1/2">
              {currentScreen === 'instructions' && 'คำชี้แจงการใช้งาน'}
              {currentScreen === 'personal_info' && 'ข้อมูลส่วนตัว'}
              {currentScreen === 'pretest' && 'แบบทดสอบ Pretest'}
              {currentScreen === 'assessment_dashboard' && 'ประเมินสุขภาพจิต 5 ด้าน'}
              {currentScreen === 'assessment_summary' && 'สรุปผลการประเมิน'}
              {currentScreen === 'psychoeducation' && 'ความรู้และคำแนะนำ'}
              {currentScreen === 'posttest' && 'แบบทดสอบ Post Test'}
              {currentScreen === 'satisfaction' && 'ประเมินความพึงพอใจแอป'}
              {currentScreen === 'profile' && 'โปรไฟล์และกิจกรรม'}
            </h1>

            {/* Right side helper / history trigger */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsHistoryModalOpen(true)}
                className="p-1 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-slate-800 rounded-lg"
                title="ประวัติการประเมินย้อนหลัง (Firestore)"
              >
                <History className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Cloud Sync Status Indicator */}
        {currentUser && currentScreen !== 'splash' && (
          <div className="bg-sky-50/70 dark:bg-sky-950/40 px-4 py-1 text-[10px] text-sky-700 dark:text-sky-300 flex items-center justify-between border-b border-sky-100/60 dark:border-sky-900/40">
            <span className="truncate">ซิงค์ Cloud: {currentUser.email}</span>
            <span className="font-mono text-[9px] text-slate-400">
              {lastSyncTime ? `อัปเดต ${lastSyncTime}` : 'ออนไลน์'}
            </span>
          </div>
        )}

        {/* MAIN BODY CONTENT */}
        <main className="flex-1 flex flex-col relative pb-20">
          
          {/* ======================================================== */}
          {/* SCREEN 1: SPLASH SCREEN (ตรงตามภาพที่ 1)                  */}
          {/* ======================================================== */}
          {currentScreen === 'splash' && (
            <div className="flex-1 flex flex-col justify-between p-6 relative overflow-hidden min-h-[640px]">
              {/* Center Logo, App Name, Slogan */}
              <div className="flex flex-col items-center text-center pt-8 space-y-3 relative z-10">
                {/* Logo icon */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-400 to-cyan-300 p-0.5 shadow-md flex items-center justify-center">
                  <img
                    src={appLogo}
                    alt="SIU ดูแลใจ Logo"
                    className="w-full h-full rounded-2xl object-cover"
                  />
                </div>

                <div className="space-y-0.5">
                  <h1 className="text-4xl font-extrabold text-[#1E4E79] dark:text-sky-300 tracking-tight font-heading">
                    SIU
                  </h1>
                  <h2 className="text-3xl font-bold text-[#1E4E79] dark:text-sky-200 font-heading">
                    ดูแลใจ
                  </h2>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 font-light max-w-[240px] pt-1 leading-relaxed">
                  “เพราะสุขภาพจิตที่ดี<br />คือรากฐานของอนาคตที่สดใส”
                </p>
              </div>

              {/* University Campus Image in Center */}
              <div className="my-auto py-2 relative z-10 flex justify-center">
                <div className="w-full h-64 rounded-2xl overflow-hidden shadow-lg border border-slate-100 dark:border-slate-800 relative group">
                  <img
                    src={campusImage}
                    alt="Shinawatra University Campus"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-sky-900/20 via-transparent to-transparent" />
                </div>
              </div>

              {/* Bottom Loading Indicator & Button matching image.png */}
              <div className="space-y-3 relative z-10 pt-2 pb-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono px-1">
                    <span>เชื่อมต่อสัญญาณ {networkLabel}</span>
                    <span>{Math.round(loadingProgress)}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <motion.div
                      className="h-full bg-[#1F497D] dark:bg-sky-500 rounded-full"
                      style={{ width: `${loadingProgress}%` }}
                    />
                  </div>
                </div>

                {/* Main Blue Button: เริ่มใช้งาน > */}
                <button
                  onClick={() => navigateTo('instructions')}
                  className="w-full py-3.5 px-6 rounded-full bg-[#1F497D] hover:bg-[#183a63] text-white font-medium text-sm shadow-md hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                >
                  <span>เริ่มใช้งาน</span>
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* SCREEN 2: คำชี้แจง แอปพลิเคชัน “SIU ดูแลใจ”                 */}
          {/* ======================================================== */}
          {currentScreen === 'instructions' && (
            <div className="p-5 space-y-5">
              {/* Title Header */}
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-950/60 text-[#1F497D] dark:text-sky-400 mx-auto flex items-center justify-center shadow-sm mb-2">
                  <Heart className="w-6 h-6 text-[#1F497D] dark:text-sky-400" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  แอปพลิเคชัน “SIU ดูแลใจ”
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  คำแนะนำและขั้นตอนการเข้าร่วมประเมินสุขภาพจิต
                </p>
              </div>

              {/* 4 Sections Card */}
              <div className="space-y-4">
                {/* 1. คำนำ */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-100 dark:border-slate-800 shadow-sm space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-sky-100 dark:bg-sky-950/60 text-[#1F497D] dark:text-sky-400 text-xs font-bold flex items-center justify-center shrink-0">
                      1
                    </span>
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      คำนำ
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                    นักศึกษาพยาบาลต้องเผชิญกับภาระด้านการเรียน การสอบ การฝึกปฏิบัติ และความรับผิดชอบต่อผู้รับบริการ ซึ่งอาจส่งผลต่อสุขภาพจิตและนำไปสู่ความเครียด ซึมเศร้า และหมดไฟในการเรียน ขณะเดียวกัน ความสุขและพลังใจเป็นปัจจัยสำคัญที่ช่วยส่งเสริมการปรับตัวและการดูแลสุขภาพจิต
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans pt-1">
                    แอปพลิเคชัน <strong>“SIU ดูแลใจ”</strong> จัดทำขึ้นเพื่อส่งเสริม ป้องกัน และให้ความรู้ด้านสุขภาพจิตแก่นักศึกษาพยาบาล โดยครอบคลุมการประเมินสุขภาพจิต 5 ด้าน ได้แก่ ความเครียด ซึมเศร้า ความสุข พลังใจ และหมดไฟในการเรียน พร้อมรวบรวมความรู้และกิจกรรมการดูแลตนเอง เพื่อให้นักศึกษาสามารถเข้าใจสุขภาพจิตของตนเอง และนำความรู้ไปประยุกต์ใช้ในชีวิตประจำวันได้อย่างเหมาะสม
                  </p>
                </div>

                {/* 2. วัตถุประสงค์ */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-100 dark:border-slate-800 shadow-sm space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-sky-100 dark:bg-sky-950/60 text-[#1F497D] dark:text-sky-400 text-xs font-bold flex items-center justify-center shrink-0">
                      2
                    </span>
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      วัตถุประสงค์
                    </h3>
                  </div>
                  <ol className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-decimal pl-4 leading-relaxed font-sans">
                    <li>เพื่อศึกษาสุขภาพจิตของนักศึกษาพยาบาลใน 5 ด้าน ได้แก่ ความเครียด ซึมเศร้า ความสุข พลังใจ และหมดไฟในการเรียน</li>
                    <li>เพื่อส่งเสริมความรู้และการดูแลสุขภาพจิตของนักศึกษาพยาบาล</li>
                    <li>เพื่อศึกษาความพึงพอใจของนักศึกษาพยาบาลต่อแอปพลิเคชัน “SIU ดูแลใจ”</li>
                  </ol>
                </div>

                {/* 3. คำชี้แจง */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-100 dark:border-slate-800 shadow-sm space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-sky-100 dark:bg-sky-950/60 text-[#1F497D] dark:text-sky-400 text-xs font-bold flex items-center justify-center shrink-0">
                      3
                    </span>
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      คำชี้แจง
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                    กรุณาอ่านคำนำ วัตถุประสงค์ คำชี้แจง และขั้นตอนการใช้งานก่อนเริ่มทำแบบประเมิน ผู้ใช้งานควรตอบคำถามตามความรู้สึก ประสบการณ์ และพฤติกรรมของตนเองตามความเป็นจริง โดยไม่มีคำตอบที่ถูกหรือผิด
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-sans bg-amber-50/70 dark:bg-amber-950/30 p-2.5 rounded-xl border border-amber-200/50 dark:border-amber-800/40 text-[11px]">
                    ⚠️ ข้อมูลจากแบบประเมินใช้เพื่อประกอบการศึกษาและส่งเสริมการดูแลสุขภาพจิตของนักศึกษาพยาบาล ผู้ใช้งานควรใช้ผลการประเมินเป็นข้อมูลประกอบการดูแลตนเองเบื้องต้น และไม่ใช้แทนการวินิจฉัยจากบุคลากรทางการแพทย์หรือผู้เชี่ยวชาญด้านสุขภาพจิต
                  </p>
                </div>

                {/* 4. ขั้นตอนการใช้งาน (6 ไอคอน) */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-sky-100 dark:bg-sky-950/60 text-[#1F497D] dark:text-sky-400 text-xs font-bold flex items-center justify-center shrink-0">
                      4
                    </span>
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      ขั้นตอนการใช้งาน (6 ขั้นตอน)
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                        <UserIcon className="w-4 h-4 text-sky-600" />
                        <span>1. ข้อมูลส่วนบุคคล</span>
                      </div>
                      <p className="text-[11px] text-slate-500">กรอกข้อมูลเพื่อใช้ประกอบการศึกษาและวิเคราะห์ข้อมูล</p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                        <ClipboardCheck className="w-4 h-4 text-teal-600" />
                        <span>2. Pre-test</span>
                      </div>
                      <p className="text-[11px] text-slate-500">ทำแบบประเมินความรู้ 20 ข้อก่อนศึกษาคลังความรู้</p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                        <Brain className="w-4 h-4 text-indigo-600" />
                        <span>3. ประเมิน 5 ด้าน</span>
                      </div>
                      <p className="text-[11px] text-slate-500">ความเครียด, ซึมเศร้า, ความสุข, พลังใจ, หมดไฟ</p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                        <BookOpen className="w-4 h-4 text-amber-600" />
                        <span>4. คลังความรู้</span>
                      </div>
                      <p className="text-[11px] text-slate-500">ศึกษาเนื้อหาและแนวทางการดูแลสุขภาพจิต</p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                        <FileText className="w-4 h-4 text-emerald-600" />
                        <span>5. Post-test</span>
                      </div>
                      <p className="text-[11px] text-slate-500">ทดสอบหลังศึกษาคลังความรู้ เพื่อดูพัฒนาการ</p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span>6. ประเมินพึงพอใจ</span>
                      </div>
                      <p className="text-[11px] text-slate-500">ประเมินความพึงพอใจต่อแอป เพื่อนำไปพัฒนา</p>
                    </div>
                  </div>

                  {/* Flow preview */}
                  <div className="bg-sky-50/60 dark:bg-sky-950/30 p-2.5 rounded-xl border border-sky-100/60 dark:border-sky-900/40 text-[10px] text-sky-900 dark:text-sky-300 font-medium text-center">
                    ลำดับการใช้งาน: ข้อมูลส่วนบุคคล → Pre-test → ประเมินสุขภาพจิต 5 ด้าน → คลังความรู้ → Post-test → ประเมินความพึงพอใจ
                  </div>
                </div>

                {/* Consent Checkbox */}
                <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/50 flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="instructions-consent"
                    checked={hasConsented}
                    onChange={e => setHasConsented(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded text-[#1F497D] focus:ring-[#1F497D] cursor-pointer"
                  />
                  <label htmlFor="instructions-consent" className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed cursor-pointer font-sans">
                    ข้าพเจ้าได้อ่านและเข้าใจคำนำ วัตถุประสงค์ คำชี้แจง และขั้นตอนการใช้งานแล้ว และยินยอมเข้าร่วมการประเมินและใช้งานแอปพลิเคชัน <strong>“SIU ดูแลใจ”</strong>
                  </label>
                </div>
              </div>

              {/* Bottom Buttons: Left 'ย้อนกลับ' / Right 'ยินยอมและเริ่มใช้งาน >' */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={() => navigateTo('splash')}
                  className="flex-1 py-3 px-5 rounded-full border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  ย้อนกลับ
                </button>

                <button
                  disabled={!hasConsented}
                  onClick={() => navigateTo('personal_info')}
                  className={`flex-1 py-3 px-5 rounded-full text-white text-xs font-medium shadow-md transition-all flex items-center justify-center gap-1 ${
                    hasConsented
                      ? 'bg-[#1F497D] hover:bg-[#183a63] active:scale-[0.98]'
                      : 'bg-slate-400 cursor-not-allowed opacity-60'
                  }`}
                >
                  <span>ยินยอมและถัดไป</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* SCREEN 3: ข้อมูลส่วนตัว (ตรงตามภาพที่ 2 ในต้นแบบ)          */}
          {/* ======================================================== */}
          {currentScreen === 'personal_info' && (
            <div className="p-5 space-y-5">
              {/* Subtitle */}
              <div className="text-center space-y-3">
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[260px] mx-auto leading-relaxed">
                  กรุณากรอกข้อมูลของคุณให้ครบถ้วน<br />เพื่อให้ผลการประเมินแม่นยำยิ่งขึ้น
                </p>

                {/* Avatar with circular frame and green sprout/accent behind */}
                <div className="relative inline-block my-1">
                  <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-b from-sky-100 to-sky-200 dark:from-slate-800 dark:to-slate-700 shadow-sm mx-auto flex items-center justify-center">
                    <img
                      src={avatarImage}
                      alt="Student Nurse Avatar"
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* Form Input fields matching image.png exact layout */}
              <div className="space-y-3">
                {/* 1. เพศ */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    เพศ
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3 text-slate-400">
                      <span className="text-sm">🚻</span>
                    </div>
                    <select
                      value={personalInfo.gender}
                      onChange={e => handleUpdatePersonalInfo('gender', e.target.value)}
                      className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 appearance-none focus:outline-none focus:ring-1 focus:ring-[#1F497D]"
                    >
                      <option value="">เลือกเพศ</option>
                      <option value="ชาย">ชาย</option>
                      <option value="หญิง">หญิง</option>
                      <option value="LGBTQ+">LGBTQ+</option>
                      <option value="ไม่ระบุ">ไม่ระบุ</option>
                    </select>
                    <ChevronRight className="w-4 h-4 text-slate-400 absolute right-3 rotate-90 pointer-events-none" />
                  </div>
                </div>

                {/* 2. อายุ */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    อายุ
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3 text-slate-400">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <input
                      type="number"
                      placeholder="กรอกอายุ (ปี)"
                      value={personalInfo.age}
                      onChange={e => handleUpdatePersonalInfo('age', e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#1F497D]"
                    />
                  </div>
                </div>

                {/* 3. ชั้นปี (ใส่แค่ปี 1 - 4 เท่านั้น) */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    ชั้นปี
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3 text-slate-400">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <select
                      value={personalInfo.year}
                      onChange={e => handleUpdatePersonalInfo('year', e.target.value)}
                      className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 appearance-none focus:outline-none focus:ring-1 focus:ring-[#1F497D]"
                    >
                      <option value="">เลือกชั้นปี</option>
                      <option value="ปี 1">ปี 1</option>
                      <option value="ปี 2">ปี 2</option>
                      <option value="ปี 3">ปี 3</option>
                      <option value="ปี 4">ปี 4</option>
                    </select>
                    <ChevronRight className="w-4 h-4 text-slate-400 absolute right-3 rotate-90 pointer-events-none" />
                  </div>
                </div>

                {/* 4. เกรดเฉลี่ย (GPA) */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    เกรดเฉลี่ย (GPA)
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3 text-slate-400">
                      <BarChart2 className="w-4 h-4" />
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="กรอกเกรดเฉลี่ย (0.00 - 4.00)"
                      value={personalInfo.gpa}
                      onChange={e => handleUpdatePersonalInfo('gpa', e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#1F497D]"
                    />
                  </div>
                </div>

                {/* 5. โรคประจำตัว (เลือก มี หรือ ไม่มี) */}
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    โรคประจำตัว
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        handleUpdatePersonalInfo('hasChronicDisease', 'ไม่มี');
                        handleUpdatePersonalInfo('chronicDiseaseDetail', '');
                      }}
                      className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                        personalInfo.hasChronicDisease === 'ไม่มี'
                          ? 'border-[#1F497D] bg-sky-50 dark:bg-sky-950/40 text-[#1F497D] dark:text-sky-300 shadow-sm'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${personalInfo.hasChronicDisease === 'ไม่มี' ? 'border-[#1F497D]' : 'border-slate-300'}`}>
                        {personalInfo.hasChronicDisease === 'ไม่มี' && <div className="w-2 h-2 rounded-full bg-[#1F497D]" />}
                      </div>
                      <span>ไม่มีโรคประจำตัว</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleUpdatePersonalInfo('hasChronicDisease', 'มี')}
                      className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                        personalInfo.hasChronicDisease === 'มี'
                          ? 'border-[#1F497D] bg-sky-50 dark:bg-sky-950/40 text-[#1F497D] dark:text-sky-300 shadow-sm'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${personalInfo.hasChronicDisease === 'มี' ? 'border-[#1F497D]' : 'border-slate-300'}`}>
                        {personalInfo.hasChronicDisease === 'มี' && <div className="w-2 h-2 rounded-full bg-[#1F497D]" />}
                      </div>
                      <span>มีโรคประจำตัว</span>
                    </button>
                  </div>

                  {personalInfo.hasChronicDisease === 'มี' && (
                    <div className="relative flex items-center pt-1">
                      <div className="absolute left-3 text-slate-400">
                        <PlusCircle className="w-4 h-4 text-sky-600" />
                      </div>
                      <input
                        type="text"
                        placeholder="กรุณาระบุชื่อโรคประจำตัวของคุณ"
                        value={personalInfo.chronicDiseaseDetail}
                        onChange={e => handleUpdatePersonalInfo('chronicDiseaseDetail', e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#1F497D]"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Buttons: Left 'ย้อนกลับ' / Right 'ถัดไป >' */}
              <div className="pt-4 flex items-center gap-3">
                <button
                  onClick={() => navigateTo('instructions')}
                  className="flex-1 py-3.5 px-6 rounded-full border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  ย้อนกลับ
                </button>

                <button
                  onClick={() => navigateTo('pretest')}
                  className="flex-1 py-3.5 px-6 rounded-full bg-[#1F497D] hover:bg-[#183a63] text-white font-medium text-xs shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-1"
                >
                  <span>ถัดไป</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* SCREEN 3: แบบทดสอบ Pretest (ตรงตามภาพที่ 3 ในต้นแบบ)        */}
          {/* ======================================================== */}
          {currentScreen === 'pretest' && (
            <div className="p-5 flex-1 flex flex-col justify-between">
              {!isPreTestSubmitted ? (
                <div className="space-y-6">
                  {/* Subtitle */}
                  <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                    แบบประเมินความรู้ความเข้าใจเกี่ยวกับสุขภาพจิต (มีทั้งหมด 20 ข้อ)
                  </p>

                  {/* Progress bar + Right Indicator (ข้อที่ 1 / 20) */}
                  <div className="space-y-2">
                    <div className="flex justify-end text-xs text-slate-500 font-mono">
                      <span>ข้อที่ {preTestCurrentQuestion + 1} / {QUIZ_QUESTIONS.length}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <motion.div
                        className="h-full bg-[#1F497D] rounded-full"
                        style={{ width: `${((preTestCurrentQuestion + 1) / QUIZ_QUESTIONS.length) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Question Title */}
                  <div className="space-y-4 pt-1">
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
                      {preTestCurrentQuestion + 1}. {QUIZ_QUESTIONS[preTestCurrentQuestion].question}
                    </h2>

                    {/* Radio Options matching image.png (clean circular radio outline) */}
                    <div className="space-y-3 pt-1">
                      {QUIZ_QUESTIONS[preTestCurrentQuestion].options.map((opt, optIdx) => {
                        const isSelected = preTestAnswers[preTestCurrentQuestion] === optIdx;

                        return (
                          <button
                            key={optIdx}
                            onClick={() => {
                              const updated = [...preTestAnswers];
                              updated[preTestCurrentQuestion] = optIdx;
                              setPreTestAnswers(updated);
                              localStorage.setItem('siu_pretest_answers', JSON.stringify(updated));
                            }}
                            className="w-full flex items-center gap-3 text-left py-1 text-xs text-slate-700 dark:text-slate-300 group"
                          >
                            {/* Circle radio */}
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                                isSelected
                                  ? 'border-[#1F497D] bg-white'
                                  : 'border-slate-300 dark:border-slate-600 group-hover:border-slate-400'
                              }`}
                            >
                              {isSelected && (
                                <div className="w-2.5 h-2.5 rounded-full bg-[#1F497D]" />
                              )}
                            </div>
                            <span className="leading-relaxed">{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                /* Pre-test score summary */
                <div className="space-y-5 my-auto text-center py-6">
                  <div className="w-16 h-16 rounded-full bg-sky-50 dark:bg-sky-950/60 text-[#1F497D] dark:text-sky-400 flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      ส่งแบบทดสอบ Pretest เรียบร้อยแล้ว
                    </h3>
                    <p className="text-xs text-slate-500">
                      คะแนนที่คุณทำได้: <strong className="text-lg font-bold text-[#1F497D]">{preTestScore} / 20</strong> คะแนน
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setReviewModalState({
                        isOpen: true,
                        answers: preTestAnswers,
                        title: 'แบบทดสอบ Pretest'
                      });
                    }}
                    className="w-full py-2.5 px-4 rounded-full border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-50"
                  >
                    ดูเฉลยละเอียด
                  </button>
                </div>
              )}

              {/* Bottom Buttons: Left 'ย้อนกลับ' / Right 'ถัดไป >' matching image.png */}
              <div className="pt-6 flex items-center gap-3">
                <button
                  onClick={() => {
                    if (preTestCurrentQuestion > 0) {
                      setPreTestCurrentQuestion(q => q - 1);
                    } else {
                      handleGoBack();
                    }
                  }}
                  className="flex-1 py-3 px-5 rounded-full border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  ย้อนกลับ
                </button>

                {!isPreTestSubmitted ? (
                  preTestCurrentQuestion < QUIZ_QUESTIONS.length - 1 ? (
                    <button
                      onClick={() => setPreTestCurrentQuestion(q => q + 1)}
                      className="flex-1 py-3 px-5 rounded-full bg-[#1F497D] hover:bg-[#183a63] text-white text-xs font-medium shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-1"
                    >
                      <span>ถัดไป</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsPreTestSubmitted(true)}
                      className="flex-1 py-3 px-5 rounded-full bg-[#1F497D] hover:bg-[#183a63] text-white text-xs font-medium shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-1"
                    >
                      <span>ส่งแบบทดสอบ</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  )
                ) : (
                  <button
                    onClick={() => navigateTo('assessment_dashboard')}
                    className="flex-1 py-3 px-5 rounded-full bg-[#1F497D] hover:bg-[#183a63] text-white text-xs font-medium shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-1"
                  >
                    <span>ประเมิน 5 ด้าน</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* SCREEN 4: ประเมินสุขภาพจิต 5 ด้าน (ตรงตามภาพที่ 4)          */}
          {/* ======================================================== */}
          {currentScreen === 'assessment_dashboard' && (
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                {/* Subtitle */}
                <p className="text-center text-xs text-slate-500 dark:text-slate-400 max-w-[280px] mx-auto leading-relaxed">
                  กรุณาเลือกคำตอบที่ตรงกับความรู้สึกของคุณในช่วง 2 สัปดาห์ที่ผ่านมา
                </p>

                {/* 5 Cards matching image.png */}
                <div className="space-y-2.5">
                  {/* 1. ความเครียด (Red circle with down arrow) */}
                  <button
                    onClick={() => setAssessmentModalState({ isOpen: true, dimension: 'stress' })}
                    className="w-full p-3.5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between text-left hover:border-slate-200 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#E57373] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                        ↓
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          1. ความเครียด
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          รู้สึกเครียด วิตกกังวลบ่อยแค่ไหน
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  {/* 2. ซึมเศร้า (Purple circle with down arrow) */}
                  <button
                    onClick={() => setAssessmentModalState({ isOpen: true, dimension: 'depression' })}
                    className="w-full p-3.5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between text-left hover:border-slate-200 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#9575CD] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                        ↓
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          2. ซึมเศร้า
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          รู้สึกเศร้า ท้อแท้ เบื่อหน่ายแค่ไหน
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  {/* 3. พลังใจ (Yellow/amber circle with up arrow) */}
                  <button
                    onClick={() => setAssessmentModalState({ isOpen: true, dimension: 'resilience' })}
                    className="w-full p-3.5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between text-left hover:border-slate-200 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#FFB74D] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                        ↑
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          3. พลังใจ
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          มีแรงจูงใจในการใช้ชีวิตและการเรียนมากแค่ไหน
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  {/* 4. สร้างความสุข (Green circle with up arrow) */}
                  <button
                    onClick={() => setAssessmentModalState({ isOpen: true, dimension: 'happiness' })}
                    className="w-full p-3.5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between text-left hover:border-slate-200 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#81C784] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                        ↑
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          4. สร้างความสุข
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          รู้สึกมีความสุขในชีวิตมากแค่ไหน
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  {/* 5. หมดไฟในการเรียน (Blue circle with down arrow) */}
                  <button
                    onClick={() => setAssessmentModalState({ isOpen: true, dimension: 'burnout' })}
                    className="w-full p-3.5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between text-left hover:border-slate-200 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#64B5F6] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                        ↓
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          5. หมดไฟในการเรียน
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          รู้สึกเหนื่อยล้า หมดพลังในการเรียนแค่ไหน
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>

              {/* Bottom CTA: ดูผลประเมิน matching image.png */}
              <div className="pt-2">
                <button
                  onClick={() => navigateTo('assessment_summary')}
                  className="w-full py-3.5 px-6 rounded-full bg-[#1F497D] hover:bg-[#183a63] text-white font-medium text-sm shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-1"
                >
                  <span>ดูผลประเมิน</span>
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* SCREEN 5: สรุปผลการประเมิน (ตรงตามภาพที่ 5)                  */}
          {/* ======================================================== */}
          {currentScreen === 'assessment_summary' && (
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                {/* Avatar and statement matching image.png */}
                <div className="text-center space-y-2 pt-1">
                  <div className="relative inline-block">
                    <img
                      src={avatarImage}
                      alt="Student Nurse Avatar"
                      className="w-16 h-16 rounded-full mx-auto object-cover ring-2 ring-sky-200 dark:ring-sky-800"
                    />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    จากผลการประเมินของคุณ พบว่า...
                  </p>
                </div>

                {/* Pink Warning Box with '!' icon matching image.png */}
                <div className="bg-[#FFEBEE] dark:bg-rose-950/40 p-3.5 rounded-2xl border border-rose-100 dark:border-rose-900/40 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#E57373] text-white flex items-center justify-center font-bold text-lg shrink-0">
                    !
                  </div>
                  <div className="text-xs font-bold text-[#C62828] dark:text-rose-300 leading-snug">
                    คุณมีความเสี่ยงที่จะเป็น<br />
                    <span className="text-sm">ซึมเศร้า</span><br />
                    ในระดับปานกลาง
                  </div>
                </div>

                {/* Detail Table List matching image.png */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    รายละเอียดผลการประเมิน
                  </h3>

                  <div className="space-y-1.5 text-xs">
                    {/* row 1 */}
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-850 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <span className="text-rose-500 font-bold">↓</span>
                        ความเครียด
                      </span>
                      <span className="text-[11px] px-3 py-0.5 rounded-md bg-[#FFCDD2] text-[#B71C1C] font-medium">
                        ปานกลาง
                      </span>
                    </div>

                    {/* row 2 */}
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-850 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <span className="text-purple-500 font-bold">↓</span>
                        ซึมเศร้า
                      </span>
                      <span className="text-[11px] px-3 py-0.5 rounded-md bg-[#FFCDD2] text-[#B71C1C] font-medium">
                        ปานกลาง
                      </span>
                    </div>

                    {/* row 3 */}
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-850 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <span className="text-emerald-500 font-bold">↑</span>
                        พลังใจ
                      </span>
                      <span className="text-[11px] px-3 py-0.5 rounded-md bg-[#C8E6C9] text-[#1B5E20] font-medium">
                        ดี
                      </span>
                    </div>

                    {/* row 4 */}
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-850 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <span className="text-emerald-500 font-bold">↑</span>
                        สร้างความสุข
                      </span>
                      <span className="text-[11px] px-3 py-0.5 rounded-md bg-[#C8E6C9] text-[#1B5E20] font-medium">
                        ปานกลาง
                      </span>
                    </div>

                    {/* row 5 */}
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-850 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <span className="text-rose-500 font-bold">↓</span>
                        หมดไฟในการเรียน
                      </span>
                      <span className="text-[11px] px-3 py-0.5 rounded-md bg-[#FFCDD2] text-[#B71C1C] font-medium">
                        สูง
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Button matching image.png */}
              <div className="pt-2">
                <button
                  onClick={() => navigateTo('psychoeducation')}
                  className="w-full py-3.5 px-6 rounded-full bg-[#1F497D] hover:bg-[#183a63] text-white font-medium text-xs shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-1"
                >
                  <span>ดูคำแนะนำและแนวทางการดูแล</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* SCREEN 6: ความรู้และคำแนะนำ (ตรงตามภาพที่ 6)                */}
          {/* ======================================================== */}
          {currentScreen === 'psychoeducation' && (
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                {/* 3 Top Segmented Tabs: [ความเสี่ยง] [แนวทางสร้างเสริมสุขภาพ] [คำแนะนำ] */}
                <div className="flex p-1 rounded-full bg-slate-100 dark:bg-slate-800">
                  <button
                    onClick={() => setSelectedSubTab('risk')}
                    className={`flex-1 py-1.5 rounded-full text-xs font-medium transition-all ${
                      selectedSubTab === 'risk'
                        ? 'bg-[#1F497D] text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    ความเสี่ยง
                  </button>
                  <button
                    onClick={() => setSelectedSubTab('healthPromotion')}
                    className={`flex-1 py-1.5 rounded-full text-xs font-medium transition-all ${
                      selectedSubTab === 'healthPromotion'
                        ? 'bg-[#1F497D] text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    แนวทางสร้างเสริมสุขภาพ
                  </button>
                  <button
                    onClick={() => setSelectedSubTab('advice')}
                    className={`flex-1 py-1.5 rounded-full text-xs font-medium transition-all ${
                      selectedSubTab === 'advice'
                        ? 'bg-[#1F497D] text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    คำแนะนำ
                  </button>
                </div>

                {/* Content Card with brain icon matching image.png */}
                <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                  {/* Topic Title & Description */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#FFEBEE] text-rose-500 flex items-center justify-center shrink-0">
                      <Brain className="w-5 h-5 text-rose-500" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        ซึมเศร้า (Depression)
                      </h3>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed mt-1">
                        คือ อาการที่มีอารมณ์เศร้า หมดพลัง เบื่อหน่าย ไม่มีแรงจูงใจ ร่วมกับอาการทางกาย เช่น นอนหลับยาก เบื่ออาหาร สมาธิลดลง และอาจเสี่ยงต่อการทำร้ายตนเองได้
                      </p>
                    </div>
                  </div>

                  {/* Checklist matching image.png (green checkmarks) */}
                  <div className="space-y-2 pt-1">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      แนวทางสร้างเสริมสุขภาพ
                    </h4>
                    <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-100 shrink-0" />
                        <span>นอนหลับให้เพียงพอ 7–9 ชั่วโมง</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-100 shrink-0" />
                        <span>ออกกำลังกายสม่ำเสมอ</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-100 shrink-0" />
                        <span>จัดการความเครียด เช่น หายใจลึก ๆ ทำสมาธิ</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-100 shrink-0" />
                        <span>พูดคุยกับคนที่ไว้ใจ</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-100 shrink-0" />
                        <span>หลีกเลี่ยงการเปรียบเทียบตัวเองกับผู้อื่น</span>
                      </div>
                    </div>
                  </div>

                  {/* Pink Box with heart icon matching image.png */}
                  <div className="bg-[#FFEBEE] dark:bg-rose-950/40 p-3 rounded-xl border border-rose-100 dark:border-rose-900/40 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#C62828] dark:text-rose-300">
                      <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                      <span>คำแนะนำเพิ่มเติม</span>
                    </div>
                    <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
                      หากรู้สึกเศร้า นอนไม่หลับ หรือคิดทำร้ายตัวเอง ควรรีบปรึกษาผู้เชี่ยวชาญ เช่น อาจารย์ที่ปรึกษา หรือสายด่วนสุขภาพจิต 1323
                    </p>
                  </div>
                </div>
              </div>

              {/* Action to Post-test */}
              <div className="pt-2">
                <button
                  onClick={() => navigateTo('posttest')}
                  className="w-full py-3.5 px-6 rounded-full bg-[#1F497D] hover:bg-[#183a63] text-white font-medium text-xs shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-1"
                >
                  <span>ถัดไป: ทำแบบทดสอบ Post Test</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* SCREEN 7: แบบทดสอบ Post Test (ตรงตามภาพที่ 7 ในต้นแบบ)       */}
          {/* ======================================================== */}
          {currentScreen === 'posttest' && (
            <div className="p-5 flex-1 flex flex-col justify-between">
              {!isPostTestSubmitted ? (
                <div className="space-y-6">
                  {/* Subtitle */}
                  <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                    แบบประเมินความรู้ความเข้าใจเกี่ยวกับสุขภาพจิต (มีทั้งหมด 20 ข้อ)
                  </p>

                  {/* Progress bar + Right Indicator (ข้อที่ 1 / 20) */}
                  <div className="space-y-2">
                    <div className="flex justify-end text-xs text-slate-500 font-mono">
                      <span>ข้อที่ {postTestCurrentQuestion + 1} / {QUIZ_QUESTIONS.length}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <motion.div
                        className="h-full bg-[#1F497D] rounded-full"
                        style={{ width: `${((postTestCurrentQuestion + 1) / QUIZ_QUESTIONS.length) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Question Title matching image.png */}
                  <div className="space-y-4 pt-1">
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
                      {postTestCurrentQuestion + 1}. {QUIZ_QUESTIONS[postTestCurrentQuestion].question}
                    </h2>

                    {/* Radio Options matching image.png */}
                    <div className="space-y-3 pt-1">
                      {QUIZ_QUESTIONS[postTestCurrentQuestion].options.map((opt, optIdx) => {
                        const isSelected = postTestAnswers[postTestCurrentQuestion] === optIdx;

                        return (
                          <button
                            key={optIdx}
                            onClick={() => {
                              const updated = [...postTestAnswers];
                              updated[postTestCurrentQuestion] = optIdx;
                              setPostTestAnswers(updated);
                              localStorage.setItem('siu_posttest_answers', JSON.stringify(updated));
                            }}
                            className="w-full flex items-center gap-3 text-left py-1 text-xs text-slate-700 dark:text-slate-300 group"
                          >
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                                isSelected
                                  ? 'border-[#1F497D] bg-white'
                                  : 'border-slate-300 dark:border-slate-600 group-hover:border-slate-400'
                              }`}
                            >
                              {isSelected && (
                                <div className="w-2.5 h-2.5 rounded-full bg-[#1F497D]" />
                              )}
                            </div>
                            <span className="leading-relaxed">{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                /* Post-test score summary with Pre vs Post comparison */
                <div className="space-y-5 my-auto text-center py-6">
                  <div className="w-16 h-16 rounded-full bg-sky-50 dark:bg-sky-950/60 text-[#1F497D] dark:text-sky-400 flex items-center justify-center mx-auto shadow-inner">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      สรุปผลเปรียบเทียบ Pre vs Post Test
                    </h3>
                    <div className="flex items-center justify-center gap-4 text-xs pt-2">
                      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200">
                        <span>Pre-test:</span> <strong className="text-sm">{preTestScore}</strong> / 20
                      </div>
                      <div className="p-3 bg-sky-50 dark:bg-sky-950/50 rounded-xl border border-sky-200">
                        <span>Post-test:</span> <strong className="text-sm text-[#1F497D]">{postTestScore}</strong> / 20
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setReviewModalState({
                        isOpen: true,
                        answers: postTestAnswers,
                        title: 'แบบทดสอบ Post Test'
                      });
                    }}
                    className="w-full py-2.5 px-4 rounded-full border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-50"
                  >
                    ดูเฉลยละเอียด Post Test
                  </button>
                </div>
              )}

              {/* Bottom Buttons: Left 'ย้อนกลับ' / Right 'ถัดไป >' matching image.png */}
              <div className="pt-6 flex items-center gap-3">
                <button
                  onClick={() => {
                    if (postTestCurrentQuestion > 0) {
                      setPostTestCurrentQuestion(q => q - 1);
                    } else {
                      handleGoBack();
                    }
                  }}
                  className="flex-1 py-3 px-5 rounded-full border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  ย้อนกลับ
                </button>

                {!isPostTestSubmitted ? (
                  postTestCurrentQuestion < QUIZ_QUESTIONS.length - 1 ? (
                    <button
                      onClick={() => setPostTestCurrentQuestion(q => q + 1)}
                      className="flex-1 py-3 px-5 rounded-full bg-[#1F497D] hover:bg-[#183a63] text-white text-xs font-medium shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-1"
                    >
                      <span>ถัดไป</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsPostTestSubmitted(true)}
                      className="flex-1 py-3 px-5 rounded-full bg-[#1F497D] hover:bg-[#183a63] text-white text-xs font-medium shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-1"
                    >
                      <span>ส่งแบบทดสอบ</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  )
                ) : (
                  <button
                    onClick={() => navigateTo('satisfaction')}
                    className="flex-1 py-3 px-5 rounded-full bg-[#1F497D] hover:bg-[#183a63] text-white text-xs font-medium shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-1"
                  >
                    <span>ประเมินแอป</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* SCREEN 8: ประเมินความพึงพอใจแอป (ตรงตามภาพที่ 8)           */}
          {/* ======================================================== */}
          {currentScreen === 'satisfaction' && (
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                {/* Subtitle */}
                <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                  กรุณาให้คะแนนความพึงพอใจในการใช้งานแอป SIU ดูแลใจ
                </p>

                {/* 9 Rating items with star rating matching image.png */}
                <div className="space-y-3 pt-1">
                  {[
                    { id: 1, text: '1. ความง่ายในการใช้งาน' },
                    { id: 2, text: '2. ความเหมาะสมของเนื้อหา' },
                    { id: 3, text: '3. รูปแบบและดีไซน์ของแอป' },
                    { id: 4, text: '4. ความครบถ้วนของข้อมูล' },
                    { id: 5, text: '5. ความน่าเชื่อถือของข้อมูล' },
                    { id: 6, text: '6. ประโยชน์ที่ได้รับ' },
                    { id: 7, text: '7. ความสะดวกในการเข้าถึง' },
                    { id: 8, text: '8. ความพึงพอใจโดยรวม' },
                    { id: 9, text: '9. ความต้องการใช้งานต่อในอนาคต' }
                  ].map(item => {
                    const rating = satisfactionSurvey.ratings[item.id] || 0;

                    return (
                      <div key={item.id} className="flex items-center justify-between text-xs">
                        <span className="text-slate-800 dark:text-slate-200">
                          {item.text}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button
                              key={star}
                              onClick={() => {
                                setSatisfactionSurvey(prev => {
                                  const updated = {
                                    ...prev,
                                    ratings: { ...prev.ratings, [item.id]: star }
                                  };
                                  localStorage.setItem('siu_satisfaction_survey', JSON.stringify(updated));
                                  return updated;
                                });
                              }}
                              className="p-0.5"
                            >
                              <Star
                                className={`w-4 h-4 ${
                                  star <= rating
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-slate-300 dark:text-slate-600'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {/* 10. ข้อเสนอแนะเพิ่มเติม */}
                  <div className="space-y-1.5 pt-2">
                    <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      10. ข้อเสนอแนะเพิ่มเติม
                    </label>
                    <textarea
                      rows={2}
                      placeholder="กรุณาระบุข้อเสนอแนะ..."
                      value={satisfactionSurvey.feedback}
                      onChange={e => setSatisfactionSurvey(prev => ({ ...prev, feedback: e.target.value }))}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#1F497D]"
                    />
                  </div>
                </div>
              </div>

              {/* Bottom CTA: ส่งแบบประเมิน > */}
              <div className="pt-3">
                <button
                  onClick={async () => {
                    setIsSatisfactionSubmitted(true);
                    if (currentUser) {
                      await saveSatisfactionSurvey(currentUser.uid, satisfactionSurvey.ratings, satisfactionSurvey.feedback);
                    }
                    navigateTo('profile');
                  }}
                  className="w-full py-3.5 px-6 rounded-full bg-[#1F497D] hover:bg-[#183a63] text-white font-medium text-sm shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-1"
                >
                  <span>ส่งแบบประเมิน</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* SCREEN 9: โปรไฟล์ผู้ใช้งาน (เชื่อมโยงผ่าน Bottom Nav)       */}
          {/* ======================================================== */}
          {currentScreen === 'profile' && (
            <div className="p-5 space-y-5">
              {/* Profile Header Card */}
              <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-3">
                <img
                  src={avatarImage}
                  alt="Student Nurse Avatar"
                  className="w-14 h-14 rounded-full object-cover ring-2 ring-sky-200"
                />
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    นักศึกษาพยาบาล SIU
                  </h3>
                  <p className="text-xs text-slate-500">
                    {personalInfo.year || 'ปี 1'} · GPA: {personalInfo.gpa || '-'}
                  </p>
                  <p className="text-[10px] text-sky-600 dark:text-sky-400">
                    {currentUser ? `ซิงค์คลาวด์: ${currentUser.email}` : 'ยังไม่ได้เชื่อมต่อ Google'}
                  </p>
                </div>
                {currentUser ? (
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 hover:text-rose-600"
                    title="ออกจากระบบ"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleGoogleLogin}
                    className="px-3 py-1.5 rounded-xl bg-[#1F497D] text-white text-xs font-medium shadow"
                  >
                    เข้าสู่ระบบ
                  </button>
                )}
              </div>

              {/* History Button */}
              <button
                onClick={() => setIsHistoryModalOpen(true)}
                className="w-full p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/50 flex items-center justify-between text-xs text-sky-900 dark:text-sky-200 font-medium"
              >
                <div className="flex items-center gap-2.5">
                  <History className="w-4 h-4 text-sky-600" />
                  <span>ดูประวัติการประเมินย้อนหลัง (Firestore)</span>
                </div>
                <span className="font-mono font-bold bg-white dark:bg-slate-800 px-2.5 py-0.5 rounded-full text-[11px] text-[#1F497D] dark:text-sky-300">
                  {historyRecords.length} บันทึก
                </span>
              </button>

              {/* Student Personal Info Summary Card */}
              <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    ข้อมูลส่วนตัวนักศึกษา
                  </h4>
                  <button
                    onClick={() => setCurrentScreen('personal_info')}
                    className="text-[11px] text-[#1F497D] dark:text-sky-400 font-medium hover:underline"
                  >
                    แก้ไขข้อมูล
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800">
                    <span className="text-[10px] text-slate-400 block">เพศ</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{personalInfo.gender || '-'}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800">
                    <span className="text-[10px] text-slate-400 block">อายุ</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{personalInfo.age ? `${personalInfo.age} ปี` : '-'}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800">
                    <span className="text-[10px] text-slate-400 block">ชั้นปี</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{personalInfo.year || '-'}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800">
                    <span className="text-[10px] text-slate-400 block">เกรดเฉลี่ย (GPA)</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{personalInfo.gpa || '-'}</span>
                  </div>
                </div>

                {personalInfo.chronicDiseaseDetail && (
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs">
                    <span className="text-[10px] text-slate-400 block">โรคประจำตัว</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{personalInfo.chronicDiseaseDetail}</span>
                  </div>
                )}
              </div>

              {/* Quick Navigation to Screens */}
              <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-2">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                  ทางลัดการทำแบบประเมิน
                </h4>
                <button
                  onClick={() => setCurrentScreen('pretest')}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 transition-colors"
                >
                  <span>แบบทดสอบ Pre-test (20 ข้อ)</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
                <button
                  onClick={() => setCurrentScreen('posttest')}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 transition-colors"
                >
                  <span>แบบทดสอบ Post-test (20 ข้อ)</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
                <button
                  onClick={() => setCurrentScreen('satisfaction')}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 transition-colors"
                >
                  <span>แบบประเมินความพึงพอใจการใช้แอป</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {/* Hotline Support Banner */}
              <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3.5 rounded-2xl border border-emerald-100 dark:border-emerald-900/50 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                    สายด่วนสุขภาพจิต 1323
                  </h4>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                    โทรฟรีตลอด 24 ชั่วโมง หรือติดต่อห้องพยาบาล ม.ชินวัตร
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* ======================================================== */}
        {/* FIXED BOTTOM NAVIGATION BAR (ตรงตามภาพที่ 6 ในต้นแบบ)       */}
        {/* ======================================================== */}
        {currentScreen !== 'splash' && (
          <nav className="fixed bottom-0 left-0 right-0 max-w-[420px] mx-auto z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 px-4 py-2 flex items-center justify-between shadow-lg">
            {/* 1. หน้าแรก */}
            <button
              onClick={() => setCurrentScreen('personal_info')}
              className={`flex flex-col items-center justify-center py-1 px-3 transition-colors ${
                currentScreen === 'personal_info' || currentScreen === 'instructions'
                  ? 'text-[#1F497D] dark:text-sky-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Home className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">หน้าแรก</span>
            </button>

            {/* 2. แบบประเมิน */}
            <button
              onClick={() => setCurrentScreen('assessment_dashboard')}
              className={`flex flex-col items-center justify-center py-1 px-3 transition-colors ${
                currentScreen === 'assessment_dashboard' || currentScreen === 'assessment_summary' || currentScreen === 'pretest' || currentScreen === 'posttest'
                  ? 'text-[#1F497D] dark:text-sky-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <ClipboardCheck className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">แบบประเมิน</span>
            </button>

            {/* 3. ความรู้ */}
            <button
              onClick={() => setCurrentScreen('psychoeducation')}
              className={`flex flex-col items-center justify-center py-1 px-3 transition-colors ${
                currentScreen === 'psychoeducation'
                  ? 'text-[#1F497D] dark:text-sky-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <BookOpen className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">ความรู้</span>
            </button>

            {/* 4. โปรไฟล์ */}
            <button
              onClick={() => setCurrentScreen('profile')}
              className={`flex flex-col items-center justify-center py-1 px-3 transition-colors ${
                currentScreen === 'profile' || currentScreen === 'satisfaction'
                  ? 'text-[#1F497D] dark:text-sky-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <UserIcon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">โปรไฟล์</span>
            </button>
          </nav>
        )}

        {/* Video Player Modal */}
        <VideoModal
          isOpen={!!activeVideo}
          onClose={() => setActiveVideo(null)}
          video={activeVideo}
        />

        {/* Detailed Quiz Answer Key Review Modal */}
        <QuizReviewModal
          isOpen={reviewModalState.isOpen}
          onClose={() => setReviewModalState(prev => ({ ...prev, isOpen: false }))}
          userAnswers={reviewModalState.answers}
          title={reviewModalState.title}
        />

        {/* Interactive Questionnaire Modal for the 5 Mental Health Dimensions */}
        <AssessmentQuizModal
          isOpen={assessmentModalState.isOpen}
          onClose={() => setAssessmentModalState(prev => ({ ...prev, isOpen: false }))}
          dimension={assessmentModalState.dimension}
          onSaveResult={handleSaveAssessmentResult}
          onOpenVideo={(video) => setActiveVideo(video)}
        />

        {/* Historical Records Modal (Cloud Firestore) */}
        <HistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          records={historyRecords}
          isLoading={isHistoryLoading}
          onRefresh={refreshHistory}
          userEmail={currentUser?.email}
        />
      </div>
    </div>
  );
}
