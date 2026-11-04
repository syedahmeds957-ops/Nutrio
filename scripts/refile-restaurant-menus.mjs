#!/usr/bin/env node
/**
 * Re-files every menu item of the expanded Pakistani restaurant brands
 * (packages/food-db/src/data/pakistani-restaurants-expanded.data.ts) into the
 * menu section it really belongs to, decided from the item's own name and the
 * brand's `brandGroup`. The generator that wrote that file assigned
 * `brandCategory` in rotation, so pizzas sat under "Desserts", chai under
 * "Famous Breads & Rolls", burgers under "Dips", and so on.
 *
 * Text-level rewrite, in place: only the `"brandCategory"` line of each item of a
 * listed brand and the `"categories"` array of each brand in
 * PAKISTANI_EXPANDED_BRANDS change. Nothing is reordered, added or removed (food
 * ids are positional), and no other field is touched. Classification never reads
 * the current `brandCategory`, so running the script twice gives the same file.
 *
 *   node scripts/refile-restaurant-menus.mjs           # rewrite + summary
 *   node scripts/refile-restaurant-menus.mjs --check   # exit 1 if the file would change
 *   node scripts/refile-restaurant-menus.mjs --show "Domino's Pakistan" ...  # print sections
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = resolve(ROOT, 'packages/food-db/src/data/pakistani-restaurants-expanded.data.ts');
const EN = resolve(ROOT, 'apps/mobile/src/i18n/locales/en.json');
const AR = resolve(ROOT, 'apps/mobile/src/i18n/locales/ar.json');

// ---------------------------------------------------------------------------
// Taxonomy: one global list, in the order a brand's tabs are shown
// (food first, then sides, then drinks, then desserts).
// Every name is an existing key under tracker.brandGroups in en.json and ar.json.
// ---------------------------------------------------------------------------
const DRINKS = 'Beverages & Drinks';
const ORDER = [
  // food
  'Pizzas',
  'Burgers',
  'Wraps',
  'Sandwiches',
  'Chicken & Wings',
  'BBQ & Grills',
  'Curries & Karahi',
  'Rice & Biryani',
  'Platters',
  'Gourmet Steaks & Mains',
  'Chicken & Beef Mains',
  'Custom Wok Bowls',
  'Seafood',
  'Pastas',
  'Rice & Noodles',
  'Soups',
  'Appetizers',
  'Salads',
  'Breakfast',
  'Savory Bites',
  'Roti & Bread',
  'Other',
  // sides
  'Fries',
  'Sides',
  'Sauces & Dips',
  // drinks
  DRINKS,
  // desserts
  'Desserts',
];

// Ordered rules: the first match wins. Each tests a lower-cased name.
const RULES = [
  // Drinks first: a "Cold Coffee with Ice Cream" is a drink, not a dessert.
  [DRINKS, /\b(chai|coffee|latte|cappuccino|macchiato|espresso|americano|mocha|frappe|frappuccino|qahwa|kahwa|kehwa|gahwa|tea|lassi|shakes?|milkshake|juice|mojito|soda|cola|pepsi|7up|sprite|water|smoothie|lemonade|chillers?|chillatta|sharbat|hot chocolate|milk drink)\b/],
  // Desserts and sweets. "pastry" alone is not here: a puff pastry patty is savoury.
  ['Desserts', /\b(cakes?|cheesecake|brownies?|cookies?|donuts?|doughnuts?|gulab jamun|ladoo|laddu|halwa|kheer|firni|ice cream|gelato|cinnabon|cinnamon rolls?|pudding|tarts?|crumble|brulee|mousse|sundae|tiramisu|jalebi|rasmalai|barfi|mithai|rabri|trifle|waffles?|cupcakes?|kunafa|meetha)\b/],
  // A sauce or dip sold on its own. Tested on the head only (see HEAD_ONLY), so
  // "Hot Wings with Buffalo Sauce" and "Chicken ... in Brown Sauce" never land here.
  ['Sauces & Dips', /\b(sauce|dip|dips|mayo|ketchup|chutney|aioli|dressing)\b/],
  // Sides.
  ['Fries', /\bfries\b/],
  ['Sides', /\b(wedges|breadsticks?|garlic bread|mozzarella sticks|crust rolls?|coleslaw|raita|onion rings|mashed|nachos)\b/],
  ['Salads', /\bsalad\b/],
  // Soups before appetizers ("Wonton Soup").
  ['Soups', /\b(soup|broth)\b/],
  // Starters before wraps/rolls ("Spring Rolls") and fried chicken ("Fried Chicken Wontons").
  ['Appetizers', /\b(spring rolls?|dumplings?|dim sum|wontons?|won ton|tempura|calamari|squid|arancini|prawn crackers)\b/],
  ['Pastas', /\b(pasta|fettuccine|penne|linguine|spaghetti|lasagn[ae]|alfredo|macaroni|arrabiata|ravioli)\b/],
  ['Pizzas', /\b(pizzas?|pepperoni|calzones?)\b/],
  ['Sandwiches', /\b(sandwich|panini|club|sub|subs)\b/],
  ['Burgers', /\b(burgers?|cheeseburger|sliders?|smash|melt|fillet|zinger|bun kabab)\b/],
  ['Wraps', /\b(wraps?|shawarma|paratha rolls?|rolls?)\b/],
  ['Chicken & Wings', /\b(wings|tenders|drumsticks?|nuggets|strips|broast|fried chicken|bucket)\b/],
  ['Custom Wok Bowls', /\b(wok|bowl)\b/],
  ['Savory Bites', /\b(chicken bread|patty|patties|puff|samosa|quiche|croissant)\b/],
  // Steaks and continental mains before BBQ ("Moroccan Grilled Chicken", "Grilled Chicken Steak").
  ['Gourmet Steaks & Mains', /\b(steak|tenderloin|moroccan|tarragon|chicken breast|herb jus|roasted garlic)\b/],
  // Chinese rice and noodles before desi rice.
  ['Rice & Noodles', /\b(noodles?|chow ?mein|fried rice|singaporean|jasmine|steamed rice|pad thai|hakka)\b/],
  ['Platters', /\b(pakistani platter)\b/],
  ['Rice & Biryani', /\b(biryani|pulao|rice)\b/],
  ['BBQ & Grills', /\b(kabab|kebab|kabob|tikka|boti|seekh|chops|bbq|charbroiled|tandoori chicken)\b/],
  ['Curries & Karahi', /\b(karahi|handi|nihari|paye|haleem|korma|qorma|curry|salan|daal|dal|makhni|jalfrezi|qeema|keema|saag|kunna)\b/],
  ['Seafood', /\b(fish|prawns?|shrimps?|salmon|snapper|lobster|crab|seafood)\b/],
  ['Chicken & Beef Mains', /\b(manchurian|shashlik|kung pao|mongolian|szechuan|sichuan|sweet & sour|cashew|chilli dry|honey lemon|honey beef|chilli & basil|teriyaki|black pepper|tofu|chop suey)\b/],
  ['Breakfast', /\b(omelette|eggs?|anda)\b/],
  ['Roti & Bread', /\b(naan|roti|paratha|kulcha|puri|chapati|bread)\b/],
];

// Categories that, at a pizza brand, win over the BBQ-style words in pizza names
// ("Chicken Tikka Supreme", "Bihari Kebab Special Crust" are pizzas there).
const BEFORE_PIZZA_FALLTHROUGH = new Set([
  DRINKS, 'Desserts', 'Sauces & Dips', 'Fries', 'Sides', 'Salads', 'Soups', 'Appetizers',
  'Pastas', 'Pizzas', 'Sandwiches', 'Burgers', 'Wraps', 'Chicken & Wings',
]);

// Rules tested on the dish head only, never on the full name.
const HEAD_ONLY = new Set(['Sauces & Dips']);

/** The dish itself: drop "(4 pcs)" and everything after " with " / " in " / " on ". */
function headOf(name) {
  return name
    .replace(/\([^)]*\)/g, ' ')
    .split(/\s+(?:with|in|on)\s+/i)[0]
    .trim();
}

