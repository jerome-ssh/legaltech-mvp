const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Load your JSON file
const templates = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'src/data/all_templates.json'), 'utf8')
);

// Your Supabase/Postgres connection string
const client = new Client({
  connectionString: 'postgresql://postgres.ueqzjuclosoedybixqgs:2u2JC6W1IxVqHtlE@aws-0-us-east-2.pooler.supabase.com:6543/postgres'
});

async function importTemplates() {
  await client.connect();

  for (const tpl of templates) {
    // Insert or get template
    const res = await client.query(
      `INSERT INTO matter_task_templates (matter_type_id, sub_type_id, template_name)
       VALUES ($1, $2, $3)
       ON CONFLICT (matter_type_id, sub_type_id) DO UPDATE SET template_name = EXCLUDED.template_name
       RETURNING id`,
      [tpl.matter_type_id, tpl.sub_type_id, `${tpl.matter_type_label} - ${tpl.sub_type_label}`]
    );
    const templateId = res.rows[0].id;

    // Remove existing items for this template (idempotency)
    await client.query('DELETE FROM matter_task_template_items WHERE template_id = $1', [templateId]);

    // Insert tasks
    for (let i = 0; i < tpl.tasks.length; i++) {
      const task = tpl.tasks[i];
      await client.query(
        `INSERT INTO matter_task_template_items (template_id, label, stage, default_weight, position)
         VALUES ($1, $2, $3, $4, $5)`,
        [templateId, task.label, task.stage, task.default_weight, i + 1]
      );
    }
  }

  await client.end();
  console.log('Templates imported!');
}

importTemplates().catch(err => {
  console.error('Error importing templates:', err);
  process.exit(1);
}); 