import { LocalizedText, Muscle } from './types.js';

/** Display names for the muscles the catalogue references. */
export const MUSCLE_NAMES: Record<Muscle, LocalizedText> = {
  abdominals: { en: 'Abs', ar: 'عضلات البطن' },
  abductors: { en: 'Outer thighs', ar: 'الفخذ الخارجي' },
  adductors: { en: 'Inner thighs', ar: 'الفخذ الداخلي' },
  biceps: { en: 'Biceps', ar: 'البايسبس' },
  calves: { en: 'Calves', ar: 'السمانة' },
  chest: { en: 'Chest', ar: 'الصدر' },
  forearms: { en: 'Forearms', ar: 'الساعدان' },
  glutes: { en: 'Glutes', ar: 'الأرداف' },
  hamstrings: { en: 'Hamstrings', ar: 'أوتار الركبة' },
  lats: { en: 'Lats', ar: 'العضلة الظهرية' },
  'lower back': { en: 'Lower back', ar: 'أسفل الظهر' },
  'middle back': { en: 'Middle back', ar: 'منتصف الظهر' },
  neck: { en: 'Neck', ar: 'الرقبة' },
  quadriceps: { en: 'Quads', ar: 'عضلات الفخذ الأمامية' },
  shoulders: { en: 'Shoulders', ar: 'الأكتاف' },
  traps: { en: 'Traps', ar: 'عضلات الترابيس' },
  triceps: { en: 'Triceps', ar: 'الترايسبس' },
};
