import api from './api';
import i18n from '../i18n/config';

export async function generateMonthlyReport(year, month) {
  const lang = i18n.language?.startsWith('en') ? 'en' : 'es';
  const { data } = await api.post('/api/reports/monthly', { year, month, lang });
  return data;
}
