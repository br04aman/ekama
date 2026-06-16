import dotenv from 'dotenv';
import path from 'path';

const envPathsToTry = [
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../../../.env'),
  path.resolve(process.cwd(), '../.env'),
  path.resolve(process.cwd(), '.env'),
];

for (const envPath of envPathsToTry) {
  const result = dotenv.config({ path: envPath });
  if (!result.error) break;
}
