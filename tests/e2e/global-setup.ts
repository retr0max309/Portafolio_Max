import { prepareTestDatabase } from '../../scripts/test-database';

export default async function globalSetup() {
  const pool = await prepareTestDatabase(true);
  await pool.end();
}
