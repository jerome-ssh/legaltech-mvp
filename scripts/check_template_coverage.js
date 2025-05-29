const fs = require('fs');
const path = require('path');

const typesPath = path.join(__dirname, '../src/data/matter_types_and_subtypes.json');
const templatesPath = path.join(__dirname, '../src/data/all_templates.json');

const types = JSON.parse(fs.readFileSync(typesPath, 'utf8'));
const templates = JSON.parse(fs.readFileSync(templatesPath, 'utf8'));

// Build sets of pairs
const allPairs = new Set(types.map(t => `${t.matter_type_id}:${t.sub_type_id}`));
const templatePairs = new Set(templates.map(t => `${t.matter_type_id}:${t.sub_type_id}`));

const missing = [];
for (const pair of allPairs) {
  if (!templatePairs.has(pair)) {
    const [matter_type_id, sub_type_id] = pair.split(':');
    const type = types.find(t => t.matter_type_id == matter_type_id && t.sub_type_id == sub_type_id);
    missing.push({
      matter_type_id,
      matter_type_label: type?.matter_type_label,
      sub_type_id,
      sub_type_label: type?.sub_type_label
    });
  }
}

if (missing.length === 0) {
  console.log('All matter type/sub-type pairs have a template!');
} else {
  console.log('Missing templates for the following pairs:');
  missing.forEach(m => {
    console.log(`- [${m.matter_type_id}] ${m.matter_type_label} / [${m.sub_type_id}] ${m.sub_type_label}`);
  });
  console.log(`\nTotal missing: ${missing.length}`);
} 