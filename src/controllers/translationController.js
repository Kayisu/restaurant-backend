import { TranslationService } from "../services/translationService.js";


export const getTranslationSystemInfo = async (req, res, next) => {
  try {
    const systemInfo = TranslationService.getSystemInfo();
    
    res.json({
      success: true,
      message: "Translation system info retrieved successfully", 
      data: systemInfo
    });
  } catch (error) {
    console.error('Error getting translation system info:', error);
    next(error);
  }
};


export const getLanguageSettings = async (req, res, next) => {
  try {
    const { lang } = req.query;
    
    res.json({
      success: true,
      message: "Language settings retrieved successfully",
      data: {
        currentLanguage: lang || TranslationService.getDefaultLanguage(),
        defaultLanguage: TranslationService.getDefaultLanguage(),
        supportedLanguages: TranslationService.getSupportedLanguages(),
        systemInfo: TranslationService.getSystemInfo()
      }
    });
  } catch (error) {
    console.error('Error fetching language settings:', error);
    next(error);
  }
};


export const getLanguageTranslations = async (req, res, next) => {
  try {
    const { language } = req.params;
    
    if (!TranslationService.isValidLanguage(language)) {
      return res.status(400).json({
        success: false,
        message: `Unsupported language: ${language}`,
        data: {
          supportedLanguages: TranslationService.getSupportedLanguages()
        }
      });
    }

    const translations = TranslationService.getLanguageTranslations(language);
    
    if (!translations) {
      return res.status(404).json({
        success: false,
        message: `Translations not found for language: ${language}`
      });
    }

    res.json({
      success: true,
      message: `Translations retrieved for ${language}`,
      data: {
        language,
        translations
      }
    });
  } catch (error) {
    console.error('Error getting language translations:', error);
    next(error);
  }
};


export const reloadTranslations = async (req, res, next) => {
  try {
    const success = TranslationService.reloadTranslations();
    
    if (success) {
      res.json({
        success: true,
        message: "Translations reloaded successfully",
        data: {
          systemInfo: TranslationService.getSystemInfo()
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to reload translations"
      });
    }
  } catch (error) {
    console.error('Error reloading translations:', error);
    next(error);
  }
};


export const getTextByKey = async (req, res, next) => {
  try {
    const { keyPath } = req.params;
    const { lang = TranslationService.getDefaultLanguage() } = req.query;
    
    if (!TranslationService.isValidLanguage(lang)) {
      return res.status(400).json({
        success: false,
        message: `Unsupported language: ${lang}`
      });
    }

    const text = TranslationService.getText(keyPath, lang);
    
    res.json({
      success: true,
      message: "Text retrieved successfully",
      data: {
        keyPath,
        language: lang,
        text
      }
    });
  } catch (error) {
    console.error('Error getting text by key:', error);
    next(error);
  }
};
