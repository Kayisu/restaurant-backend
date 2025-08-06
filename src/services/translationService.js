import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Restaurant Translation Service
 * Multi-language support with separate configuration files
 */
export class TranslationService {
  static #translations = {};
  static #separateTranslations = {};
  static #defaultLanguage = 'tr';
  static #supportedLanguages = ['tr', 'en'];

  static {
    this.#loadTranslations();
  }
  static #loadSeparateTranslations() {
    const languages = ['tr', 'en'];
    const loadedTranslations = {};
    
    languages.forEach(lang => {
      try {
        const langPath = path.join(__dirname, `../../config/${lang}.json`);
        if (fs.existsSync(langPath)) {
          const langData = fs.readFileSync(langPath, 'utf8');
          loadedTranslations[lang] = JSON.parse(langData);
          console.log(`✅ ${lang.toUpperCase()} translations loaded`);
        }
      } catch (error) {
        console.error(`❌ Failed to load ${lang}.json:`, error);
      }
    });
    
    return loadedTranslations;
  }

  /**
   * Load legacy combined translations file (fallback)
   */

  static #loadTranslations() {
    this.#separateTranslations = this.#loadSeparateTranslations();
    
    if (Object.keys(this.#separateTranslations).length > 0) {
      this.#translations = {
        defaultLanguage: 'tr',
        supportedLanguages: Object.keys(this.#separateTranslations),
        separateFiles: true,
        ...this.#separateTranslations
      };
      console.log('🔄 Using separate translation files:', Object.keys(this.#separateTranslations));
    } else if (Object.keys(combinedTranslations).length > 0) {
      this.#translations = combinedTranslations;
      console.log('🔄 Using combined translation file');
    } else {
      this.#translations = {
        defaultLanguage: 'en',
        supportedLanguages: ['en', 'tr'],
        sections: {},
        statusMessages: {},
        tableStatuses: {}
      };
      console.log('⚠️  Using fallback translation values');
    }

    this.#defaultLanguage = process.env.DEFAULT_LANGUAGE || this.#translations.defaultLanguage || 'tr';
    this.#supportedLanguages = process.env.SUPPORTED_LANGUAGES?.split(',') || this.#translations.supportedLanguages || ['tr', 'en'];
  }

  /**
   * Get default language
   */
  static getDefaultLanguage() {
    return this.#defaultLanguage;
  }

  /**
   * Get supported languages
   */
  static getSupportedLanguages() {
    return this.#supportedLanguages;
  }

  /**
   * Check if language is supported
   */
  static isValidLanguage(lang) {
    return this.#supportedLanguages.includes(lang);
  }

  static getSectionInfo(sectionCode, language = this.#defaultLanguage) {
    const validLang = this.isValidLanguage(language) ? language : this.#defaultLanguage;
    
    if (this.#translations.separateFiles && this.#translations[validLang]) {
      const langData = this.#translations[validLang];
      const section = langData.sections && langData.sections[sectionCode.toUpperCase()];
      
      if (section) {
        return {
          code: sectionCode.toUpperCase(),
          name: section.name,
          description: section.description
        };
      }
    }
    
    const section = this.#translations.sections && this.#translations.sections[sectionCode.toUpperCase()];
    
    if (!section) {
      return { 
        name: 'Unknown', 
        description: '',
        code: sectionCode
      };
    }

    const langData = section[validLang] || section[this.#defaultLanguage] || section.en;
    
    return {
      code: sectionCode.toUpperCase(),
      name: langData.name,
      description: langData.description
    };
  }

  static getStatusText(status, language = this.#defaultLanguage) {
    const validLang = this.isValidLanguage(language) ? language : this.#defaultLanguage;
    
    if (this.#translations.separateFiles && this.#translations[validLang]) {
      const langData = this.#translations[validLang];
      const statusText = langData.statusMessages && langData.statusMessages[status];
      if (statusText) return statusText;
    }
    
    const statusData = this.#translations.statusMessages && this.#translations.statusMessages[status];
    
    if (!statusData) return status;
    
    return statusData[validLang] || statusData[this.#defaultLanguage] || statusData.en || status;
  }

  static getTableStatusText(status, language = this.#defaultLanguage) {
    const validLang = this.isValidLanguage(language) ? language : this.#defaultLanguage;
    
    if (this.#translations.separateFiles && this.#translations[validLang]) {
      const langData = this.#translations[validLang];
      const statusText = langData.tableStatuses && langData.tableStatuses[status];
      if (statusText) return statusText;
    }
    
    const statusData = this.#translations.tableStatuses && this.#translations.tableStatuses[status];
    
    if (!statusData) return status;
    
    return statusData[validLang] || statusData[this.#defaultLanguage] || statusData.en || status;
  }

  static getText(keyPath, language = this.#defaultLanguage) {
    const validLang = this.isValidLanguage(language) ? language : this.#defaultLanguage;
    
    if (this.#translations.separateFiles && this.#translations[validLang]) {
      const langData = this.#translations[validLang];
      const keys = keyPath.split('.');
      let value = langData;
      
      for (const key of keys) {
        value = value && value[key];
        if (!value) break;
      }
      
      return value || keyPath;
    }
    
    return keyPath;
  }

  static reloadTranslations() {
    try {
      console.log('🔄 Reloading translations...');
      this.#loadTranslations();
      return true;
    } catch (error) {
      console.error('❌ Failed to reload translation config:', error);
      return false;
    }
  }

  static getAllTranslations() {
    return this.#translations;
  }
  
  static getLanguageTranslations(language = this.#defaultLanguage) {
    const validLang = this.isValidLanguage(language) ? language : this.#defaultLanguage;
    
    if (this.#translations.separateFiles && this.#translations[validLang]) {
      return this.#translations[validLang];
    }
    
    return null;
  }
  
  static getSystemInfo() {
    return {
      separateFiles: this.#translations.separateFiles || false,
      defaultLanguage: this.#defaultLanguage,
      supportedLanguages: this.#supportedLanguages,
      availableTranslations: this.#translations.separateFiles ? 
        Object.keys(this.#translations).filter(key => !['defaultLanguage', 'supportedLanguages', 'separateFiles'].includes(key)) :
        [],
      configFiles: this.#translations.separateFiles ? 
        this.#supportedLanguages.map(lang => `config/${lang}.json`) :
        ['config/translations.json'],
      lastReloaded: new Date().toISOString()
    };
  }
}

// Status color mappings (business logic only)
export const STATUS_COLORS = {
  'full': { color: '#ff4757' },
  'busy': { color: '#ffa502' },
  'moderate': { color: '#26de81' },
  'quiet': { color: '#ddd' }
};

export default TranslationService;
