import fs from 'fs';
import path from 'path';

const inputPath = 'e:/Project/Shibu/shibu-app/src/assets/character.json';
const bodyOutputPath = 'e:/Project/Shibu/shibu-app/src/assets/character_body.json';
const mouthOutputPath = 'e:/Project/Shibu/shibu-app/src/assets/character_mouth.json';

try {
    const rawData = fs.readFileSync(inputPath, 'utf8');
    const originalData = JSON.parse(rawData);

    // --- Create Body JSON (Everything EXCEPT mouth) ---
    const bodyData = JSON.parse(JSON.stringify(originalData));
    // Filter out the mouth layer (ind: 11)
    bodyData.layers = bodyData.layers.filter(l => l.ind !== 11);
    // Also remove 'hand' layer (ind: 3) and 'kobji' (ind: 2) if we wanted to separate hands too, 
    // but for now the plan only specified mouth separation explicitly for lip-sync. 
    // Wait, I should double check if I should separate hands too? 
    // The task title is "Separating Mouth and Hand Animations".
    // The user prompt said "Separating Lottie Animation Layers" and mentioned hands earlier.
    // The implementation plan mainly focused on mouth for lip sync.
    // I'll stick to just mouth for this step as explicitly approved in the lip-sync context.
    // If I need to separate hands later/now, I can do it.
    // Actually, looking at the task name "Separating Mouth and Hand Animations", I should probably separate hands too if I can.
    // But let's stick to the strictly approved plan first: MOUTH. The user said "ok do it" to the plan which was detailed about mouth.

    fs.writeFileSync(bodyOutputPath, JSON.stringify(bodyData, null, 2));
    console.log(`Created ${bodyOutputPath}`);


    // --- Create Mouth JSON (Only Mouth + Invisible Parents) ---
    const mouthData = JSON.parse(JSON.stringify(originalData));

    // We need Mouth (11), and its parents Face (13) and Body (14).
    // We want to KEEP them. We want to REMOVE everything else.
    const requiredIndices = [11, 13, 14];

    mouthData.layers = mouthData.layers.filter(l => requiredIndices.includes(l.ind));

    // Now make non-mouth layers invisible (remove shapes)
    mouthData.layers.forEach(l => {
        if (l.ind !== 11) {
            l.shapes = []; // Remove visual content
            // l.ks = { ... }; // Keep transforms!
        }
    });

    fs.writeFileSync(mouthOutputPath, JSON.stringify(mouthData, null, 2));
    console.log(`Created ${mouthOutputPath}`);

} catch (err) {
    console.error('Error processing Lottie files:', err);
}
