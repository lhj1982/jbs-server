import * as moment from 'moment';

const nowDate = (convertToUTC = true) => {
  if (convertToUTC) {
    return moment(new Date()).utc();
  } else {
    return moment(new Date());
  }
};

const string2Date = (dateStr: string, convertToUTC = true, pattern = 'YYYY-MM-DD') => {
  if (convertToUTC) {
    return moment(dateStr, pattern).utc();
  } else {
    return moment(dateStr);
  }
};

const formatDate = (dateStr: string, convertToUTC = true) => {
  if (convertToUTC) {
    return moment(dateStr).utc();
  } else {
    return moment(dateStr);
  }
};

const date2String = (date: Date, pattern = 'YYYY-MM-DD HH:mm') => {
  return moment(date).format(pattern);
};

const addDays2 = (date: moment.Moment, daysToAdd: number) => {
  const clone = moment(date);
  return clone.add(daysToAdd, 'days');
};

const addDays = (fromDate: string, daysToAdd: number) => {
  return formatDate(fromDate).add(daysToAdd, 'days');
};

const add = (fromDate: string, unitsToAdd: number, unit: moment.unitOfTime.DurationConstructor = 'days') => {
  return formatDate(fromDate).add(unitsToAdd, unit);
};

const getDay = (dateStr: string) => {
  const date = moment(dateStr);
  const weekDay = date.day();
  if (weekDay == 0) {
    return 7;
  } else {
    return weekDay;
  }
};

const getTime = (dateStr: string) => {
  const date = moment(dateStr);
  return date.format('HH:mm');
};

const getDate = (dateStr: string) => {
  const date = moment(dateStr);
  return date.format('MM-DD');
};

export { string2Date, formatDate, addDays, addDays2, add, getDay, getTime, nowDate, date2String, getDate };
