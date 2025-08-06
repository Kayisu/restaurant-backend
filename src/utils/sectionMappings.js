import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let translations = {};
let separateTranslations = {};

function loadSeparateTranslations() {
  const languages = ['tr', 'en'];
  const loadedTranslations = {};
  
  languages.forEach(lang => {
    try {
      const langPath = path.join(__dirname, `../../config/${lang}.json`);
      if (fs.existsSync(langPath)) {
        const langData = fs.readFileSync(langPath, 'utf8');
        loadedTranslations[lang] = JSON.parse(langData);
      }
    } catch (error) {
      console.error(`Failed to load ${lang}.json:`, error);
    }
  });
  
  return loadedTranslations;
}

// Ayrı dosyaları yükle
separateTranslations = loadSeparateTranslations();

// Eski birleşik dosyayı fallback olarak dene
try {
  const configPath = path.join(__dirname, '../../config/translations.json');
  if (fs.existsSync(configPath)) {
    const configData = fs.readFileSync(configPath, 'utf8');
    translations = JSON.parse(configData);
  }
} catch (error) {
  console.error('Translation config yüklenemedi:', error);
}

// Eğer ayrı dosyalar varsa onları kullan
if (Object.keys(separateTranslations).length > 0) {
  translations = {
    defaultLanguage: 'tr',
    supportedLanguages: Object.keys(separateTranslations),
    separateFiles: true,
    ...separateTranslations
  };
} else if (Object.keys(translations).length === 0) {
  // Fallback değerler
  translations = {
    defaultLanguage: 'en', 
    supportedLanguages: ['en', 'tr'],
    sections: {},
    statusMessages: {},
    tableStatuses: {}
  };
}

// Dil ayarlarını environment'dan al
const DEFAULT_LANGUAGE = process.env.DEFAULT_LANGUAGE || translations.defaultLanguage || 'tr';
const SUPPORTED_LANGUAGES = process.env.SUPPORTED_LANGUAGES?.split(',') || translations.supportedLanguages || ['tr', 'en'];

// Translation service
export class TranslationService {
  static getDefaultLanguage() {
    return DEFAULT_LANGUAGE;
  }

  static getSupportedLanguages() {
    return SUPPORTED_LANGUAGES;
  }

  static isValidLanguage(lang) {
    return SUPPORTED_LANGUAGES.includes(lang);
  }

  static getSectionInfo(sectionCode, language = DEFAULT_LANGUAGE) {
    const validLang = this.isValidLanguage(language) ? language : DEFAULT_LANGUAGE;
    
    // Ayrı dosya yapısını kontrol et
    if (translations.separateFiles && translations[validLang]) {
      const langData = translations[validLang];
      const section = langData.sections[sectionCode.toUpperCase()];
      
      if (section) {
        return {
          code: sectionCode.toUpperCase(),
          name: section.name,
          description: section.description
        };
      }
    }
    
    // Eski birleşik dosya yapısını dene
    const section = translations.sections && translations.sections[sectionCode.toUpperCase()];
    
    if (!section) {
      return { 
        name: 'Unknown', 
        description: '',
        code: sectionCode
      };
    }

    const langData = section[validLang] || section[DEFAULT_LANGUAGE] || section.en;
    
    return {
      code: sectionCode.toUpperCase(),
      name: langData.name,
      description: langData.description
    };
  }

  static getStatusText(status, language = DEFAULT_LANGUAGE) {
    const validLang = this.isValidLanguage(language) ? language : DEFAULT_LANGUAGE;
    
    // Ayrı dosya yapısını kontrol et
    if (translations.separateFiles && translations[validLang]) {
      const langData = translations[validLang];
      const statusText = langData.statusMessages && langData.statusMessages[status];
      if (statusText) return statusText;
    }
    
    // Eski birleşik dosya yapısını dene
    const statusData = translations.statusMessages && translations.statusMessages[status];
    
    if (!statusData) return status;
    
    return statusData[validLang] || statusData[DEFAULT_LANGUAGE] || statusData.en || status;
  }

  static getTableStatusText(status, language = DEFAULT_LANGUAGE) {
    const validLang = this.isValidLanguage(language) ? language : DEFAULT_LANGUAGE;
    
    // Ayrı dosya yapısını kontrol et
    if (translations.separateFiles && translations[validLang]) {
      const langData = translations[validLang];
      const statusText = langData.tableStatuses && langData.tableStatuses[status];
      if (statusText) return statusText;
    }
    
    // Eski birleşik dosya yapısını dene
    const statusData = translations.tableStatuses && translations.tableStatuses[status];
    
    if (!statusData) return status;
    
    return statusData[validLang] || statusData[DEFAULT_LANGUAGE] || statusData.en || status;
  }

  // Config dosyalarını runtime'da yeniden yükle
  static reloadTranslations() {
    try {
      // Önce ayrı dosyaları yükle
      const newSeparateTranslations = loadSeparateTranslations();
      
      if (Object.keys(newSeparateTranslations).length > 0) {
        separateTranslations = newSeparateTranslations;
        translations = {
          defaultLanguage: 'tr',
          supportedLanguages: Object.keys(newSeparateTranslations),
          separateFiles: true,
          ...newSeparateTranslations
        };
        console.log('Ayrı dil dosyaları yeniden yüklendi:', Object.keys(newSeparateTranslations));
        return true;
      }
      
      // Fallback: birleşik dosyayı dene
      const configPath = path.join(__dirname, '../../config/translations.json');
      if (fs.existsSync(configPath)) {
        const configData = fs.readFileSync(configPath, 'utf8');
        translations = JSON.parse(configData);
        console.log('Birleşik translation dosyası yeniden yüklendi');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Translation config yeniden yüklenemedi:', error);
      return false;
    }
  }

  // Mevcut translations'ı al
  static getAllTranslations() {
    return translations;
  }
  
  // Belirli bir dil için tüm çevirileri al
  static getLanguageTranslations(language = DEFAULT_LANGUAGE) {
    const validLang = this.isValidLanguage(language) ? language : DEFAULT_LANGUAGE;
    
    if (translations.separateFiles && translations[validLang]) {
      return translations[validLang];
    }
    
    return null;
  }
  
  // Çeviri sistemi hakkında bilgi
  static getTranslationSystemInfo() {
    return {
      separateFiles: translations.separateFiles || false,
      defaultLanguage: DEFAULT_LANGUAGE,
      supportedLanguages: SUPPORTED_LANGUAGES,
      availableTranslations: translations.separateFiles ? 
        Object.keys(translations).filter(key => !['defaultLanguage', 'supportedLanguages', 'separateFiles'].includes(key)) :
        []
    };
  }
}

// Status color mappings (dil bağımsız, UI elements removed)
export const STATUS_COLORS = {
  'full': { color: '#ff4757' },
  'busy': { color: '#ffa502' },
  'moderate': { color: '#26de81' },
  'quiet': { color: '#ddd' }
};

// Backward compatibility için eski fonksiyonları koru
export const getSectionInfo = (sectionCode, language) => {
  return TranslationService.getSectionInfo(sectionCode, language);
};

export const STATUS_MAPPINGS = {
  'full': { tr: 'Dolu', en: 'Full', color: '#ff4757' },
  'busy': { tr: 'Yoğun', en: 'Busy', color: '#ffa502' },
  'moderate': { tr: 'Orta', en: 'Moderate', color: '#26de81' },
  'quiet': { tr: 'Sakin', en: 'Quiet', color: '#ddd' }
};
