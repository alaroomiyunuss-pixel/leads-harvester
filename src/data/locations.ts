export interface City {
  ar: string;
  en: string;
}

export interface Country {
  code: string;
  ar: string;
  en: string;
  flag: string;
  cities: City[];
}

export const COUNTRIES: Country[] = [
  {
    code: 'QA',
    ar: 'قطر',
    en: 'Qatar',
    flag: '🇶🇦',
    cities: [
      { ar: 'الدوحة', en: 'Doha' },
      { ar: 'الريان', en: 'Al Rayyan' },
      { ar: 'الوكرة', en: 'Al Wakrah' },
      { ar: 'الخور', en: 'Al Khor' },
      { ar: 'أم صلال', en: 'Umm Salal' },
      { ar: 'الشمال', en: 'Al Shamal' },
      { ar: 'الشحانية', en: 'Al Shahaniya' },
      { ar: 'الغريافة', en: 'Al Gharrafa' },
    ],
  },
  {
    code: 'SA',
    ar: 'السعودية',
    en: 'Saudi Arabia',
    flag: '🇸🇦',
    cities: [
      { ar: 'الرياض', en: 'Riyadh' },
      { ar: 'جدة', en: 'Jeddah' },
      { ar: 'مكة المكرمة', en: 'Mecca' },
      { ar: 'المدينة المنورة', en: 'Medina' },
      { ar: 'الدمام', en: 'Dammam' },
      { ar: 'الخبر', en: 'Khobar' },
      { ar: 'الطائف', en: 'Taif' },
      { ar: 'تبوك', en: 'Tabuk' },
      { ar: 'بريدة', en: 'Buraydah' },
      { ar: 'أبها', en: 'Abha' },
      { ar: 'حائل', en: 'Hail' },
      { ar: 'الجبيل', en: 'Jubail' },
      { ar: 'ينبع', en: 'Yanbu' },
      { ar: 'القطيف', en: 'Qatif' },
      { ar: 'نجران', en: 'Najran' },
    ],
  },
  {
    code: 'NL',
    ar: 'هولندا',
    en: 'Netherlands',
    flag: '🇳🇱',
    cities: [
      { ar: 'أمستردام', en: 'Amsterdam' },
      { ar: 'روتردام', en: 'Rotterdam' },
      { ar: 'لاهاي', en: 'The Hague' },
      { ar: 'أوتريخت', en: 'Utrecht' },
      { ar: 'أيندهوفن', en: 'Eindhoven' },
      { ar: 'تيلبورج', en: 'Tilburg' },
      { ar: 'غرونينغن', en: 'Groningen' },
      { ar: 'ألميري', en: 'Almere' },
      { ar: 'بريدا', en: 'Breda' },
      { ar: 'نيميخن', en: 'Nijmegen' },
    ],
  },
  {
    code: 'DE',
    ar: 'ألمانيا',
    en: 'Germany',
    flag: '🇩🇪',
    cities: [
      { ar: 'برلين', en: 'Berlin' },
      { ar: 'هامبورغ', en: 'Hamburg' },
      { ar: 'ميونيخ', en: 'Munich' },
      { ar: 'كولونيا', en: 'Cologne' },
      { ar: 'فرانكفورت', en: 'Frankfurt' },
      { ar: 'شتوتغارت', en: 'Stuttgart' },
      { ar: 'دوسلدورف', en: 'Düsseldorf' },
      { ar: 'دورتموند', en: 'Dortmund' },
      { ar: 'إيسن', en: 'Essen' },
      { ar: 'ليبزيغ', en: 'Leipzig' },
      { ar: 'هانوفر', en: 'Hannover' },
      { ar: 'نورمبرغ', en: 'Nuremberg' },
      { ar: 'بريمن', en: 'Bremen' },
      { ar: 'درسدن', en: 'Dresden' },
    ],
  },
  {
    code: 'AE',
    ar: 'الإمارات',
    en: 'UAE',
    flag: '🇦🇪',
    cities: [
      { ar: 'دبي', en: 'Dubai' },
      { ar: 'أبوظبي', en: 'Abu Dhabi' },
      { ar: 'الشارقة', en: 'Sharjah' },
      { ar: 'عجمان', en: 'Ajman' },
      { ar: 'رأس الخيمة', en: 'Ras Al Khaimah' },
      { ar: 'الفجيرة', en: 'Fujairah' },
      { ar: 'أم القيوين', en: 'Umm Al Quwain' },
      { ar: 'العين', en: 'Al Ain' },
      { ar: 'خورفكان', en: 'Khor Fakkan' },
      { ar: 'دبا الفجيرة', en: 'Dibba Al Fujairah' },
    ],
  },
];
