import EventSettings from '../models/EventSettings.js';

export const seedInitialData = async () => {
  try {
    // Ensure an empty EventSettings document exists with clean blank defaults
    const settingsCount = await EventSettings.countDocuments();
    if (settingsCount === 0) {
      await EventSettings.create({});
      console.log('[Seed] Event Settings initialized with clean defaults.');
    }
  } catch (error) {
    console.error('[Seed Error]:', error.message);
  }
};