function firstRule(text, brandGroup, isHead) {
  const lower = text.toLowerCase();
  for (const [category, re] of RULES) {
    if (brandGroup === 'Pizza' && !BEFORE_PIZZA_FALLTHROUGH.has(category)) return 'Pizzas';
    if (!isHead && HEAD_ONLY.has(category)) continue;
    if (re.test(lower)) return category;
  }
  return null;
}

const fallbacks = [];
function classify(item, brand) {
  const group = brand.brandGroup;
  const fromHead = firstRule(headOf(item.name), group, true);
  if (fromHead) return fromHead;
  const fromName = firstRule(item.name, group, false);
  if (fromName) return fromName;
  if (group === 'Pizza') return 'Pizzas';
  fallbacks.push(`${brand.name}: ${item.name}`);
  return 'Other';
}

// Independent check, deliberately not the classifier's regex: names that read as a drink.
const DRINK_NAME = /\b(chai|coffee|latte|cappuccino|macchiato|espresso|qahwa|kahwa|kehwa|tea|lassi|shake|juice|mojito|soda|cola|water|smoothie|lemonade|chiller|frappe)\b/i;

// ---------------------------------------------------------------------------
// Parse
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const checkOnly = args.includes('--check');
const showIdx = args.indexOf('--show');
const showBrands = showIdx >= 0 ? args.slice(showIdx + 1) : [];

