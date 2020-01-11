import { getRandomString, md5 } from '../../utils/stringUtil';
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
  const password = bcrypt.hashSync('passw0rd', salt);
  console.log(password);
});

test('decode basse64', () => {
  const data = 'T87GAHG17TGAHG1TGHAHAHA1Y1CIOA9UGJH1GAHV871HAGAGQYQQPOOJMXNBCXBVNMNMAJAA';
  const text = Buffer.from(data, 'base64');
  console.log(text);
});

test('generate md5', () => {
  const hash = md5('some_string').toLowerCase();
  console.log(hash);
  expect(hash).toEqual('31ee76261d87fed8cb9d4c465c48158c');
});

// $2b$10$mgJHPrjoKC.EO5ZDWd8Q0OPqbeJFJa.v5qfZEFUQ2LzQ4oljLuHRy

// $2b$10$nCp3tbESxfPdaZ21KFtlNu.l4EsvW1bBu0D2/AwUT7r5tWSnNe2ye
