import * as Localization from 'expo-localization';
import i18n from 'i18n-js';
import en from './en';
import hi from './hi';

// Set up translations
i18n.translations = { en, hi };
i18n.fallbacks = true;
i18n.locale = Localization.locale || 'en';

export const t = (key) => i18n.t(key);
export const setLanguage = (lang) => { i18n.locale = lang; };
export const getLanguage = () => i18n.locale; 