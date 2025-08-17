import Constants from 'expo-constants';

export const API_CONFIG = {
  OPENAI_API_KEY: Constants.expoConfig?.extra?.openaiApiKey || '',
  OPENAI_BASE_URL: 'https://api.openai.com/v1'
};