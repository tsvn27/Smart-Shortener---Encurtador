import { nanoid } from 'nanoid';
import { connectDB, disconnectDB, User, Link } from './index.js';
import { hashPassword } from '../api/middleware/auth.js';

async function seed() {
  await connectDB();
  
  console.log('Seeding database...');
  
  const existingUser = await User.findOne({ email: 'demo@example.com' });
  if (existingUser) {
    console.log('Demo user already exists');
    await disconnectDB();
    return;
  }
  
  const userId = nanoid();
  const passwordHash = await hashPassword('demo123');
  
  await User.create({
    _id: userId,
    email: 'demo@example.com',
    passwordHash,
    name: 'Demo User',
  });
  
  console.log('Created demo user: demo@example.com / demo123');
  
  const links = [
    { url: 'https://google.com', code: 'google' },
    { url: 'https://github.com', code: 'github' },
    { url: 'https://youtube.com', code: 'youtube' },
  ];
  
  for (const link of links) {
    await Link.create({
      _id: nanoid(),
      shortCode: link.code,
      originalUrl: link.url,
      defaultTargetUrl: link.url,
      ownerId: userId,
    });
    console.log(`Created link: ${link.code} -> ${link.url}`);
  }
  
  console.log('Seed completed!');
  await disconnectDB();
}

seed().catch(console.error);
