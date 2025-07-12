export async function loadLevel(levelNumber) {
  try {
    const response = await fetch(`level-${levelNumber}.json`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading level:', error);
  }
}