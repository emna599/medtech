declare const MEDTECH_DEMO_IOS_API_URL: string;

export const environment = {
  apiUrl: typeof MEDTECH_DEMO_IOS_API_URL === 'string' ? MEDTECH_DEMO_IOS_API_URL : '',
};
