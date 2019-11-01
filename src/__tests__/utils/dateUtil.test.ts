import { string2Date, date2String } from '../../utils/dateUtil';

test('test date', () => {
  const date = string2Date('2019-10-31');
  console.log(date);
  const d = [date.clone().day(-1), date.clone().day(0), date.clone().day(1), date.clone().day(2), date.clone().day(3), date.clone().day(4), date.clone().day(5)];
  const dd1 = date.clone().day(-1);
  const dd2 = date.clone().day(0);
  console.log(d);
  // console.log(date2String(d.toDate()));
});
