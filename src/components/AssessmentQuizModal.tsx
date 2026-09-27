import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, ChevronRight, ChevronLeft, ArrowRight, ExternalLink, Video } from 'lucide-react';
import {
  SPST_QUESTIONS,
  SPST_OPTIONS,
  TWO_Q_QUESTIONS,
  NINE_Q_QUESTIONS,
  NINE_Q_OPTIONS,
  EIGHT_Q_QUESTIONS,
  RQ_QUESTIONS,
  RQ_OPTIONS,
  THI_QUESTIONS,
  THI_OPTIONS,
  BURNOUT_QUESTIONS,
  BURNOUT_OPTIONS,
  EXTERNAL_ASSESSMENT_LINKS,
  IN_APP_VIDEOS
} from '../data/assessmentData';
import { MentalHealthResult } from '../types';

interface AssessmentQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  dimension: 'stress' | 'depression' | 'resilience' | 'happiness' | 'burnout';
  onSaveResult: (updated: Partial<MentalHealthResult>) => void;
  onOpenVideo: (video: typeof IN_APP_VIDEOS[0]) => void;
}

export const AssessmentQuizModal: React.FC<AssessmentQuizModalProps> = ({
  isOpen,
  onClose,
  dimension,
  onSaveResult,
  onOpenVideo
}) => {
  // Answers state for each dimension
  const [spstAnswers, setSpstAnswers] = useState<Record<number, number>>({});
  const [twoQAnswers, setTwoQAnswers] = useState<Record<number, boolean>>({});
  const [nineQAnswers, setNineQAnswers] = useState<Record<number, number>>({});
  const [eightQAnswers, setEightQAnswers] = useState<Record<number, boolean>>({});
  const [rqAnswers, setRqAnswers] = useState<Record<number, number>>({});
  const [thiAnswers, setThiAnswers] = useState<Record<number, number>>({});
  const [burnoutAnswers, setBurnoutAnswers] = useState<Record<number, number>>({});

  const [currentIndex, setCurrentIndex] = useState(0);

  if (!isOpen) return null;

  // SPST-20 Handler
  const handleCalculateStress = () => {
    let total = 0;
    SPST_QUESTIONS.forEach(q => {
      total += spstAnswers[q.id] || 1;
    });

    let level: 'เครียดน้อย' | 'เครียดปานกลาง' | 'เครียดสูง' | 'เครียดรุนแรง' = 'เครียดน้อย';
    let statusClass = 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200';
    if (total <= 23) {
      level = 'เครียดน้อย';
      statusClass = 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200';
    } else if (total <= 41) {
      level = 'เครียดปานกลาง';
      statusClass = 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200';
    } else if (total <= 61) {
      level = 'เครียดสูง';
      statusClass = 'text-orange-600 bg-orange-50 dark:bg-orange-950/40 border-orange-200';
    } else {
      level = 'เครียดรุนแรง';
      statusClass = 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-200';
    }

    onSaveResult({
      stress: {
        score: total,
        level,
        statusClass
      }
    });
    onClose();
  };

  // Depression (2Q / 9Q / 8Q) Handler
  const handleCalculateDepression = () => {
    const twoQPos = !!(twoQAnswers[1] || twoQAnswers[2]);
    let nineTotal = 0;
    NINE_QUESTIONS_LOOP: for (let i = 1; i <= 9; i++) {
      nineTotal += nineQAnswers[i] || 0;
    }

    let nineLevel: 'ปกติ' | 'เล็กน้อย' | 'ปานกลาง' | 'รุนแรง' = 'ปกติ';
    if (nineTotal < 7) nineLevel = 'ปกติ';
    else if (nineTotal <= 12) nineLevel = 'เล็กน้อย';
    else if (nineTotal <= 18) nineLevel = 'ปานกลาง';
    else nineLevel = 'รุนแรง';

    let eightTotal = 0;
    EIGHT_Q_QUESTIONS.forEach((q, idx) => {
      if (eightQAnswers[q.id]) {
        eightTotal += q.scoreWeight[1];
      }
    });

    let eightLevel: 'ไม่มีแนวโน้ม' | 'ระดับน้อย' | 'ระดับปานกลาง' | 'ระดับรุนแรง' = 'ไม่มีแนวโน้ม';
    if (eightTotal === 0) eightLevel = 'ไม่มีแนวโน้ม';
    else if (eightTotal <= 8) eightLevel = 'ระดับน้อย';
    else if (eightTotal <= 16) eightLevel = 'ระดับปานกลาง';
    else eightLevel = 'ระดับรุนแรง';

    const statusClass =
      nineLevel === 'รุนแรง' || eightLevel === 'ระดับรุนแรง'
        ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-200'
        : nineLevel === 'ปานกลาง'
        ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200'
        : 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200';

    onSaveResult({
      depression: {
        twoQPositive: twoQPos,
        nineQScore: nineTotal,
        nineQLevel: nineLevel,
        eightQScore: eightTotal,
        eightQLevel: eightLevel,
        summaryLevel: nineLevel,
        statusClass
      }
    });
    onClose();
  };

  // Resilience (RQ) Handler
  const handleCalculateRQ = () => {
    let total = 0;
    RQ_QUESTIONS.forEach(q => {
      total += rqAnswers[q.id] || 2;
    });

    let level: 'ต่ำกว่าปกติ' | 'ปกติ' | 'สูงกว่าปกติ' = 'ปกติ';
    let statusClass = 'text-sky-600 bg-sky-50 dark:bg-sky-950/40 border-sky-200';
    if (total >= 28) {
      level = 'สูงกว่าปกติ';
      statusClass = 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200';
    } else if (total >= 19) {
      level = 'ปกติ';
      statusClass = 'text-sky-600 bg-sky-50 dark:bg-sky-950/40 border-sky-200';
    } else {
      level = 'ต่ำกว่าปกติ';
      statusClass = 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200';
    }

    onSaveResult({
      resilience: {
        score: total,
        level,
        statusClass
      }
    });
    onClose();
  };

  // Happiness (THI-15) Handler
  const handleCalculateHappiness = () => {
    let total = 0;
    THI_QUESTIONS.forEach(q => {
      total += thiAnswers[q.id] || 1;
    });

    let level: 'ต่ำกว่าเกณฑ์' | 'ปานกลาง (ปกติ)' | 'ดีมาก' = 'ปานกลาง (ปกติ)';
    let statusClass = 'text-sky-600 bg-sky-50 dark:bg-sky-950/40 border-sky-200';
    if (total >= 33) {
      level = 'ดีมาก';
      statusClass = 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200';
    } else if (total >= 22) {
      level = 'ปานกลาง (ปกติ)';
      statusClass = 'text-sky-600 bg-sky-50 dark:bg-sky-950/40 border-sky-200';
    } else {
      level = 'ต่ำกว่าเกณฑ์';
      statusClass = 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200';
    }

    onSaveResult({
      happiness: {
        score: total,
        level,
        statusClass
      }
    });
    onClose();
  };

  // Academic Burnout Handler
  const handleCalculateBurnout = () => {
    let total = 0;
    BURNOUT_QUESTIONS.forEach(q => {
      total += burnoutAnswers[q.id] || 0;
    });

    let level: 'ระดับต่ำ (ดี)' | 'ระดับปานกลาง' | 'ระดับสูง (หมดไฟ)' = 'ระดับต่ำ (ดี)';
    let statusClass = 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200';
    if (total <= 15) {
      level = 'ระดับต่ำ (ดี)';
      statusClass = 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200';
    } else if (total <= 30) {
      level = 'ระดับปานกลาง';
      statusClass = 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200';
    } else {
      level = 'ระดับสูง (หมดไฟ)';
      statusClass = 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-200';
    }

    onSaveResult({
      burnout: {
        score: total,
        level,
        statusClass
      }
    });
    onClose();
  };

  // Related link & video for current dimension
  const currentLink = EXTERNAL_ASSESSMENT_LINKS.find(l => {
    if (dimension === 'stress') return l.category === 'ความเครียด';
    if (dimension === 'depression') return l.category === 'ซึมเศร้า';
    if (dimension === 'resilience') return l.category === 'พลังใจ';
    if (dimension === 'happiness') return l.category === 'ความสุข';
    if (dimension === 'burnout') return l.category === 'หมดไฟ';
    return false;
  });

  const currentVideo = IN_APP_VIDEOS[dimension === 'stress' ? 0 : dimension === 'depression' ? 1 : 2];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {dimension === 'stress' && 'แบบวัดความเครียดสวนปรุง (SPST-20)'}
                {dimension === 'depression' && 'แบบประเมินซึมเศร้า (2Q, 9Q, 8Q)'}
                {dimension === 'resilience' && 'แบบประเมินความเข้มแข็งทางใจ (RQ 9 ข้อ)'}
                {dimension === 'happiness' && 'ดัชนีชี้วัดความสุขคนไทย (THI-15)'}
                {dimension === 'burnout' && 'แบบประเมินหมดไฟในการเรียน (Burnout)'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ประเมินอาการและความรู้สึกในช่วง 2 สัปดาห์ที่ผ่านมา
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick resource buttons */}
          <div className="px-5 py-2.5 bg-sky-50/60 dark:bg-sky-950/30 border-b border-sky-100 dark:border-sky-900/40 flex items-center justify-between gap-2 text-xs">
            {currentLink && (
              <a
                href={currentLink.url}
                target="_blank"
                rel="noreferrer noopener"
                className="flex items-center gap-1.5 text-sky-700 dark:text-sky-300 hover:underline font-medium truncate max-w-[65%]"
              >
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{currentLink.name}</span>
              </a>
            )}
            <button
              onClick={() => onOpenVideo(currentVideo)}
              className="flex items-center gap-1 text-sky-600 dark:text-sky-400 hover:text-sky-800 font-medium shrink-0 ml-auto"
            >
              <Video className="w-3.5 h-3.5" />
              <span>ชมคลิปแนะนำในแอป</span>
            </button>
          </div>

          {/* Body Content based on dimension */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* 1. SPST-20 Stress */}
            {dimension === 'stress' && (
              <div className="space-y-5">
                <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 p-3 rounded-xl">
                  ให้คะแนนระดับความเครียดของท่านในแต่ละข้อ (1 = ไม่รู้สึกเครียด ถึง 5 = เครียดมากที่สุด)
                </div>
                {SPST_QUESTIONS.map(q => (
                  <div key={q.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {q.id}. {q.text}
                    </p>
                    <div className="grid grid-cols-5 gap-1.5">
                      {SPST_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setSpstAnswers(prev => ({ ...prev, [q.id]: opt.value }))}
                          className={`py-2 px-1 rounded-lg text-[11px] font-medium border text-center transition-all ${
                            spstAnswers[q.id] === opt.value
                              ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          {opt.value}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 2. Depression (2Q / 9Q) */}
            {dimension === 'depression' && (
              <div className="space-y-6">
                {/* 2Q Screening */}
                <div className="p-4 rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50/40 dark:bg-sky-950/20 space-y-3">
                  <h4 className="text-xs font-bold text-sky-900 dark:text-sky-200 uppercase tracking-wide">
                    ส่วนที่ 1: แบบคัดกรองเบื้องต้น 2Q
                  </h4>
                  {TWO_Q_QUESTIONS.map(q => (
                    <div key={q.id} className="space-y-2">
                      <p className="text-xs text-slate-800 dark:text-slate-200 font-medium">
                        {q.id}. {q.text}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setTwoQAnswers(prev => ({ ...prev, [q.id]: false }))}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-medium border ${
                            twoQAnswers[q.id] === false
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          ไม่มี
                        </button>
                        <button
                          onClick={() => setTwoQAnswers(prev => ({ ...prev, [q.id]: true }))}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-medium border ${
                            twoQAnswers[q.id] === true
                              ? 'bg-rose-500 text-white border-rose-500'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          มี
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 9Q Details */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                    ส่วนที่ 2: แบบประเมินโรคซึมเศร้า 9Q (อาการในรอบ 2 สัปดาห์)
                  </h4>
                  {NINE_Q_QUESTIONS.map(q => (
                    <div key={q.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                        {q.id}. {q.text}
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        {NINE_Q_OPTIONS.map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => setNineQAnswers(prev => ({ ...prev, [q.id]: opt.value }))}
                            className={`py-1.5 px-2 rounded-lg text-[11px] font-medium border text-center transition-all ${
                              nineQAnswers[q.id] === opt.value
                                ? 'bg-sky-600 text-white border-sky-600'
                                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. RQ Resilience */}
            {dimension === 'resilience' && (
              <div className="space-y-4">
                <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 p-3 rounded-xl">
                  ประเมินพลังใจและความเข้มแข็งในตนเอง (1 = ไม่จริง, 2 = จริงบางครั้ง, 3 = ค่อนข้างจริง, 4 = จริงมาก)
                </div>
                {RQ_QUESTIONS.map(q => (
                  <div key={q.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                        {q.id}. {q.text}
                      </p>
                      <span className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-950/40">
                        {q.subDimension}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {RQ_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setRqAnswers(prev => ({ ...prev, [q.id]: opt.value }))}
                          className={`py-1.5 px-1 rounded-lg text-[11px] font-medium border text-center transition-all ${
                            rqAnswers[q.id] === opt.value
                              ? 'bg-sky-600 text-white border-sky-600'
                              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 4. THI-15 Happiness */}
            {dimension === 'happiness' && (
              <div className="space-y-4">
                <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 p-3 rounded-xl">
                  ประเมินระดับความสุขและความพึงพอใจในชีวิตของท่าน (0 = ไม่เลย ถึง 3 = มากที่สุด)
                </div>
                {THI_QUESTIONS.map(q => (
                  <div key={q.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                      {q.id}. {q.text}
                    </p>
                    <div className="grid grid-cols-4 gap-1.5">
                      {THI_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setThiAnswers(prev => ({ ...prev, [q.id]: opt.value }))}
                          className={`py-1.5 px-1 rounded-lg text-[11px] font-medium border text-center transition-all ${
                            thiAnswers[q.id] === opt.value
                              ? 'bg-sky-600 text-white border-sky-600'
                              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 5. Burnout */}
            {dimension === 'burnout' && (
              <div className="space-y-4">
                <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 p-3 rounded-xl">
                  ประเมินความรู้สึกเหนื่อยล้าและหมดพลังในการเรียนและการฝึกปฏิบัติ (0 = ไม่เคยเลย ถึง 3 = เกิดขึ้นทุกวัน)
                </div>
                {BURNOUT_QUESTIONS.map(q => (
                  <div key={q.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                        {q.id}. {q.text}
                      </p>
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 shrink-0 ml-2">
                        {q.subDimension}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {BURNOUT_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setBurnoutAnswers(prev => ({ ...prev, [q.id]: opt.value }))}
                          className={`py-1.5 px-2 rounded-lg text-[11px] font-medium border text-center transition-all ${
                            burnoutAnswers[q.id] === opt.value
                              ? 'bg-sky-600 text-white border-sky-600'
                              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Save Button */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              * คำตอบจะถูกบันทึกเพื่อประเมินความเสี่ยงอัตโนมัติ
            </span>
            <button
              onClick={() => {
                if (dimension === 'stress') handleCalculateStress();
                else if (dimension === 'depression') handleCalculateDepression();
                else if (dimension === 'resilience') handleCalculateRQ();
                else if (dimension === 'happiness') handleCalculateHappiness();
                else if (dimension === 'burnout') handleCalculateBurnout();
              }}
              className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-md shadow-sky-600/20 active:scale-[0.98] transition-all"
            >
              บันทึกผลการประเมิน
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
