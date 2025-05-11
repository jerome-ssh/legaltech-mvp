import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local in the root directory
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Create Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Generate months for the last year
const months = Array.from({ length: 12 }, (_, i) => {
  const date = new Date();
  date.setMonth(date.getMonth() - i);
  return date.toLocaleString('default', { month: 'short' });
}).reverse();

async function seedData() {
  try {
    // Seed billing data
    const billingData = months.map(month => ({
      month,
      paid: Math.floor(Math.random() * 100000) + 50000,
      outstanding: Math.floor(Math.random() * 50000) + 10000,
      created_at: new Date(`${month} 1, 2024`).toISOString(),
      updated_at: new Date(`${month} 1, 2024`).toISOString()
    }));

    const { error: billingError } = await supabase
      .from('billing')
      .upsert(billingData);

    if (billingError) throw billingError;

    // Seed recurring tasks
    const tasks = [
      { name: 'Document Review', frequency: 15, is_recurring: true },
      { name: 'Client Meeting', frequency: 8, is_recurring: true },
      { name: 'Court Appearance', frequency: 5, is_recurring: true },
      { name: 'Research', frequency: 12, is_recurring: true },
      { name: 'Drafting', frequency: 10, is_recurring: true },
    ];

    const { error: tasksError } = await supabase
      .from('tasks')
      .upsert(tasks);

    if (tasksError) throw tasksError;

    // Seed client feedback
    const feedback = [
      { rating: 5, count: 20 },
      { rating: 4, count: 15 },
      { rating: 3, count: 5 },
      { rating: 2, count: 2 },
      { rating: 1, count: 1 },
    ];

    const { error: feedbackError } = await supabase
      .from('client_feedback')
      .upsert(feedback);

    if (feedbackError) throw feedbackError;

    console.log('Successfully seeded analytics data!');
  } catch (error) {
    console.error('Error seeding data:', error);
  }
}

seedData(); 