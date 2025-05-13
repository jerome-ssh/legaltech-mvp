const { createClient } = require('@supabase/supabase-js');
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local in the root directory
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Use local Supabase configuration
const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
);

async function seedAnalyticsData() {
  try {
    // Seed case types
    const caseTypes = [
      { name: 'Document Review', description: 'Legal document review and analysis' },
      { name: 'Legal Research', description: 'In-depth legal research and analysis' },
      { name: 'Case Analysis', description: 'Comprehensive case analysis and strategy' },
      { name: 'Contract Review', description: 'Contract review and negotiation' },
      { name: 'Compliance Check', description: 'Regulatory compliance review' }
    ];

    const { error: caseTypesError } = await supabase
      .from('case_types')
      .upsert(caseTypes);

    if (caseTypesError) throw caseTypesError;

    // Seed cases with realistic data
    const cases = Array.from({ length: 20 }, (_, i) => ({
      title: `Case ${i + 1}`,
      case_type_id: caseTypes[i % caseTypes.length].id,
      status: ['active', 'closed', 'pending'][Math.floor(Math.random() * 3)],
      client_id: `client-${Math.floor(Math.random() * 5) + 1}`,
      assigned_to: `attorney-${Math.floor(Math.random() * 3) + 1}`,
      revenue: Math.floor(Math.random() * 50000) + 10000,
      expenses: Math.floor(Math.random() * 20000) + 5000,
      start_date: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000).toISOString(),
      end_date: Math.random() > 0.5 ? new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString() : null,
      outcome: ['successful', 'unsuccessful', null][Math.floor(Math.random() * 3)]
    }));

    const { error: casesError } = await supabase
      .from('cases')
      .upsert(cases);

    if (casesError) throw casesError;

    // Seed billing data
    const billing = cases.flatMap(case_ => {
      const bills = [];
      const startDate = new Date(case_.start_date);
      const endDate = case_.end_date ? new Date(case_.end_date) : new Date();
      const months = Math.ceil((endDate - startDate) / (30 * 24 * 60 * 60 * 1000));

      for (let i = 0; i < months; i++) {
        const amount = Math.floor(case_.revenue / months);
        const status = Math.random() > 0.3 ? 'paid' : 'pending';
        bills.push({
          case_id: case_.id,
          amount,
          status,
          due_date: new Date(startDate.getTime() + i * 30 * 24 * 60 * 60 * 1000).toISOString(),
          paid_date: status === 'paid' ? new Date(startDate.getTime() + i * 30 * 24 * 60 * 60 * 1000).toISOString() : null
        });
      }
      return bills;
    });

    const { error: billingError } = await supabase
      .from('billing')
      .upsert(billing);

    if (billingError) throw billingError;

    // Seed tasks
    const tasks = cases.flatMap(case_ => {
      const taskTypes = [
        { title: 'Initial Review', description: 'Review initial case documents' },
        { title: 'Client Meeting', description: 'Schedule and prepare for client meeting' },
        { title: 'Research', description: 'Conduct legal research' },
        { title: 'Document Drafting', description: 'Draft legal documents' },
        { title: 'Court Filing', description: 'Prepare and file court documents' }
      ];

      return taskTypes.map(type => ({
        case_id: case_.id,
        title: type.title,
        description: type.description,
        status: ['pending', 'in_progress', 'completed'][Math.floor(Math.random() * 3)],
        assigned_to: case_.assigned_to,
        due_date: new Date(Date.now() + Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
        is_recurring: Math.random() > 0.7,
        recurrence_pattern: Math.random() > 0.7 ? { frequency: 'weekly', interval: 1 } : null
      }));
    });

    const { error: tasksError } = await supabase
      .from('tasks')
      .upsert(tasks);

    if (tasksError) throw tasksError;

    // Seed client feedback
    const feedback = Array.from({ length: 50 }, () => ({
      rating: Math.floor(Math.random() * 5) + 1,
      count: Math.floor(Math.random() * 10) + 1
    }));

    const { error: feedbackError } = await supabase
      .from('client_feedback')
      .upsert(feedback);

    if (feedbackError) throw feedbackError;

    console.log('Successfully seeded analytics data');
  } catch (error) {
    console.error('Error seeding analytics data:', error);
    throw error;
  }
}

// Run the seed function
seedAnalyticsData()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Failed to seed analytics data:', error);
    process.exit(1);
  }); 