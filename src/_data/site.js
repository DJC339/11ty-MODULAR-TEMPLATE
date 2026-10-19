import { siteConfig } from '../../lib/site-config.mjs';
export default () => ({
  title: 'Your business name',
  description: 'Replace this description with an accurate summary of your business and services.',
  language: 'en-CA', theme: 'light',
  year: new Date().getUTCFullYear(),
  email: '', telephone: '', image: '', imageAlt: '',
  // Add verified business details before enabling structured data.
  business: null,
  ...siteConfig(),
});
