import { loadCatalogue } from '../src/catalogue/index.js';

// Source files read the food catalogue through foodDb(), which needs it in
// memory first; in the app the splash waits for it, here the test run does.
await loadCatalogue();
