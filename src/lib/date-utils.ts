import { toZonedTime, format } from 'date-fns-tz';

const TIME_ZONE = 'America/Sao_Paulo';

export const getSaoPauloTime = (date?: Date | string | number) => {
  const utcDate = date ? new Date(date) : new Date();
  return toZonedTime(utcDate, TIME_ZONE);
};

export const formatSaoPauloDate = (date: Date) => {
  return format(date, 'yyyy-MM-dd HH:mm:ssXXX', { timeZone: TIME_ZONE });
};
