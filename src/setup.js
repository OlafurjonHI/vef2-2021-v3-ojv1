import { fakeData } from './db.js';
import { createUser } from './users.js';

const setup = async () => {
  await fakeData(500);
  await createUser('admin', '123');
};

setup();
