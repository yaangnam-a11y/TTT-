export type Gender = 'ชาย' | 'หญิง' | 'LGBTQ+' | 'ไม่ระบุ';
export type AcademicYear = 'ปี 1' | 'ปี 2' | 'ปี 3' | 'ปี 4';

export interface PersonalInfo {
  gender: Gender | '';
  age: string;
  year: AcademicYear | '';
  gpa: string;
  hasChronicDisease: 'ไม่มี' | 'มี';
  chronicDiseaseDetail: string;
}

export interface QuizQuestion {
  id: number;
  category: 'พลังใจ' | 'ความสุข' | 'ซึมเศร้า' | 'หมดไฟ' | 'ความเครียด';
  question: string;
  options: [string, string, string, string];
  correctIndex: number; // 0=ก, 1=ข, 2=ค, 3=ง
  explanation: string;
}

export interface SPSTQuestion {
  id: number;
  text: string;
}

export interface TwoQQuestion {
  id: number;
  text: string;
}

export interface NineQQuestion {
  id: number;
  text: string;
}

export interface EightQQuestion {
  id: number;
  text: string;
  scoreWeight: number[];
}

export interface RQQuestion {
  id: number;
  text: string;
  subDimension: 'พลังฮึด' | 'พลังยืด' | 'พลังสู้';
}

export interface THIQuestion {
  id: number;
  text: string;
}

export interface BurnoutQuestion {
  id: number;
  text: string;
  subDimension: 'ความอ่อนล้าทางอารมณ์' | 'การลดความเป็นบุคคล' | 'การลดความสำเร็จส่วนบุคคล';
}

export interface MentalHealthResult {
  stress: {
    score: number;
    level: 'เครียดน้อย' | 'เครียดปานกลาง' | 'เครียดสูง' | 'เครียดรุนแรง';
    statusClass: string;
  };
  depression: {
    twoQPositive: boolean;
    nineQScore: number;
    nineQLevel: 'ปกติ' | 'เล็กน้อย' | 'ปานกลาง' | 'รุนแรง';
    eightQScore: number;
    eightQLevel: 'ไม่มีแนวโน้ม' | 'ระดับน้อย' | 'ระดับปานกลาง' | 'ระดับรุนแรง';
    summaryLevel: 'ปกติ' | 'เล็กน้อย' | 'ปานกลาง' | 'รุนแรง';
    statusClass: string;
  };
  resilience: {
    score: number;
    level: 'ต่ำกว่าปกติ' | 'ปกติ' | 'สูงกว่าปกติ';
    statusClass: string;
  };
  happiness: {
    score: number;
    level: 'ต่ำกว่าเกณฑ์' | 'ปานกลาง (ปกติ)' | 'ดีมาก';
    statusClass: string;
  };
  burnout: {
    score: number;
    level: 'ระดับต่ำ (ดี)' | 'ระดับปานกลาง' | 'ระดับสูง (หมดไฟ)';
    statusClass: string;
  };
  primaryRisk: string;
  primaryRiskDetail: string;
}

export interface SatisfactionSurvey {
  ratings: Record<number, number>; // 1-9 -> 1-5
  feedback: string;
  submittedAt?: string;
}
