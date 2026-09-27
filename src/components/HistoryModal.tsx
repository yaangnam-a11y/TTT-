import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Activity, TrendingUp, History, CloudCheck, AlertCircle, RefreshCw } from 'lucide-react';
import { StoredMentalRecord } from '../firebase';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: StoredMentalRecord[];
  isLoading: boolean;
  onRefresh: () => void;
  userEmail?: string | null;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  records,
  isLoading,
  onRefresh,
  userEmail
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  ประวัติการประเมินสุขภาพจิต (Cloud Firestore)
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {userEmail ? `ซิงค์กับบัญชี: ${userEmail}` : 'ข้อมูลบันทึกลงคลาวด์อัตโนมัติ'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={onRefresh}
                disabled={isLoading}
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                title="รีเฟรชประวัติ"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-sky-600' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {isLoading ? (
              <div className="py-12 text-center space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin text-sky-600 mx-auto" />
                <p className="text-xs text-slate-500">กำลังดึงข้อมูลประวัติจาก Firestore...</p>
              </div>
            ) : records.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <Activity className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  ยังไม่มีประวัติการประเมินที่บันทึก
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                  เมื่อคุณทำแบบประเมินสุขภาพจิตและกดส่ง ระบบจะบันทึกผลและซิงค์ขึ้น Cloud Firestore ทันที
                </p>
              </div>
            ) : (
              records.map((rec, idx) => (
                <div
                  key={rec.recordId || idx}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/60 space-y-3 hover:border-sky-300 dark:hover:border-sky-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                      <Calendar className="w-3.5 h-3.5 text-sky-600" />
                      <span>{rec.dateFormatted || new Date(rec.createdAt).toLocaleDateString('th-TH')}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-medium">
                      บันทึก #{records.length - idx}
                    </span>
                  </div>

                  {/* 5 Dimensions Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-750">
                      <span className="text-slate-400 block text-[10px]">ความเครียด:</span>
                      <strong className="text-slate-800 dark:text-slate-200">{rec.stressLevel}</strong>
                      <span className="text-[10px] text-slate-400 ml-1">({rec.stressScore} คะแนน)</span>
                    </div>

                    <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-750">
                      <span className="text-slate-400 block text-[10px]">ซึมเศร้า:</span>
                      <strong className="text-slate-800 dark:text-slate-200">{rec.depressionSummary}</strong>
                    </div>

                    <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-750">
                      <span className="text-slate-400 block text-[10px]">พลังใจ (RQ):</span>
                      <strong className="text-emerald-600 dark:text-emerald-400">{rec.resilienceLevel}</strong>
                    </div>

                    <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-750">
                      <span className="text-slate-400 block text-[10px]">ความสุข (THI):</span>
                      <strong className="text-sky-600 dark:text-sky-400">{rec.happinessLevel}</strong>
                    </div>

                    <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-750">
                      <span className="text-slate-400 block text-[10px]">หมดไฟในการเรียน:</span>
                      <strong className="text-rose-600 dark:text-rose-400">{rec.burnoutLevel}</strong>
                    </div>

                    <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-750">
                      <span className="text-slate-400 block text-[10px]">Pre/Post-test:</span>
                      <strong className="text-slate-800 dark:text-slate-200">
                        {rec.preTestScore ?? '-'}/{rec.postTestScore ?? '-'} คะแนน
                      </strong>
                    </div>
                  </div>

                  {rec.primaryRisk && (
                    <div className="text-[11px] text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-200/60 dark:border-slate-800 flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span>{rec.primaryRisk}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {records.length} รายการที่บันทึก
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-800 dark:bg-slate-700 text-white text-xs font-medium hover:bg-slate-700 transition-colors"
            >
              ปิด
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
