const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Load your JSON file
const templates = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'src/data/update_templates.json'), 'utf8')
);

// Your Supabase/Postgres connection string
const client = new Client({
  connectionString: 'postgresql://postgres.ueqzjuclosoedybixqgs:2u2JC6W1IxVqHtlE@aws-0-us-east-2.pooler.supabase.com:6543/postgres'
});

async function importTemplates() {
  await client.connect();
  
  const results = {
    skipped: [],
    added: [],
    errors: []
  };

  for (const tpl of templates) {
    try {
      // Check if template exists
      const existingTemplate = await client.query(
        `SELECT id FROM matter_task_templates 
         WHERE matter_type_id = $1 AND sub_type_id = $2`,
        [tpl.matter_type_id, tpl.sub_type_id]
      );

      if (existingTemplate.rows.length > 0) {
        // Template exists, skip it
        results.skipped.push({
          matter_type_id: tpl.matter_type_id,
          matter_type_label: tpl.matter_type_label,
          sub_type_id: tpl.sub_type_id,
          sub_type_label: tpl.sub_type_label
        });
        continue;
      }

      // Insert new template
      const res = await client.query(
        `INSERT INTO matter_task_templates (matter_type_id, sub_type_id, template_name)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [tpl.matter_type_id, tpl.sub_type_id, `${tpl.matter_type_label} - ${tpl.sub_type_label}`]
      );
      const templateId = res.rows[0].id;

      // Insert tasks
      for (let i = 0; i < tpl.tasks.length; i++) {
        const task = tpl.tasks[i];
        await client.query(
          `INSERT INTO matter_task_template_items (template_id, label, stage, default_weight, position)
           VALUES ($1, $2, $3, $4, $5)`,
          [templateId, task.label, task.stage, task.default_weight, i + 1]
        );
      }

      results.added.push({
        matter_type_id: tpl.matter_type_id,
        matter_type_label: tpl.matter_type_label,
        sub_type_id: tpl.sub_type_id,
        sub_type_label: tpl.sub_type_label
      });

    } catch (error) {
      results.errors.push({
        template: {
          matter_type_id: tpl.matter_type_id,
          matter_type_label: tpl.matter_type_label,
          sub_type_id: tpl.sub_type_id,
          sub_type_label: tpl.sub_type_label
        },
        error: error.message
      });
    }
  }

  await client.end();

  // Log results
  console.log('\nImport Results:');
  console.log('---------------');
  console.log(`Total templates processed: ${templates.length}`);
  console.log(`Templates added: ${results.added.length}`);
  console.log(`Templates skipped: ${results.skipped.length}`);
  console.log(`Errors: ${results.errors.length}`);

  if (results.skipped.length > 0) {
    console.log('\nSkipped Templates:');
    console.log('-----------------');
    results.skipped.forEach(tpl => {
      console.log(`${tpl.matter_type_label} - ${tpl.sub_type_label} (ID: ${tpl.matter_type_id}-${tpl.sub_type_id})`);
    });
  }

  if (results.added.length > 0) {
    console.log('\nAdded Templates:');
    console.log('---------------');
    results.added.forEach(tpl => {
      console.log(`${tpl.matter_type_label} - ${tpl.sub_type_label} (ID: ${tpl.matter_type_id}-${tpl.sub_type_id})`);
    });
  }

  if (results.errors.length > 0) {
    console.log('\nErrors:');
    console.log('-------');
    results.errors.forEach(err => {
      console.log(`Error processing ${err.template.matter_type_label} - ${err.template.sub_type_label}: ${err.error}`);
    });
  }
}

importTemplates().catch(console.error); 