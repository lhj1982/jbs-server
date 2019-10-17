import { getRandomString } from '../../utils/stringUtil';

test('get random string, default length', () => {
  const random = getRandomString();
  expect(random.length).toBe(16);
});

test('get random string, fixed length', () => {
  const random = getRandomString(20);
  expect(random.length).toBe(20);
});