const en = JSON.parse(readFileSync(EN, 'utf8')).tracker.brandGroups;
const ar = JSON.parse(readFileSync(AR, 'utf8')).tracker.brandGroups;
for (const c of ORDER) {
  if (!en[c] || !ar[c]) throw new Error(`Category "${c}" has no tracker.brandGroups key in en.json and ar.json`);
}
for (const [c] of RULES) if (!ORDER.includes(c)) throw new Error(`Rule category "${c}" missing from ORDER`);

const original = readFileSync(DATA, 'utf8');
const lines = original.split('\n');

const brandsStart = lines.findIndex((l) => l.startsWith('export const PAKISTANI_EXPANDED_BRANDS'));
const brandsEnd = lines.findIndex((l, i) => i > brandsStart && l === '];');
if (brandsStart < 0 || brandsEnd < 0) throw new Error('PAKISTANI_EXPANDED_BRANDS block not found');

// Brands: name, brandGroup, and the line span of their "categories" array.
const brands = [];
{
  let cur = null;
  for (let i = brandsStart + 1; i < brandsEnd; i++) {
    const l = lines[i];
    let m;
    if (l === '  {') cur = { start: i };
    else if (cur && (m = l.match(/^    "name": "(.*)",$/))) cur.name = m[1];
    else if (cur && (m = l.match(/^    "brandGroup": "(.*)",$/))) cur.brandGroup = m[1];
    else if (cur && l === '    "categories": [') {
      let j = i + 1;
      while (lines[j] !== '    ],') j++;
      cur.catStart = i;
      cur.catEnd = j; // line of "    ],"
      cur.oldCategories = lines.slice(i + 1, j).map((x) => JSON.parse(x.trim().replace(/,$/, '')));
    } else if (cur && (l === '  },' || l === '  }')) {
      if (!cur.name || cur.catStart === undefined) throw new Error(`Brand at line ${cur.start + 1} is missing name or categories`);
      brands.push(cur);
      cur = null;
    }
  }
}
const brandByName = new Map(brands.map((b) => [b.name, b]));

// Items: everything after the brands block; one item per 4-space "id" line.
const items = [];
{
  let cur = null;
  for (let i = brandsEnd + 1; i < lines.length; i++) {
    const l = lines[i];
    let m;
    if ((m = l.match(/^    "id": "(.*)",$/))) {
      cur = { id: m[1] };
      items.push(cur);
    } else if (!cur) continue;
    else if ((m = l.match(/^    "name": "(.*)",$/))) cur.name = JSON.parse(`"${m[1]}"`);
    else if ((m = l.match(/^    "brand": "(.*)",$/))) cur.brand = JSON.parse(`"${m[1]}"`);
    else if ((m = l.match(/^    "brandCategory": "(.*)",$/))) {
      if (cur.brand === undefined) throw new Error(`Item ${cur.id}: brandCategory before brand (line ${i + 1})`);
      cur.bcLine = i;
      cur.oldCategory = JSON.parse(`"${m[1]}"`);
    }
  }
}

