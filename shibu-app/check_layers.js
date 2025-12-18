import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url); // Use require for JSON if needed or just parse string
// actually fs.readFileSync works fine with string parsing

const filePath = 'e:/Project/Shibu/shibu-app/src/assets/character.json';

try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);

    if (data.layers) {
        console.log('Total Layers:', data.layers.length);
        data.layers.forEach(l => {
            console.log(`Ind: ${l.ind}, Name: "${l.nm}", Parent: ${l.parent || 'None'}`);
        });
    } else {
        console.log('No layers found in JSON');
    }
} catch (e) {
    console.error('Error reading or parsing file:', e);
}
