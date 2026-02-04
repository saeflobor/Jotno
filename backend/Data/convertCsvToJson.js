import fs from 'fs';
import csv from 'csv-parser';

const medicines = [];

fs.createReadStream('medicine.csv')
  .pipe(csv())
  .on('data', (row) => {
    medicines.push({
      id: row['brand id'],
      brand_name: row['brand name'],
      generic: row['generic'],
      dosage_form: row['dosage form'],
      strength: row['strength'],
      manufacturer: row['manufacturer'],
      package: row['package container']
    });
  })
  .on('end', () => {
    fs.writeFileSync('bangladesh-medicines.json', JSON.stringify(medicines, null, 2));
    console.log(`✅ Converted ${medicines.length} medicines to JSON`);
  })
  .on('error', (err) => {
    console.error('Error:', err);
  });
