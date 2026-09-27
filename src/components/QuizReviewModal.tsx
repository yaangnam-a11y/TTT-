import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import { QUIZ_QUESTIONS } from '../data/quizQuestions';

interface QuizReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  userAnswers: number[];
  title: string;
}

export const QuizReviewModal: React.FC<QuizReviewModalProps> = ({
  isOpen,
  onClose,
  userAnswers,
  title
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ทั้งหมด');

  if (!isOpen) return null;

  const categories = ['ทั้งหมด', 'พลังใจ', 'ความสุข', 'ซึมเศร้า', 'หมดไฟ', 'ความเครียด'];

  const filteredQuestions = selectedCategory === 'ทั้งหมด'
    ? QUIZ_QUESTIONS
    : QUIZ_QUESTIONS.filter(q => q.category === selectedCategory);

  const getChoiceLabel = (idx: number) => {
    switch (idx) {
      case 0: return 'ก';
      case 1: return 'ข';
      case 2: return 'ค';
      case 3: return 'ง';
      default: return '';
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                เฉลยละเอียด: {title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ตรวจสอบคำตอบและคำอธิบายทางวิชาการเพื่อเสริมสร้างความเข้าใจ
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 p-3 border-b border-slate-100 dark:border-slate-800/80 overflow-x-auto no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Scrollable Questions list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {filteredQuestions.map(q => {
              const userAns = userAnswers[q.id - 1];
              const isCorrect = userAns === q.correctIndex;
              const hasAnswered = userAns !== undefined && userAns !== -1;

              return (
                <div
                  key={q.id}
                  className={`p-4 rounded-xl border text-left space-y-3 transition-colors ${
                    isCorrect
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                      : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60'
                  }`}
                >
                  {/* Question header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 text-xs font-semibold flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0">
                        {q.id}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 font-medium">
                        {q.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-medium">
                      {isCorrect ? (
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>ตอบถูก (+1)</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                          <XCircle className="w-4 h-4" />
                          <span>ตอบผิด</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Question Title */}
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {q.question}
                  </h4>

                  {/* Choices */}
                  <div className="space-y-1.5 pt-1">
                    {q.options.map((opt, optIdx) => {
                      const isThisCorrect = optIdx === q.correctIndex;
                      const isThisUserChoice = optIdx === userAns;

                      let choiceClass = 'bg-white/80 dark:bg-slate-850/80 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300';
                      if (isThisCorrect) {
                        choiceClass = 'bg-emerald-100/70 dark:bg-emerald-900/40 border-emerald-400 dark:border-emerald-600 text-emerald-900 dark:text-emerald-200 font-medium';
                      } else if (isThisUserChoice && !isThisCorrect) {
                        choiceClass = 'bg-rose-100/70 dark:bg-rose-900/40 border-rose-400 dark:border-rose-600 text-rose-900 dark:text-rose-200';
                      }

                      return (
                        <div
                          key={optIdx}
                          className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-2 ${choiceClass}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{getChoiceLabel(optIdx)}.</span>
                            <span>{opt}</span>
                          </div>
                          <div className="shrink-0 flex items-center gap-1">
                            {isThisCorrect && (
                              <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-medium">
                                คำตอบที่ถูกต้อง
                              </span>
                            )}
                            {isThisUserChoice && !isThisCorrect && (
                              <span className="text-[10px] bg-rose-500 text-white px-1.5 py-0.5 rounded font-medium">
                                คำตอบของคุณ
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Scientific Explanation */}
                  <div className="bg-sky-50/80 dark:bg-sky-950/40 p-3 rounded-lg border border-sky-100 dark:border-sky-900/40 text-xs text-sky-900 dark:text-sky-200 space-y-1">
                    <div className="flex items-center gap-1 font-semibold text-sky-700 dark:text-sky-300">
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>คำอธิบาย / เหตุผลทางจิตวิทยา:</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-700 dark:text-slate-300">
                      {q.explanation}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-800 dark:bg-slate-700 text-white text-xs font-medium hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors"
            >
              ปิดหน้าต่างเฉลย
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
