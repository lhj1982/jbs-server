import { getRandomString } from '../../utils/stringUtil';
import * as bcrypt from 'bcrypt';

test('get random string, default length', () => {
  const random = getRandomString();
  expect(random.length).toBe(16);
});

test('get random string, fixed length', () => {
  const random = getRandomString(20);
  expect(random.length).toBe(20);
});

test('generate password', () => {
  const saltRounds = 10;
  const salt = bcrypt.genSaltSync(saltRounds);
  const password = bcrypt.hashSync('password', salt);
  console.log(password);
});

// $2b$10$mgJHPrjoKC.EO5ZDWd8Q0OPqbeJFJa.v5qfZEFUQ2LzQ4oljLuHRy

// $2b$10$nCp3tbESxfPdaZ21KFtlNu.l4EsvW1bBu0D2/AwUT7r5tWSnNe2ye