// ---------------------------------------------------------------------------
// Classify and rewrite
// ---------------------------------------------------------------------------
let changed = 0;
const perBrand = new Map();
for (const item of items) {
  const brand = brandByName.get(item.brand);
  if (!brand) continue; // e.g. "Ghar ka Khana": not a brand menu, left alone
  if (item.bcLine === undefined) throw new Error(`Item ${item.id} of ${item.brand} has no brandCategory line`);
  const category = classify(item, brand);
  item.newCategory = category;
  if (category !== item.oldCategory) changed++;
  lines[item.bcLine] = `    "brandCategory": ${JSON.stringify(category)},`;
  if (!perBrand.has(brand.name)) perBrand.set(brand.name, []);
  perBrand.get(brand.name).push(item);
}

// Brand category arrays, rewritten bottom-up so earlier line numbers stay valid.
for (const brand of [...brands].reverse()) {
  const used = new Set((perBrand.get(brand.name) ?? []).map((i) => i.newCategory));
  for (const c of used) if (!ORDER.includes(c)) throw new Error(`Category "${c}" missing from ORDER`);
  const cats = ['All', ...ORDER.filter((c) => used.has(c))];
  brand.newCategories = cats;
  const body = cats.map((c, i) => `      ${JSON.stringify(c)}${i < cats.length - 1 ? ',' : ''}`);
  lines.splice(brand.catStart + 1, brand.catEnd - brand.catStart - 1, ...body);
}

const next = lines.join('\n');

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
let drinkNamedOutside = [];
for (const [, list] of perBrand) {
  for (const it of list) if (DRINK_NAME.test(it.name) && it.newCategory !== DRINKS) drinkNamedOutside.push(`${it.brand}: ${it.name} -> ${it.newCategory}`);
}
let oldDrinkNamedOutside = 0;
for (const [, list] of perBrand) for (const it of list) if (DRINK_NAME.test(it.name) && it.oldCategory !== DRINKS) oldDrinkNamedOutside++;

if (showBrands.length) {
  for (const name of showBrands) {
    const list = perBrand.get(name);
    if (!list) { console.log(`\n(no brand "${name}")`); continue; }
    console.log(`\n=== ${name}`);
    for (const c of brandByName.get(name).newCategories.slice(1)) {
      console.log(`  ${c}: ${list.filter((i) => i.newCategory === c).map((i) => i.name).join(' | ')}`);
    }
  }
} else {
  for (const brand of brands) {
    const list = perBrand.get(brand.name) ?? [];
    const counts = brand.newCategories.slice(1).map((c) => `${c} ${list.filter((i) => i.newCategory === c).length}`);
    console.log(`${brand.name} (${list.length}): ${counts.join(', ')}`);
  }
}
const itemsTotal = [...perBrand.values()].reduce((n, l) => n + l.length, 0);
console.log(`\n${brands.length} brands, ${itemsTotal} items, ${changed} changed category (vs the file as read)`);
console.log(`drink-named items outside "${DRINKS}": ${drinkNamedOutside.length} (before: ${oldDrinkNamedOutside} by the same check)`);
for (const d of drinkNamedOutside) console.log(`  ${d}`);
console.log(`items in the fallback bucket "Other": ${fallbacks.length}`);
for (const f of fallbacks) console.log(`  ${f}`);
const noDrinks = brands.filter((b) => !b.newCategories.includes(DRINKS)).map((b) => b.name);
console.log(`brands with no drinks section: ${noDrinks.length}${noDrinks.length ? `: ${noDrinks.join(', ')}` : ''}`);

if (checkOnly) {
  if (next !== original) { console.error('\nFile would change.'); process.exit(1); }
  console.log('\nUp to date.');
} else if (next !== original) {
  writeFileSync(DATA, next);
  console.log('\nRewrote ' + DATA);
} else {
  console.log('\nAlready up to date.');
}
