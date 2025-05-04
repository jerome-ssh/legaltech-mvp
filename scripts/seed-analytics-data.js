import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local in the root directory
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// If .env.local doesn't exist, try .env
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials. Please check your .env.local or .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seedData() {
  try {
    // Seed case types
    const caseTypes = [
      { name: 'Corporate Law', value: 25 },
      { name: 'Family Law', value: 20 },
      { name: 'Criminal Law', value: 15 },
      { name: 'Real Estate', value: 18 },
      { name: 'Intellectual Property', value: 12 },
      { name: 'Employment Law', value: 10 },
    ];

    const { error: caseTypesError } = await supabase
      .from('case_types')
      .upsert(caseTypes);

    if (caseTypesError) throw caseTypesError;

    // Seed cases
    const cases = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const statuses = ['Active', 'Closed', 'Pending', 'On Hold'];
    const caseTypeNames = caseTypes.map(type => type.name);

    for (let i = 0; i < 50; i++) {
      const month = months[Math.floor(Math.random() * months.length)];
      const year = 2024;
      const date = new Date(`${month} 1, ${year}`);
      
      cases.push({
        name: `Case ${i + 1}`,
        type: caseTypeNames[Math.floor(Math.random() * caseTypeNames.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        created_at: date.toISOString(),
        revenue: Math.floor(Math.random() * 50000) + 10000,
        expenses: Math.floor(Math.random() * 20000) + 5000,
      });
    }

    const { error: casesError } = await supabase
      .from('cases')
      .upsert(cases);

    if (casesError) throw casesError;

    // Seed billing data
    const billingData = months.map(month => ({
      month,
      paid: Math.floor(Math.random() * 100000) + 50000,
      outstanding: Math.floor(Math.random() * 50000) + 10000,
      date: new Date(`${month} 1, 2024`).toISOString(),
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