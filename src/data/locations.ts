export interface City {
  ar: string;
  en: string;
  lat: number;
  lng: number;
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
    code: 'QA', ar: 'قطر', en: 'Qatar', flag: '🇶🇦',
    cities: [
      { ar: 'الدوحة',     en: 'Doha',         lat: 25.2854, lng: 51.5310 },
      { ar: 'الريان',     en: 'Al Rayyan',     lat: 25.2921, lng: 51.4245 },
      { ar: 'الوكرة',     en: 'Al Wakrah',     lat: 25.1663, lng: 51.6003 },
      { ar: 'الخور',      en: 'Al Khor',       lat: 25.6841, lng: 51.4968 },
      { ar: 'أم صلال',   en: 'Umm Salal',     lat: 25.4025, lng: 51.4025 },
      { ar: 'الشمال',     en: 'Al Shamal',     lat: 26.0247, lng: 51.2069 },
      { ar: 'الشحانية',   en: 'Al Shahaniya',  lat: 25.3781, lng: 51.1926 },
      { ar: 'الغريافة',   en: 'Al Gharrafa',   lat: 25.3500, lng: 51.4833 },
    ],
  },
  {
    code: 'SA', ar: 'السعودية', en: 'Saudi Arabia', flag: '🇸🇦',
    cities: [
      { ar: 'الرياض',        en: 'Riyadh',    lat: 24.7136, lng: 46.6753 },
      { ar: 'جدة',           en: 'Jeddah',    lat: 21.5433, lng: 39.1728 },
      { ar: 'مكة المكرمة',  en: 'Mecca',     lat: 21.3891, lng: 39.8579 },
      { ar: 'المدينة المنورة', en: 'Medina',  lat: 24.5247, lng: 39.5692 },
      { ar: 'الدمام',        en: 'Dammam',    lat: 26.3927, lng: 49.9777 },
      { ar: 'الخبر',         en: 'Khobar',    lat: 26.2172, lng: 50.1971 },
      { ar: 'الطائف',        en: 'Taif',      lat: 21.2702, lng: 40.4157 },
      { ar: 'تبوك',          en: 'Tabuk',     lat: 28.3835, lng: 36.5662 },
      { ar: 'بريدة',         en: 'Buraydah',  lat: 26.3292, lng: 43.9747 },
      { ar: 'أبها',          en: 'Abha',      lat: 18.2164, lng: 42.5053 },
      { ar: 'حائل',          en: 'Hail',      lat: 27.5114, lng: 41.7208 },
      { ar: 'الجبيل',        en: 'Jubail',    lat: 27.0046, lng: 49.6580 },
      { ar: 'ينبع',          en: 'Yanbu',     lat: 24.0895, lng: 38.0618 },
      { ar: 'القطيف',        en: 'Qatif',     lat: 26.5085, lng: 50.0059 },
      { ar: 'نجران',         en: 'Najran',    lat: 17.5656, lng: 44.2289 },
    ],
  },
  {
    code: 'NL', ar: 'هولندا', en: 'Netherlands', flag: '🇳🇱',
    cities: [
      { ar: 'أمستردام',  en: 'Amsterdam',  lat: 52.3676, lng:  4.9041 },
      { ar: 'روتردام',   en: 'Rotterdam',  lat: 51.9225, lng:  4.4792 },
      { ar: 'لاهاي',     en: 'The Hague',  lat: 52.0705, lng:  4.3007 },
      { ar: 'أوتريخت',   en: 'Utrecht',    lat: 52.0907, lng:  5.1214 },
      { ar: 'أيندهوفن',  en: 'Eindhoven',  lat: 51.4416, lng:  5.4697 },
      { ar: 'تيلبورج',   en: 'Tilburg',    lat: 51.5555, lng:  5.0913 },
      { ar: 'غرونينغن',  en: 'Groningen',  lat: 53.2194, lng:  6.5665 },
      { ar: 'ألميري',    en: 'Almere',     lat: 52.3508, lng:  5.2647 },
      { ar: 'بريدا',     en: 'Breda',      lat: 51.5719, lng:  4.7683 },
      { ar: 'نيميخن',    en: 'Nijmegen',   lat: 51.8426, lng:  5.8546 },
    ],
  },
  {
    code: 'DE', ar: 'ألمانيا', en: 'Germany', flag: '🇩🇪',
    cities: [
      { ar: 'برلين',      en: 'Berlin',     lat: 52.5200, lng: 13.4050 },
      { ar: 'هامبورغ',    en: 'Hamburg',    lat: 53.5753, lng:  9.9952 },
      { ar: 'ميونيخ',     en: 'Munich',     lat: 48.1351, lng: 11.5820 },
      { ar: 'كولونيا',    en: 'Cologne',    lat: 50.9333, lng:  6.9500 },
      { ar: 'فرانكفورت',  en: 'Frankfurt',  lat: 50.1109, lng:  8.6821 },
      { ar: 'شتوتغارت',   en: 'Stuttgart',  lat: 48.7758, lng:  9.1829 },
      { ar: 'دوسلدورف',   en: 'Düsseldorf', lat: 51.2217, lng:  6.7762 },
      { ar: 'دورتموند',   en: 'Dortmund',   lat: 51.5136, lng:  7.4653 },
      { ar: 'إيسن',       en: 'Essen',      lat: 51.4508, lng:  7.0131 },
      { ar: 'ليبزيغ',     en: 'Leipzig',    lat: 51.3397, lng: 12.3731 },
      { ar: 'هانوفر',     en: 'Hannover',   lat: 52.3759, lng:  9.7320 },
      { ar: 'نورمبرغ',    en: 'Nuremberg',  lat: 49.4521, lng: 11.0767 },
      { ar: 'بريمن',      en: 'Bremen',     lat: 53.0793, lng:  8.8017 },
      { ar: 'درسدن',      en: 'Dresden',    lat: 51.0504, lng: 13.7373 },
    ],
  },
  {
    code: 'AE', ar: 'الإمارات', en: 'UAE', flag: '🇦🇪',
    cities: [
      { ar: 'دبي',          en: 'Dubai',              lat: 25.2048, lng: 55.2708 },
      { ar: 'أبوظبي',       en: 'Abu Dhabi',           lat: 24.4539, lng: 54.3773 },
      { ar: 'الشارقة',      en: 'Sharjah',             lat: 25.3463, lng: 55.4209 },
      { ar: 'عجمان',        en: 'Ajman',               lat: 25.4052, lng: 55.5136 },
      { ar: 'رأس الخيمة',   en: 'Ras Al Khaimah',      lat: 25.7895, lng: 55.9432 },
      { ar: 'الفجيرة',      en: 'Fujairah',            lat: 25.1288, lng: 56.3264 },
      { ar: 'أم القيوين',   en: 'Umm Al Quwain',       lat: 25.5647, lng: 55.5523 },
      { ar: 'العين',        en: 'Al Ain',              lat: 24.2075, lng: 55.7447 },
      { ar: 'خورفكان',      en: 'Khor Fakkan',         lat: 25.3411, lng: 56.3440 },
      { ar: 'دبا الفجيرة',  en: 'Dibba Al Fujairah',   lat: 25.5921, lng: 56.2635 },
    ],
  },
];
