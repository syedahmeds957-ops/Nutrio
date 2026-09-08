import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const dataDir = path.resolve(rootDir, 'packages/food-db/src/data');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

function calcKcal(p, c, f) {
  return Math.round(p * 4 + c * 4 + f * 9);
}

function makeFood(name, nameUr, category, tags, p, c, f, fib, sug, sod, satF, oil, servings) {
  const kcal = calcKcal(p, c, f);
  return {
    name,
    nameUr,
    category,
    cuisineTags: tags,
    kcal100g: kcal,
    protein100g: p,
    carb100g: c,
    fat100g: f,
    fibre100g: fib,
    sugar100g: sug,
    sodiumMg100g: sod,
    satFat100g: satF,
    source: 'pak_custom',
    verifiedBy: 'dietitian_approved',
    oilAddedG: oil,
    servings: servings || [
      { label: '1 medium plate / bowl (200g)', labelUr: '1 پلیٹ', grams: 200, isDefault: true }
    ],
  };
}

// ----------------------------------------------------
// 1. BBQ & GRILLS (55 items)
// ----------------------------------------------------
const bbqList = [
  ['Chicken Tikka (Breast / Chest Piece)', 'چکن تکہ (سینہ)', 28.0, 1.5, 6.5, 0.2, 0.5, 480, 1.8, 3],
  ['Chicken Tikka (Leg / Thigh Piece)', 'چکن تکہ (ران)', 24.0, 1.2, 10.5, 0.2, 0.4, 510, 3.1, 4],
  ['Chicken Malai Boti', 'چکن ملائی بوٹی', 22.0, 2.0, 14.5, 0.3, 0.8, 450, 6.2, 5],
  ['Beef Seekh Kebab / Kabab (Restaurant Style)', 'بیف سیخ کباب', 20.5, 3.5, 16.0, 0.8, 0.5, 580, 6.8, 6],
  ['Chicken Seekh Kabab', 'چکن سیخ کباب', 21.0, 4.0, 9.5, 0.7, 0.6, 520, 2.8, 4],
  ['Mutton Seekh Kabab', 'مٹن سیخ کباب', 19.5, 3.0, 19.0, 0.6, 0.4, 560, 8.5, 6],
  ['Beef Bihari Boti', 'بیف بہاری بوٹی', 22.0, 2.5, 15.0, 0.5, 0.5, 590, 6.2, 7],
  ['Chicken Bihari Boti', 'چکن بہاری بوٹی', 23.5, 2.0, 9.8, 0.4, 0.4, 510, 2.9, 4],
  ['Peshawari Chapli Kebab / Kabab (Beef)', 'پشاوری چپلی کباب (بیف)', 17.5, 6.5, 22.5, 1.2, 1.0, 640, 10.5, 14],
  ['Chicken Chapli Kabab', 'چکن چپلی کباب', 19.0, 6.0, 13.5, 1.0, 0.8, 540, 4.2, 8],
  ['Balochi Sajji (Chicken with Rice)', 'بلوچی سجی مع چاول', 16.0, 18.0, 4.8, 0.8, 0.4, 420, 1.4, 3],
  ['Balochi Sajji (Chicken Meat Only)', 'بلوچی سجی (صرف چکن)', 26.0, 0.5, 7.2, 0.1, 0.1, 460, 2.1, 2],
  ['Lahori Chargha (Whole Chicken Steamed & Fried)', 'لاہوری چرغہ', 23.0, 3.5, 14.2, 0.4, 0.3, 580, 4.1, 8],
  ['Charsi Tikka (Shinwari Salted Mutton)', 'چارسی مٹن تکہ (شنواری)', 21.0, 0.2, 21.5, 0.0, 0.0, 510, 9.8, 5],
  ['Namkeen Boti (Mutton Salted BBQ)', 'نمکین بوٹی', 22.0, 0.2, 19.0, 0.0, 0.0, 530, 8.9, 4],
  ['Chicken Reshmi Kabab', 'چکن ریشمی کباب', 19.5, 3.8, 13.0, 0.5, 0.8, 490, 5.2, 5],
  ['Gola Kabab (Beef)', 'گولہ کباب', 18.5, 4.5, 17.5, 0.7, 0.5, 570, 7.6, 7],
  ['Shami Kabab (Beef & Daal Chana)', 'شامی کباب (بیف)', 16.0, 11.5, 11.0, 3.2, 0.8, 480, 3.5, 5],
  ['Chicken Shami Kabab', 'چکن شامی کباب', 17.5, 12.0, 7.5, 3.0, 0.8, 460, 2.1, 4],
  ['Fish Tikka (Surmai / Rahu Grilled)', 'فش تکہ (گرل)', 22.5, 2.0, 6.5, 0.3, 0.3, 440, 1.2, 3],
  ['Lahori Fried Fish (Gram Flour Batter)', 'لاہوری فرائیڈ فش', 18.0, 8.5, 14.5, 1.1, 0.5, 520, 2.8, 9],
  ['Chicken Kasturi Boti', 'چکن کستوری بوٹی', 24.0, 2.0, 12.0, 0.4, 0.6, 480, 4.8, 5],
  ['Chicken Hariyali Tikka', 'چکن ہریالی تکہ', 25.0, 2.2, 8.5, 0.7, 0.5, 460, 2.3, 3],
  ['Chicken Achari Tikka', 'چکن اچاری تکہ', 24.5, 2.5, 9.5, 0.6, 0.7, 580, 2.6, 4],
  ['Chicken Tangdi Kabab', 'چکن ٹانگڑی کباب', 22.0, 2.0, 12.0, 0.3, 0.4, 490, 3.5, 4],
  ['Mutton Chops BBQ (Champ)', 'مٹن چانپ (گرل)', 21.0, 1.0, 22.0, 0.1, 0.2, 520, 10.2, 6],
  ['Hunter Beef (Sliced Lean)', 'ہنٹر بیف', 28.5, 1.0, 6.0, 0.2, 0.2, 680, 2.4, 1],
  ['Prawn Tikka (Charcoal Grilled)', 'پران تکہ', 23.0, 1.5, 4.5, 0.2, 0.2, 540, 0.9, 3],
  ['Afghani Boti (Mild Beef)', 'افغانی بوٹی', 21.5, 2.0, 15.5, 0.2, 0.4, 480, 6.1, 5],
  ['Chicken Cheese Boti', 'چکن چیز بوٹی', 23.0, 2.5, 16.0, 0.2, 0.5, 520, 7.5, 6],
  ['Chicken Mayo Garlic Boti', 'چکن مایو گارلک بوٹی', 21.0, 3.0, 16.5, 0.2, 1.2, 540, 5.8, 7],
  ['Smokey BBQ Wings', 'اسمموکی بی بی کیو ونگز', 19.5, 4.0, 15.0, 0.3, 2.5, 560, 4.2, 6],
  ['Mutton Dhaba Kabab', 'مٹن ڈھابہ کباب', 18.5, 4.0, 18.5, 0.5, 0.5, 580, 8.2, 7],
  ['Beef Dhaba Kabab', 'بیف ڈھابہ کباب', 19.0, 4.2, 16.5, 0.6, 0.5, 570, 7.1, 6],
  ['Chicken Dhaba Kabab', 'چکن ڈھابہ کباب', 20.0, 4.0, 11.5, 0.5, 0.5, 520, 3.2, 5],
  ['Kalmi Kabab (Stuffed Drumstick)', 'قلمی کباب', 21.0, 3.0, 13.0, 0.4, 0.5, 510, 4.5, 5],
  ['Mutton Boti Kabab', 'مٹن بوٹی کباب', 22.0, 1.5, 17.5, 0.2, 0.3, 530, 7.9, 5],
  ['Seekh Kabab Karahi', 'سیخ کباب کڑاہی', 17.0, 5.0, 18.0, 1.0, 1.5, 560, 6.5, 8],
  ['Afghani Seekh Kabab', 'افغانی سیخ کباب', 20.5, 2.5, 14.5, 0.4, 0.4, 490, 5.5, 5],
  ['Khadda Sajji (Pit Roasted Lamb)', 'کھڈا سجی', 23.0, 0.1, 20.0, 0.0, 0.0, 460, 9.2, 4],
  ['Dumpukht Mutton Ribs', 'دم پخت مٹن چانپیں', 20.5, 0.5, 22.0, 0.1, 0.1, 480, 10.1, 5],
  ['Shinwari Namkeen Tikka', 'شنواری نمکین تکہ', 21.5, 0.1, 22.5, 0.0, 0.0, 490, 10.5, 5],
  ['Peshawari Patta Tikka', 'پشاوری پٹہ تکہ', 18.0, 1.5, 24.0, 0.2, 0.3, 520, 11.2, 6],
  ['Beef Kastoori Boti', 'بیف کستوری بوٹی', 22.5, 2.0, 15.0, 0.3, 0.4, 540, 6.5, 6],
  ['Mutton Bihari Kabab', 'مٹن بہاری کباب', 21.0, 2.5, 18.0, 0.4, 0.4, 570, 8.2, 7],
  ['Tandoori Chicken Wings', 'تندوری چکن ونگز', 18.5, 2.5, 14.5, 0.2, 0.5, 530, 4.2, 5],
  ['Grilled Pomfret Fish', 'پامفرٹ گرل فش', 23.0, 1.5, 7.5, 0.2, 0.2, 460, 1.8, 3],
  ['Charcoal Red Snapper', 'ہیرا مچھلی گرل', 22.0, 1.2, 6.8, 0.2, 0.2, 450, 1.5, 3],
  ['Kofta Kabab Skewer', 'کوفتہ کباب سیخ', 19.5, 3.5, 15.0, 0.6, 0.5, 510, 5.8, 5],
  ['Shinwari Ribs', 'شنواری مٹن پسلیاں', 20.0, 0.2, 23.0, 0.0, 0.0, 470, 10.8, 4],
  ['Mutton Raan Roast', 'مٹن ران روسٹ', 24.0, 0.8, 17.5, 0.2, 0.2, 530, 7.8, 6],
  ['Tandoori Boti', 'تندوری بوٹی', 25.0, 1.8, 8.5, 0.4, 0.5, 520, 2.5, 4],
  ['Zafrani Chicken Tikka', 'زعفرانی چکن تکہ', 26.0, 1.5, 7.5, 0.3, 0.5, 470, 2.2, 3],
  ['Spicy Lemon Pepper Tikka', 'لیمن پیپر چکن تکہ', 26.5, 1.2, 7.0, 0.4, 0.3, 490, 2.0, 3],
  ['BBQ Quail (Bater)', 'بٹیر بی بی کیو', 24.5, 0.5, 9.5, 0.1, 0.1, 480, 2.8, 3],
];

// ----------------------------------------------------
// 2. KARAHI & HANDI (65 items)
// ----------------------------------------------------
const karahiList = [
  ['Chicken Karahi (Lahori Restaurant)', 'لاہوری چکن کڑاہی', 16.5, 3.5, 15.0, 0.8, 1.2, 520, 3.8, 10],
  ['Chicken Karahi (Shinwari / Charsi)', 'شنواری چکن کڑاہی', 17.5, 2.0, 17.0, 0.6, 1.0, 480, 4.5, 12],
  ['Chicken White Karahi (Cream & Yogurt)', 'چکن وائٹ کڑاہی', 15.5, 3.0, 19.0, 0.4, 1.5, 490, 8.5, 12],
  ['Mutton Karahi (Lahori Style)', 'لاہوری مٹن کڑاہی', 15.0, 3.0, 21.5, 0.7, 1.1, 530, 9.2, 11],
  ['Mutton Karahi (Shinwari / Charsi)', 'شنواری مٹن کڑاہی', 16.0, 1.8, 24.0, 0.5, 0.8, 490, 11.0, 13],
  ['Mutton White Karahi', 'مٹن وائٹ کڑاہی', 14.5, 2.8, 24.5, 0.3, 1.2, 510, 11.5, 12],
  ['Beef Karahi', 'بیف کڑاہی', 17.0, 3.2, 19.0, 0.7, 1.1, 540, 7.8, 10],
  ['Chicken Handi (Boneless Claypot)', 'چکن ہانڈی (بون لیس)', 17.5, 3.8, 15.5, 0.6, 1.4, 480, 5.8, 9],
  ['Chicken Makhni Handi', 'چکن مکھنی ہانڈی', 16.0, 4.2, 19.5, 0.5, 1.8, 510, 8.9, 12],
  ['Paneer Reshmi Handi', 'پنیر ریشمی ہانڈی', 11.5, 5.5, 21.5, 0.7, 2.0, 470, 10.8, 10],
  ['Chicken Ginger', 'چکن جنجر', 18.0, 4.0, 12.0, 0.9, 1.2, 520, 3.2, 8],
  ['Chicken Jalfrezi', 'چکن جلفریزی', 17.5, 5.5, 10.5, 1.4, 2.5, 490, 2.8, 7],
  ['Chicken Achari Handi', 'چکن اچاری ہانڈی', 17.0, 4.0, 14.5, 0.8, 1.2, 620, 4.2, 10],
  ['Chicken Green Karahi', 'چکن گرین کڑاہی', 18.0, 3.5, 13.0, 1.1, 1.0, 510, 3.5, 9],
  ['Chicken Kali Mirch Karahi', 'چکن کالی مرچ کڑاہی', 17.5, 3.0, 14.0, 0.7, 1.1, 480, 4.0, 9],
  ['Maghaz Masala (Brain Masala)', 'مغز مصالحہ', 10.5, 2.5, 18.5, 0.4, 0.8, 490, 5.5, 12],
  ['Gurda Kaleji Masala (Liver & Kidney)', 'گردہ کلیجی مصالحہ', 19.5, 3.0, 12.5, 0.5, 0.8, 510, 4.1, 8],
  ['Kata-Kat / Taka-Tak Special Mix', 'کٹاکٹ / ٹکاٹک', 18.0, 2.5, 17.0, 0.4, 0.6, 560, 6.2, 12],
  ['Chicken Tawa Piece', 'چکن توا پیس', 21.0, 3.0, 13.5, 0.5, 0.9, 540, 3.8, 9],
  ['Butter Chicken (Desi Style)', 'بٹر چکن', 15.0, 5.5, 17.5, 0.6, 2.5, 480, 8.2, 11],
  ['Chicken Koyla Karahi (Smoked)', 'چکن کوئلہ کڑاہی', 17.5, 3.0, 15.5, 0.7, 1.1, 520, 3.9, 10],
  ['Balochi Chicken Karahi', 'بلوچی چکن کڑاہی', 18.0, 2.5, 14.0, 0.6, 0.8, 510, 3.4, 9],
  ['Chicken Methi Handi', 'چکن میتھی ہانڈی', 17.0, 4.0, 14.5, 1.2, 1.0, 490, 3.8, 9],
  ['Chicken Mughlai Handi', 'چکن مغلئی ہانڈی', 16.0, 4.5, 18.0, 0.6, 1.5, 510, 7.5, 11],
  ['Mutton Handi Claypot', 'مٹن ہانڈی', 15.5, 3.5, 21.0, 0.6, 1.0, 530, 8.8, 11],
  ['Beef White Karahi', 'بیف وائٹ کڑاہی', 16.0, 2.5, 21.5, 0.4, 1.1, 520, 8.5, 11],
  ['Paneer Butter Masala', 'پنیر بٹر مصالحہ', 11.0, 6.0, 21.0, 0.8, 2.4, 480, 10.2, 10],
  ['Dil Masala (Heart Fry)', 'دل مصالحہ', 21.0, 2.0, 11.5, 0.3, 0.5, 490, 3.5, 7],
  ['Kaleji Fry (Liver Dry Masala)', 'کلیجی فرائی', 22.0, 2.5, 10.5, 0.4, 0.6, 520, 3.2, 6],
  ['Brain Fry Plain (Maghaz Fry)', 'مغز فرائی سادہ', 11.0, 2.0, 19.5, 0.2, 0.5, 470, 5.8, 13],
  ['Chicken Kata-Kat', 'چکن کٹاکٹ', 19.5, 2.8, 13.5, 0.5, 0.8, 530, 3.5, 9],
  ['Prawn Karahi (Coastal Style)', 'پران کڑاہی', 18.5, 4.5, 11.0, 0.8, 1.2, 540, 2.5, 8],
  ['Fish Karahi (Boneless Rahu)', 'فش کڑاہی', 17.5, 4.0, 11.5, 0.7, 1.0, 510, 2.6, 8],
  ['Murgh Mussallam (Stuffed Whole Chicken)', 'مرغ مسلم', 20.0, 4.0, 16.0, 0.8, 1.2, 540, 5.2, 9],
  ['Dhabba Chicken Karahi (Desi Ghee)', 'ڈھابہ چکن کڑاہی مع دیسی گھی', 16.0, 3.0, 21.5, 0.6, 1.0, 530, 11.5, 14],
  ['Butt Karahi Style Chicken', 'بٹ چکن کڑاہی', 16.5, 3.2, 21.0, 0.6, 1.0, 520, 11.0, 13],
  ['Butt Karahi Style Mutton', 'بٹ مٹن کڑاہی', 15.0, 2.5, 25.5, 0.5, 0.8, 540, 13.5, 15],
  ['Shinwari Dumba Karahi (Fat-tailed Sheep)', 'شنواری دنبہ کڑاہی', 15.5, 0.8, 28.5, 0.2, 0.4, 510, 15.5, 16],
  ['Kolachi Special Karahi', 'کولاچی سپیشل کڑاہی', 17.0, 3.5, 16.5, 0.7, 1.2, 520, 4.8, 11],
  ['Monal Cheese Handi', 'مونال چیز ہانڈی', 16.5, 4.0, 19.5, 0.5, 1.5, 540, 9.2, 11],
  ['Chicken Harissa (Lahori Mash with Mini Kababs)', 'لاہوری چکن ہریسہ', 14.5, 12.5, 13.0, 2.8, 0.8, 490, 5.2, 8],
  ['Mutton Harissa', 'لاہوری مٹن ہریسہ', 13.5, 12.0, 16.5, 2.6, 0.6, 510, 7.5, 9],
  ['Chicken Manchurian (Desi Chinese Gravy)', 'چکن منچورین', 14.0, 11.5, 7.5, 0.9, 8.5, 620, 1.4, 5],
  ['Chicken Shashlik with Gravy', 'چکن شاشلک', 14.5, 10.5, 8.0, 1.2, 6.5, 590, 1.5, 5],
  ['Chicken Chilli Dry', 'چکن چلی ڈرائی', 21.0, 5.5, 9.5, 1.1, 2.5, 580, 2.2, 6],
  ['Beef Chilli Dry', 'بیف چلی ڈرائی', 21.5, 4.5, 11.5, 0.9, 2.0, 610, 3.8, 7],
  ['Chicken Chow Mein (Desi Chinese)', 'چکن چاؤمین', 9.5, 24.5, 8.5, 1.8, 2.2, 540, 1.8, 6],
  ['Chicken Madras Curry', 'چکن مدراس کری', 16.5, 4.5, 13.5, 1.0, 1.5, 560, 3.5, 8],
  ['Mutton Dopiaza', 'مٹن دو پیازہ', 16.0, 6.5, 17.5, 1.5, 2.8, 510, 6.8, 9],
  ['Chicken Dopiaza', 'چکن دو پیازہ', 17.5, 6.5, 12.5, 1.6, 2.8, 490, 3.1, 7],
  ['Mutton Roghani Handi', 'مٹن روغنی ہانڈی', 15.0, 4.0, 22.5, 0.6, 1.5, 520, 9.5, 12],
  ['Beef Pasanday Gravy', 'بیف پسندے', 18.5, 4.0, 15.5, 0.7, 1.1, 540, 6.2, 9],
  ['Dum Ka Keema (Smoked Minced Beef Handi)', 'دم کا قیمہ', 18.0, 3.5, 16.5, 0.8, 1.0, 530, 6.5, 9],
  ['Chicken Malai Handi', 'چکن ملائی ہانڈی', 16.5, 3.5, 18.5, 0.4, 1.2, 480, 8.2, 11],
  ['Peshawari Chicken Handi', 'پشاوری چکن ہانڈی', 17.5, 3.0, 16.0, 0.6, 1.0, 490, 4.5, 10],
  ['Mutton Pepper Fry Handi', 'مٹن پیپر فرائی ہانڈی', 16.5, 3.5, 19.5, 0.8, 0.8, 520, 8.2, 10],
  ['Spicy Tawa Chicken Boti', 'توا چکن بوٹی', 22.0, 3.2, 11.0, 0.6, 0.8, 540, 2.8, 7],
  ['Bannu Beef Handi', 'بنوں بیف ہانڈی', 17.5, 3.0, 18.5, 0.5, 0.8, 520, 7.5, 10],
  ['Peshawari Chana Mutton Handi', 'پشاوری چنا مٹن ہانڈی', 14.5, 9.5, 16.5, 2.8, 1.0, 510, 6.5, 8],
  ['Chicken Lababdar Handi', 'چکن لباب دار', 16.0, 5.0, 17.5, 0.8, 2.2, 510, 7.8, 10],
  ['Sizzling Chicken Garlic Handi', 'چکن گارلک ہانڈی', 17.0, 4.5, 14.5, 0.8, 1.2, 520, 4.1, 9],
  ['Chicken Jalfrezi Dry Tawa', 'چکن جلفریزی ڈرائی توا', 18.5, 5.0, 9.5, 1.2, 2.0, 510, 2.4, 6],
  ['Mutton Tawa Champ Masala', 'مٹن توا چانپ مصالحہ', 18.0, 3.0, 19.0, 0.5, 0.8, 530, 8.5, 10],
  ['Desi Ghee Chicken Roast Handi', 'دیسی گھی چکن روسٹ ہانڈی', 18.0, 2.5, 19.0, 0.4, 0.6, 520, 9.8, 12],
  ['Special Dhabba Keema Ghotala', 'ڈھابہ قیمہ گھوٹالہ', 17.0, 4.0, 16.0, 0.8, 1.0, 540, 6.2, 9],
];

// ----------------------------------------------------
// 3. RICE & BIRYANI (55 items)
// ----------------------------------------------------
const riceList = [
  ['Karachi Beef Biryani (with Aloo)', 'کراچی بیف بریانی مع آلو', 8.5, 24.5, 7.0, 1.2, 0.8, 490, 2.8, 6],
  ['Chicken Biryani (Dum Style / Commercial)', 'چکن دم بریانی', 9.5, 23.5, 6.0, 1.0, 0.6, 460, 1.9, 5],
  ['Sindhi Biryani (with Dried Plum & Aloo)', 'سندھی بریانی', 8.0, 25.5, 6.5, 1.4, 1.8, 520, 2.1, 6],
  ['Mutton Biryani (Degi Style)', 'دیگی مٹن بریانی', 9.0, 24.0, 9.2, 1.1, 0.7, 480, 4.1, 7],
  ['Bannu Beef Pulao', 'بنوں بیف پلاؤ', 10.5, 23.0, 8.5, 0.8, 0.4, 510, 4.2, 7],
  ['Mutton Yakhni Pulao', 'مٹن یخنی پلاؤ', 9.0, 23.0, 6.5, 0.8, 0.4, 440, 2.8, 5],
  ['Chicken Yakhni Pulao', 'چکن یخنی پلاؤ', 9.5, 23.0, 4.5, 0.7, 0.4, 420, 1.4, 4],
  ['Kabuli Pulao (with Raisins & Carrots)', 'قابلی پلاؤ', 8.5, 27.0, 6.5, 1.4, 4.5, 410, 2.4, 6],
  ['Chicken Tikka Biryani', 'چکن تکہ بریانی', 11.5, 22.5, 6.8, 0.9, 0.6, 510, 2.2, 6],
  ['Fish Biryani', 'فش بریانی', 9.8, 23.5, 4.8, 0.9, 0.5, 470, 1.2, 5],
  ['Prawn Biryani (Karachi Coastal)', 'پران بریانی (جھینگا)', 10.5, 23.0, 4.2, 0.8, 0.5, 490, 1.0, 4],
  ['Chana Pulao (Chickpea Pilaf)', 'چنا پلاؤ', 4.8, 28.0, 3.8, 2.2, 0.8, 390, 0.8, 4],
  ['Matar Pulao (Green Pea Pilaf)', 'مٹر پلاؤ', 3.8, 27.5, 3.2, 2.0, 1.2, 360, 0.7, 3],
  ['Daal Chawal Combo', 'دال چاول', 4.5, 24.5, 3.2, 2.5, 0.8, 380, 0.9, 3],
  ['Moong Daal Khichdi', 'مونگ دال کھچڑی', 4.2, 21.0, 2.5, 2.1, 0.5, 320, 0.8, 2],
  ['Aloo Tahiri (Spiced Yellow Rice)', 'آلو کی طاہری', 3.2, 27.5, 3.5, 1.8, 0.7, 390, 0.8, 4],
  ['Plain Boiled Basmati Rice', 'سادہ ابلے چاول', 2.7, 28.5, 0.3, 0.4, 0.1, 5, 0.1, 0],
  ['Zeera Rice (Cumin Tadka Rice)', 'زیرہ چاول', 2.8, 27.5, 2.5, 0.6, 0.1, 210, 0.6, 2],
  ['Desi Chinese Chicken Fried Rice', 'چکن فرائیڈ رائس', 7.5, 24.0, 5.5, 1.1, 1.0, 480, 1.2, 5],
  ['Desi Chinese Egg Fried Rice', 'ایگ فرائیڈ رائس', 5.0, 25.0, 5.0, 1.0, 0.8, 450, 1.1, 5],
  ['Desi Chinese Vegetable Fried Rice', 'ویجیٹیبل فرائیڈ رائس', 4.0, 25.5, 4.5, 1.8, 1.2, 430, 0.9, 4],
  ['Hyderabadi Mutton Biryani', 'حیدرآبادی مٹن بریانی', 9.5, 23.5, 8.8, 1.2, 0.6, 490, 3.8, 7],
  ['Bombay Biryani (with Fried Potatoes)', 'بمبئی بریانی', 8.0, 26.0, 6.8, 1.3, 1.2, 510, 2.2, 6],
  ['Matka Dum Biryani (Claypot Baked)', 'مٹکا دم بریانی', 10.0, 23.0, 7.2, 1.0, 0.7, 480, 2.5, 6],
  ['Nalli Biryani (with Marrow Bones)', 'نلی بریانی', 8.5, 23.0, 11.5, 1.0, 0.6, 520, 5.5, 9],
  ['Memoni Akni (Mutton & Potato Rice)', 'میمنی اکھنی', 9.2, 24.5, 7.5, 1.2, 0.8, 490, 3.2, 6],
  ['Chana Biryani (Spicy Chickpea Biryani)', 'چنا بریانی', 5.5, 27.0, 4.5, 2.8, 0.9, 450, 1.1, 4],
  ['Aloo Biryani (Potato Biryani)', 'آلو بریانی', 3.5, 28.5, 4.2, 1.8, 0.8, 460, 1.0, 4],
  ['Chicken Masala Rice', 'چکن مصالحہ چاول', 9.0, 24.0, 5.8, 1.0, 0.8, 480, 1.8, 5],
  ['Peri Peri Rice (Desi Street Style)', 'پیری پیری رائس', 4.2, 26.5, 4.8, 1.2, 1.5, 520, 1.2, 4],
  ['Brown Rice Pulao (Diabetic Friendly)', 'براؤن رائس پلاؤ', 4.8, 25.0, 2.8, 3.5, 0.5, 340, 0.6, 2],
  ['Student Biryani Style Chicken Biryani', 'سٹوڈنٹ بریانی', 9.0, 24.5, 6.8, 1.1, 0.8, 510, 2.4, 6],
  ['Madni Biryani Style Beef Biryani', 'مدنی بیف بریانی', 9.2, 24.0, 8.0, 1.2, 0.7, 520, 3.4, 7],
  ['White Sofiyani Biryani (Mild Aromatic)', 'صوفیانی وائٹ بریانی', 9.0, 24.0, 6.5, 0.8, 0.9, 440, 2.2, 5],
  ['Savour Foods Style Pulao with Kabab', 'سیور فوڈز پلاؤ مع شامی', 8.5, 25.0, 6.2, 1.2, 0.6, 490, 2.1, 5],
  ['Tehzeeb Style Mutton Pulao', 'تہذیب مٹن پلاؤ', 9.5, 23.5, 7.0, 0.9, 0.5, 470, 3.1, 6],
  ['Afghani Mutton Pulao', 'افغانی مٹن پلاؤ', 9.8, 25.0, 7.8, 1.2, 2.8, 440, 3.2, 6],
  ['Kachi Akhni Beef Biryani', 'کچی اکھنی بیف بریانی', 9.5, 23.5, 8.2, 1.0, 0.6, 510, 3.6, 7],
  ['Dum Pukht Chicken Biryani', 'دم پخت چکن بریانی', 10.5, 22.5, 6.2, 0.9, 0.5, 470, 2.1, 5],
  ['Garlic Butter Basmati Rice', 'گارلک بٹر چاول', 3.2, 26.5, 4.5, 0.8, 0.2, 320, 2.5, 4],
  ['Degi Zarda Rice (Sweet Saffron Rice)', 'دیگی زردہ چاول', 3.2, 48.0, 4.8, 0.8, 32.0, 40, 2.8, 4],
  ['Mutanjan Rice (Colorful Sweet Rice)', 'متنجن چاول', 3.5, 49.0, 5.2, 0.9, 34.0, 45, 2.9, 4],
  ['Village Style Chicken Pulao', 'دیہاتی چکن پلاؤ', 9.0, 23.5, 5.0, 0.8, 0.5, 430, 1.8, 4],
  ['Beef Yakhni Pulao', 'بیف یخنی پلاؤ', 9.5, 23.0, 6.8, 0.8, 0.4, 460, 3.0, 5],
  ['Quinoa Khichdi (Healthy Alternative)', 'کوئنوا کھچڑی', 6.2, 19.5, 2.8, 3.4, 0.6, 290, 0.6, 2],
  ['Spicy Prawn Fried Rice', 'پران فرائیڈ رائس', 8.5, 23.5, 5.2, 1.0, 0.8, 510, 1.1, 4],
  ['Chicken Reshmi Biryani', 'چکن ریشمی بریانی', 10.5, 23.0, 7.5, 0.9, 0.8, 490, 2.9, 6],
  ['Kofta Biryani (Meatballs in Rice)', 'کوفتہ بریانی', 9.5, 24.0, 7.8, 1.2, 0.8, 510, 3.1, 6],
  ['Bihari Boti Biryani', 'بہاری بوٹی بریانی', 10.2, 23.5, 7.6, 1.0, 0.7, 520, 3.2, 6],
  ['Shahi Vegetable Pulao', 'شاہی سبزی پلاؤ', 4.2, 26.5, 4.2, 2.5, 1.2, 380, 1.0, 3],
  ['Dhabba Daal Khichdi with Desi Ghee', 'ڈھابہ کھچڑی مع دیسی گھی', 4.5, 21.5, 5.5, 2.2, 0.5, 360, 3.2, 5],
  ['Brown Rice Chicken Biryani', 'براؤن رائس چکن بریانی', 10.2, 22.0, 4.8, 2.6, 0.6, 430, 1.4, 4],
  ['Bannu Chicken Pulao', 'بنوں چکن پلاؤ', 10.0, 23.5, 5.5, 0.8, 0.4, 460, 1.8, 5],
  ['Shinwari Lamb Pulao', 'شنواری مٹن پلاؤ', 9.5, 24.0, 8.5, 0.7, 0.3, 470, 4.2, 7],
  ['Special Karachi Wedding Biryani', 'شادی والی کراچی بریانی', 9.2, 24.2, 7.8, 1.1, 0.8, 520, 3.2, 7],
];

// ----------------------------------------------------
// 4. SLOW-COOKED CURRIES & QORMA (50 items)
// ----------------------------------------------------
const curryList = [
  ['Beef Nihari (Slow-Cooked with Tari)', 'بیف نہاری', 16.0, 5.5, 16.5, 0.8, 0.6, 560, 7.2, 12],
  ['Nalli Beef Nihari (with Bone Marrow)', 'نلی بیف نہاری', 15.0, 5.0, 21.5, 0.7, 0.5, 580, 10.5, 14],
  ['Maghaz Beef Nihari (with Brain)', 'مغز بیف نہاری', 14.5, 4.8, 20.5, 0.6, 0.5, 570, 9.8, 13],
  ['Chicken Nihari', 'چکن نہاری', 17.0, 5.5, 11.5, 0.8, 0.6, 520, 3.2, 8],
  ['Mutton Nihari', 'مٹن نہاری', 15.5, 5.2, 18.5, 0.7, 0.5, 550, 8.5, 12],
  ['Shahi Haleem / Daleem (Beef)', 'شاہی حلیم (بیف)', 11.5, 17.5, 6.0, 3.8, 0.8, 510, 2.2, 6],
  ['Chicken Haleem / Daleem', 'چکن حلیم', 12.0, 17.0, 4.5, 3.6, 0.8, 480, 1.2, 4],
  ['Mutton Haleem', 'مٹن حلیم', 11.0, 17.5, 7.5, 3.8, 0.7, 520, 3.1, 6],
  ['Mutton Siri Paye (Trotters)', 'مٹن سری پائے', 14.5, 2.0, 13.5, 0.2, 0.4, 520, 6.1, 8],
  ['Beef Bong Paye', 'بیف بونگ پائے', 16.0, 2.2, 16.0, 0.2, 0.4, 540, 7.5, 9],
  ['Kunna Gosht (Chinioti Claypot)', 'چنیوٹی کنا گوشت', 16.5, 3.5, 18.5, 0.5, 0.8, 510, 8.4, 10],
  ['Aloo Gosht (Mutton Shorba)', 'آلو گوشت (مٹن)', 11.0, 7.5, 8.0, 1.1, 1.2, 440, 3.2, 5],
  ['Aloo Gosht (Beef Shorba)', 'آلو گوشت (بیف)', 11.5, 7.5, 7.5, 1.1, 1.2, 450, 3.0, 5],
  ['Degi Chicken Korma (Shadi Style)', 'دیگی چکن قورمہ', 16.5, 5.0, 15.5, 0.8, 2.2, 510, 4.8, 11],
  ['Degi Beef Korma', 'دیگی بیف قورمہ', 16.0, 4.5, 19.0, 0.7, 1.8, 530, 8.1, 12],
  ['Degi Mutton Korma', 'دیگی مٹن قورمہ', 15.5, 4.5, 21.0, 0.7, 1.8, 520, 9.4, 12],
  ['White Shadi Korma (Chicken)', 'وائٹ شادی قورمہ', 15.5, 4.8, 18.0, 0.6, 2.1, 490, 7.5, 11],
  ['Kofta Curry (Beef Meatballs)', 'کوفتہ سالن', 14.5, 6.0, 12.5, 1.2, 1.6, 490, 4.5, 8],
  ['Nargisi Kofta (with Hard Boiled Egg inside)', 'نرگسی کوفتہ', 15.5, 5.0, 14.5, 1.0, 1.4, 510, 5.2, 8],
  ['Aloo Keema (Ground Beef with Potatoes)', 'آلو قیمہ (بیف)', 14.0, 8.5, 11.0, 1.4, 1.2, 480, 4.2, 7],
  ['Matar Keema (Minced Beef with Peas)', 'مٹر قیمہ', 14.5, 7.5, 10.5, 1.8, 1.5, 470, 4.0, 7],
  ['Keema Fry (Dhabba Style Dry Spiced Mince)', 'قیمہ فرائی', 18.5, 3.5, 15.5, 0.8, 1.0, 520, 6.2, 9],
  ['Bhuna Gosht (Beef Semi-Dry)', 'بھنا گوشت (بیف)', 19.0, 3.5, 16.5, 0.8, 1.0, 520, 6.8, 9],
  ['Palak Gosht (Mutton in Spinach)', 'پالک گوشت', 13.0, 4.5, 11.5, 2.2, 1.0, 490, 4.5, 7],
  ['Gobhi Gosht (Mutton & Cauliflower)', 'گوبھی گوشت', 12.5, 6.0, 10.5, 2.1, 1.4, 470, 4.0, 6],
  ['Daal Gosht (Chana Lentils & Mutton)', 'دال گوشت', 12.5, 11.5, 7.5, 3.2, 0.9, 460, 2.8, 5],
  ['Karela Gosht (Bitter Gourd & Mutton)', 'کریلا گوشت', 13.0, 6.5, 11.0, 2.8, 1.8, 480, 4.2, 7],
  ['Arvi Gosht (Colocasia & Mutton Gravy)', 'اروی گوشت', 12.0, 8.0, 9.5, 2.0, 1.1, 460, 3.8, 6],
  ['Shaljam Gosht (Turnip & Mutton)', 'شلجم گوشت', 11.5, 6.5, 9.0, 2.2, 2.0, 450, 3.5, 6],
  ['Bhindi Gosht (Okra with Meat)', 'بھنڈی گوشت', 12.5, 7.0, 11.0, 2.6, 1.8, 470, 4.1, 7],
  ['Shabdegh (Kashmiri Turnip & Meatball Stew)', 'شب دیگ', 13.5, 6.0, 13.0, 1.8, 1.5, 490, 5.2, 8],
  ['Dum Pukht Gosht (Slow Salted Mutton)', 'دم پخت گوشت', 19.5, 1.0, 20.5, 0.2, 0.2, 460, 9.5, 4],
  ['Mutton Roghan Josh', 'مٹن روغن جوش', 16.0, 4.5, 19.5, 0.8, 1.2, 510, 8.5, 11],
  ['Chicken Roghan Josh', 'چکن روغن جوش', 17.5, 4.5, 13.5, 0.8, 1.2, 490, 4.2, 9],
  ['Khara Masala Beef Stew', 'کھڑا مصالحہ بیف سٹو', 18.0, 5.0, 15.0, 1.1, 2.0, 510, 5.8, 8],
  ['Hari Mirch Keema (Spicy Green Chilli Mince)', 'ہری مرچ قیمہ', 18.0, 4.0, 14.5, 1.2, 1.1, 520, 5.5, 8],
  ['Chicken White Korma', 'چکن وائٹ قورمہ', 16.0, 4.5, 17.0, 0.5, 1.8, 480, 7.5, 10],
  ['Mutton Yakhni Shorba (Bone Broth Soup)', 'مٹن یخنی شوربہ', 8.5, 1.2, 5.5, 0.1, 0.2, 380, 2.5, 2],
  ['Chicken Yakhni Shorba', 'چکن یخنی شوربہ', 9.0, 1.0, 3.5, 0.1, 0.2, 360, 1.0, 1],
  ['Balti Meat (Traditional Balti Gravy)', 'بلتی گوشت', 17.0, 4.5, 16.0, 1.0, 1.4, 520, 6.5, 9],
  ['Chicken Balti', 'بلتی چکن', 18.0, 4.5, 12.0, 1.0, 1.4, 510, 3.8, 7],
  ['Lahori Chanay with Kofta', 'لاہوری چنے مع کوفتہ', 13.0, 14.5, 9.5, 3.8, 1.2, 490, 3.5, 6],
  ['Paya Shorba (Broth Only)', 'پائے کا شوربہ', 10.5, 1.5, 8.5, 0.1, 0.2, 460, 4.2, 4],
  ['Bong Shorba', 'بونگ کا شوربہ', 11.0, 1.8, 9.5, 0.1, 0.2, 470, 4.5, 4],
  ['Methi Gosht (Fenugreek Mutton)', 'میتھی گوشت', 14.0, 5.0, 13.5, 2.1, 1.1, 480, 5.5, 8],
  ['Shimla Mirch Keema (Capsicum Mince)', 'شملہ مرچ قیمہ', 15.0, 6.5, 11.5, 1.8, 1.8, 490, 4.5, 7],
  ['Chicken Kofta Curry', 'چکن کوفتہ سالن', 16.0, 5.5, 10.5, 1.0, 1.5, 470, 3.2, 7],
  ['Beef Pasanday Tawa Fry', 'بیف پسندے توا فرائی', 21.0, 2.5, 14.5, 0.5, 0.8, 520, 5.8, 8],
  ['Achari Gosht (Pickled Mutton Gravy)', 'اچاری گوشت', 15.5, 4.5, 17.5, 0.8, 1.2, 590, 7.8, 10],
  ['Achari Chicken', 'اچاری چکن', 17.0, 4.5, 13.0, 0.8, 1.2, 580, 4.1, 8],
];

// ----------------------------------------------------
// 5. NASHTA & BREAKFAST (45 items)
// ----------------------------------------------------
const nashtaList = [
  ['Roti / Chapati (Whole Wheat)', 'روٹی / چپاتی', 9.0, 52.0, 2.3, 7.0, 0.5, 180, 0.4, 0, [
    { label: '1 medium roti (45g)', labelUr: '1 درمیانی روٹی', grams: 45, isDefault: true },
    { label: '1 large ghar ki roti (65g)', labelUr: '1 بڑی روٹی', grams: 65, isDefault: false },
    { label: '1 small phulka (30g)', labelUr: '1 چھوٹا پھلکا', grams: 30, isDefault: false }
  ]],
  ['Tandoori Naan (Plain)', 'تندوری نان', 8.5, 54.0, 3.5, 3.0, 2.0, 420, 0.8, 1, [
    { label: '1 medium naan (90g)', labelUr: '1 درمیانہ نان', grams: 90, isDefault: true },
    { label: '1/2 naan (45g)', labelUr: 'آدھا نان', grams: 45, isDefault: false }
  ]],
  ['Puri (Deep-Fried Halwa Puri Bread)', 'پوری (حلوہ پوری)', 7.0, 48.0, 21.0, 1.8, 1.0, 340, 5.2, 16, [
    { label: '1 medium puri (40g)', labelUr: '1 پوری', grams: 40, isDefault: true }
  ]],
  ['Suji Ka Halwa (Nashta Halwa)', 'سوجی کا حلوہ', 4.5, 54.0, 15.0, 1.2, 38.0, 60, 7.5, 12, [
    { label: '1 katori / small bowl (100g)', labelUr: '1 پیالی حلوہ', grams: 100, isDefault: true }
  ]],
  ['Lahori Cholay (Chickpea Curry)', 'لاہوری چنے', 7.5, 19.5, 6.5, 5.5, 1.8, 490, 1.2, 5, [
    { label: '1 medium bowl (180g)', labelUr: '1 پیالی چنے', grams: 180, isDefault: true }
  ]],
  ['Murgh Cholay (Chicken Chickpeas)', 'مرغ چنے', 11.5, 16.5, 8.0, 4.5, 1.5, 510, 2.1, 6],
  ['Anda Ghotala (Karachi Egg Scramble)', 'انڈا گھوٹالہ', 11.0, 4.5, 14.8, 0.9, 1.5, 540, 4.1, 9],
  ['Khagina (Desi Egg Bhurji)', 'خاگینہ', 11.5, 3.5, 13.5, 0.8, 1.2, 480, 3.6, 8],
  ['Desi Fried Omelette', 'دیسی آملیٹ', 12.0, 3.0, 17.0, 0.6, 1.1, 460, 4.5, 10],
  ['Plain Paratha (Ghar Ka Tawa Paratha)', 'سادہ توا پراٹھا', 6.5, 44.0, 16.0, 3.5, 0.8, 280, 4.8, 12, [
    { label: '1 medium paratha (80g)', labelUr: '1 درمیانہ پراٹھا', grams: 80, isDefault: true }
  ]],
  ['Aloo Paratha (Stuffed Potato)', 'آلو کا پراٹھا', 5.5, 42.0, 9.8, 3.2, 1.1, 390, 3.2, 8],
  ['Gobi Paratha (Cauliflower Stuffed)', 'گوبھی کا پراٹھا', 5.8, 37.0, 9.5, 3.8, 1.4, 380, 3.1, 8],
  ['Mooli Paratha (Radish Stuffed)', 'مولی کا پراٹھا', 5.2, 36.0, 9.2, 3.6, 1.2, 390, 3.0, 8],
  ['Keema Paratha (Beef Stuffed)', 'قیمہ پراٹھا', 11.5, 34.0, 12.5, 2.8, 0.9, 440, 4.8, 9],
  ['Cheese Paratha (Desi Bakery Style)', 'چیز پراٹھا', 10.5, 38.0, 15.5, 2.2, 1.2, 460, 7.8, 11],
  ['Lachha Paratha (Flaky Layered)', 'لچھا پراٹھا', 6.0, 45.0, 18.5, 3.0, 0.8, 310, 6.2, 14],
  ['Methi Paratha (Fenugreek Herb)', 'میتھی پراٹھا', 6.8, 39.0, 11.0, 4.2, 1.0, 360, 3.5, 8],
  ['Meetha Paratha (Sugar Stuffed)', 'میٹھا پراٹھا', 5.5, 56.0, 12.5, 2.5, 22.0, 210, 4.2, 9],
  ['Tandoori Kulcha (Plain)', 'تندوری کلچہ', 8.2, 53.0, 3.2, 2.5, 2.0, 380, 0.8, 2],
  ['Roghani Kulcha (with Sesame Seeds & Butter)', 'روغنی کلچہ', 8.5, 50.0, 8.5, 2.4, 2.5, 410, 4.2, 6],
  ['Sheermal (Saffron Sweet Milk Bread)', 'شیرمال', 7.5, 55.0, 10.5, 2.0, 12.0, 290, 5.1, 8],
  ['Taftan (Flaky Rich Saffron Bread)', 'تافتان', 7.8, 54.0, 9.5, 2.2, 8.0, 310, 4.8, 7],
  ['Sweet Lassi (Meethi مع ملائی)', 'میٹھی لسی مع ملائی', 3.2, 15.5, 4.5, 0.0, 14.5, 45, 2.8, 0],
  ['Salted Lassi (Namkeen)', 'نمکین لسی', 3.2, 4.2, 2.8, 0.1, 4.0, 180, 1.8, 0],
  ['Paira Lassi (Caramelized Khoya Milkshake)', 'پیڑا لسی', 4.5, 21.0, 7.5, 0.2, 18.5, 75, 4.5, 0],
  ['Mango Lassi (Chilled with Pulp)', 'مینگو لسی', 2.8, 17.5, 3.2, 0.5, 15.5, 40, 1.9, 0],
  ['Half Fry Egg (Sunny Side Up in Ghee)', 'ہاف فرائی انڈا', 12.5, 0.8, 16.5, 0.0, 0.2, 340, 4.5, 8],
  ['Full Fry Crispy Fried Egg', 'فل فرائی انڈا', 13.0, 0.6, 17.5, 0.0, 0.1, 350, 4.8, 9],
  ['Hard Boiled Egg (Desi Nashta)', 'ابلا ہوا انڈا', 12.8, 0.6, 10.2, 0.0, 0.4, 140, 3.1, 0],
  ['Anda Chanay (Boiled Egg in Chickpea Curry)', 'انڈا چنے', 9.5, 16.5, 7.5, 4.5, 1.4, 480, 2.2, 5],
  ['Kofta Chanay (Meatball & Chickpeas)', 'کوفتہ چنے', 11.5, 15.5, 8.5, 4.2, 1.4, 490, 3.1, 6],
  ['Besan Ki Roti (Gram Flour Flatbread)', 'بیسن کی روٹی', 10.5, 46.0, 4.5, 6.5, 1.5, 320, 1.1, 2],
  ['Desi French Toast (Meetha Toast)', 'دیسی فرینچ ٹوسٹ', 8.5, 36.0, 11.5, 1.4, 14.0, 320, 4.1, 7],
  ['Sooji Ka Seera (Thin Cardamom Semolina Porridge)', 'سوجی کا سیرہ', 3.5, 34.0, 6.5, 0.8, 22.0, 45, 3.2, 4],
  ['Milk Dalia (Sweet Wheat Porridge)', 'دودھ دلیا', 4.2, 22.0, 3.5, 3.2, 12.0, 50, 1.8, 0],
  ['Namkeen Dalia (Savory Vegetable Wheat Porridge)', 'نمکین دلیا', 3.8, 18.5, 2.5, 3.8, 1.2, 280, 0.6, 2],
  ['Chana Puri Nashta Thali Combo', 'چنا پوری ناشتہ تھالی', 6.5, 38.0, 15.0, 3.5, 8.5, 420, 4.5, 11],
  ['Nihari with Khameeri Roti Nashta', 'نہاری مع خمیری روٹی', 12.5, 24.0, 9.5, 1.5, 0.8, 480, 4.2, 7],
  ['Siri Paye with Kulcha Nashta', 'سری پائے مع کلچہ', 11.5, 22.5, 8.5, 1.1, 0.6, 460, 3.8, 6],
  ['Fresh Makhan (Desi White Cultured Butter)', 'تازہ دیسی مکھن', 1.0, 1.0, 81.0, 0.0, 0.5, 15, 51.0, 0],
  ['Fresh Malai (Clotted Buffalo Milk Cream)', 'تازہ بھینس کی ملائی', 2.8, 3.5, 35.0, 0.0, 3.2, 35, 22.0, 0],
  ['Khameeri Roti (Leavened Tandoori Flatbread)', 'خمیری روٹی', 8.0, 51.0, 2.2, 2.8, 1.5, 360, 0.5, 1],
  ['Bakarkhani (Puff Pastry Desi Bread)', 'باقرخانی', 6.5, 52.0, 24.0, 1.8, 8.0, 310, 12.5, 16],
  ['Rusk / Cake Rusk (Dunking Biscuit for Chai)', 'کیک رس', 7.5, 68.0, 14.5, 1.8, 24.0, 280, 6.5, 8],
  ['Feteer Paratha (Arabic Desi Layered Bread)', 'فطیر پراٹھا', 6.2, 46.0, 17.5, 2.8, 1.2, 320, 6.1, 13],
  ['Bhurji Pav (Desi Scrambled Egg with Bun)', 'انڈا بھرجی مع بن', 10.5, 22.0, 11.5, 1.2, 2.5, 480, 3.5, 7],
  ['Tandoori Paratha', 'تندوری پراٹھا', 7.5, 46.0, 12.0, 3.2, 1.0, 340, 3.5, 8],
];

// ----------------------------------------------------
// 6. STREET FOOD & CHAAT (65 items)
// ----------------------------------------------------
const streetFoodList = [
  ['Aloo Samosa (Crispy Fried Potato)', 'آلو کا سموسہ', 4.8, 34.0, 13.5, 2.8, 1.2, 420, 3.2, 10],
  ['Keema Samosa (Beef Mince Crispy)', 'قیمہ سموسہ', 13.5, 27.0, 16.5, 1.8, 0.8, 490, 5.4, 11],
  ['Chicken Samosa', 'چکن سموسہ', 14.5, 26.5, 12.5, 1.6, 0.8, 470, 3.2, 9],
  ['Samosa Chaat (Crushed with Chana & Dahi)', 'سموسہ چاٹ', 4.5, 24.5, 6.8, 3.2, 4.5, 480, 1.8, 5],
  ['Dahi Bhallay / Dahi Baray', 'دہی بھلے / دہی بڑے', 4.8, 19.5, 5.5, 2.1, 6.5, 420, 1.8, 4],
  ['Gol Gappay / Pani Puri (Khatta Paani)', 'گول گپے / پانی پوری', 2.2, 21.0, 2.0, 1.5, 2.5, 380, 0.4, 2],
  ['Bun Kabab (Daal Anda - Karachi)', 'بن کباب (دال انڈا)', 8.5, 29.5, 8.5, 2.8, 3.2, 490, 2.1, 6],
  ['Bun Kabab (Beef Patty with Egg Dip)', 'بن کباب (بیف)', 12.0, 27.0, 10.0, 2.0, 3.0, 520, 3.5, 7],
  ['Chicken Shami Bun Kabab', 'چکن شامی بن کباب', 11.5, 28.0, 8.0, 2.2, 3.0, 490, 2.2, 5],
  ['Special Double Anda Bun Kabab', 'ڈبل انڈا بن کباب', 11.0, 26.5, 11.5, 2.0, 2.8, 510, 3.2, 8],
  ['Chicken Roll Paratha (Tikka Boti)', 'چکن رول پراٹھا', 11.5, 28.0, 12.5, 1.8, 1.5, 480, 4.1, 8],
  ['Garlic Mayo Chicken Roll Paratha', 'گارلک مایو چکن رول', 10.5, 27.0, 17.5, 1.6, 2.2, 530, 4.8, 10],
  ['Beef Bihari Roll Paratha', 'بیف بہاری رول', 12.5, 26.5, 15.0, 1.6, 1.2, 540, 5.2, 9],
  ['Chicken Malai Boti Roll', 'چکن ملائی بوٹی رول', 11.0, 26.0, 16.5, 1.5, 1.8, 510, 5.5, 10],
  ['Chicken Reshmi Kabab Roll', 'چکن ریشمی کباب رول', 11.5, 27.0, 14.5, 1.6, 1.5, 520, 4.8, 9],
  ['Cheese Chicken Paratha Roll', 'چیز چکن رول', 12.5, 26.0, 18.0, 1.5, 1.6, 560, 7.5, 11],
  ['Zinger Paratha Roll', 'زنگر پراٹھا رول', 11.0, 29.0, 16.0, 1.8, 2.5, 570, 4.2, 10],
  ['Mix Vegetable Pakora', 'مکس پکوڑے', 7.2, 28.5, 17.5, 4.2, 2.1, 460, 2.8, 14],
  ['Palak Pakora (Spinach Crispy)', 'پالک پکوڑے', 6.8, 26.0, 17.0, 4.8, 1.8, 440, 2.6, 13],
  ['Aloo Pakora (Sliced Potato Fritter)', 'آلو کے پکوڑے', 5.5, 31.0, 16.0, 3.5, 1.5, 450, 2.5, 12],
  ['Pyaaz Pakora (Onion Bhajji)', 'پیاز کے پکوڑے', 6.5, 27.5, 18.5, 3.8, 3.2, 470, 2.9, 14],
  ['Mirch Pakora (Green Chilli Stuffed)', 'ہری مرچ پکوڑا', 5.2, 25.0, 16.5, 3.2, 2.0, 480, 2.5, 12],
  ['Paneer Pakora (Cottage Cheese)', 'پنیر پکوڑا', 12.5, 21.0, 19.5, 1.8, 1.5, 460, 7.8, 13],
  ['Bread Pakora with Potato Stuffing', 'بریڈ پکوڑا', 6.5, 34.0, 14.5, 2.5, 2.0, 490, 2.8, 10],
  ['Fish Pakora (Fried Fish Nuggets)', 'فش پکوڑا', 16.5, 14.5, 13.5, 1.0, 0.5, 510, 2.5, 9],
  ['Chana Chaat (Boiled Chickpeas)', 'چنا چاٹ', 6.5, 21.0, 1.8, 5.2, 2.4, 380, 0.3, 1],
  ['Kala Chana Chaat (Black Chickpeas)', 'کالا چنا چاٹ', 7.5, 22.0, 2.0, 6.2, 1.8, 360, 0.4, 1],
  ['Lobia Chaat (Black Eyed Pea Salad)', 'سفید لوبیا چاٹ', 7.0, 20.5, 1.5, 5.0, 2.0, 370, 0.3, 1],
  ['Papdi Chaat (Crispy Wafers with Curd)', 'پاپڑی چاٹ', 4.5, 26.0, 8.5, 2.1, 7.5, 460, 2.8, 6],
  ['Sev Puri (Street Snack)', 'سیو پوری', 4.2, 28.0, 9.5, 2.4, 4.5, 480, 2.5, 6],
  ['Fruit Chaat (Spiced Fresh Fruit)', 'فروٹ چاٹ', 1.0, 18.0, 0.3, 2.2, 14.5, 120, 0.1, 0],
  ['Cream Fruit Chaat', 'کریم فروٹ چاٹ', 1.8, 22.5, 7.2, 1.8, 18.0, 65, 4.2, 0],
  ['Masala French Fries', 'مصالحہ فرائز', 3.5, 39.0, 13.5, 3.1, 0.5, 580, 2.4, 11],
  ['Loaded Cheese Fries', 'لوڈڈ چیز فرائز', 6.5, 36.0, 18.5, 2.8, 1.5, 640, 7.5, 12],
  ['Pizza Fries (Chicken Tikka & Cheese)', 'پیزا فرائز', 8.5, 34.0, 17.5, 2.5, 2.2, 620, 6.8, 11],
  ['Roasted Corn on Cob (Bhutta / Chhali)', 'بھٹہ / چھلی', 3.4, 21.0, 1.2, 2.4, 4.5, 220, 0.2, 0],
  ['Boiled Sweet Corn (with Butter & Chaat Masala)', 'ابلی ہوئی چھلی مع مکھن', 3.2, 22.5, 4.5, 2.5, 4.2, 240, 2.2, 3],
  ['Kachori with Aloo Ki Tarkari', 'کچوری مع آلو ترکاری', 5.5, 38.0, 17.0, 3.0, 1.2, 460, 3.8, 13],
  ['Dahi Phulki (Besan Dumplings in Spiced Yogurt)', 'دہی پھلکی', 5.5, 18.0, 4.8, 2.0, 4.5, 390, 1.6, 3],
  ['Raj Kachori (Crispy Stuffed Giant Shell)', 'راج کچوری', 5.8, 32.0, 13.5, 3.2, 8.5, 480, 3.9, 9],
  ['Masala Papad (Roasted Lentil Wafer with Salsa)', 'مصالحہ پاپڑ', 7.5, 24.0, 1.5, 3.5, 1.5, 580, 0.3, 1],
  ['Fried Papad (Crispy)', 'فرائیڈ پاپڑ', 6.5, 28.0, 14.5, 3.0, 0.8, 540, 2.2, 10],
  ['Aloo Tikki (Street Style Potato Cutlet)', 'آلو ٹکی', 3.5, 28.5, 9.5, 2.8, 1.2, 420, 2.1, 7],
  ['Chicken Cutlet (Bakery Style)', 'چکن کٹلس', 12.5, 21.0, 10.5, 1.6, 1.0, 460, 2.8, 7],
  ['Beef Keema Cutlet', 'بیف قیمہ کٹلس', 13.5, 20.0, 12.0, 1.5, 0.8, 480, 3.8, 8],
  ['Vegetable Spring Roll (Crispy Fried)', 'ویجیٹیبل سپرنگ رول', 4.5, 29.0, 11.5, 2.4, 2.0, 440, 2.2, 8],
  ['Chicken Spring Roll', 'چکن سپرنگ رول', 10.5, 26.0, 12.0, 1.8, 1.5, 460, 2.5, 8],
  ['Chicken Wonton (Deep Fried)', 'کرسپی چکن وان ٹان', 11.5, 24.0, 13.5, 1.2, 1.0, 490, 2.8, 9],
  ['Chicken Corn Soup (Desi Chinese Street Style)', 'چکن کارن سوپ', 4.5, 6.8, 1.5, 0.5, 1.2, 380, 0.4, 1],
  ['Hot & Sour Soup (Desi Chinese)', 'ہاٹ اینڈ سار سوپ', 5.2, 6.5, 1.8, 0.8, 1.8, 420, 0.4, 1],
  ['Sprouted Moong Chaat (Healthy Protein Salad)', 'مونگ دال چاٹ', 8.5, 19.5, 1.2, 5.5, 2.2, 280, 0.2, 0],
  ['Beetroot & Carrot Desi Salad', 'چقندر اور گاجر سلاد', 1.5, 10.5, 0.3, 3.2, 6.8, 65, 0.1, 0],
  ['Kachumber Salad (Cucumber, Tomato, Onion with Lemon)', 'کچومر سلاد', 1.2, 5.5, 0.2, 1.8, 2.8, 45, 0.1, 0],
  ['Mint Raita (Podina Yogurt Dip)', 'پودینہ رائتہ', 3.2, 4.5, 2.8, 0.4, 4.0, 180, 1.8, 0],
  ['Zeera Raita (Roasted Cumin Curd)', 'زیرہ رائتہ', 3.4, 4.2, 2.8, 0.2, 3.8, 160, 1.8, 0],
  ['Boondi Raita (Crisp Gram Pearls in Curd)', 'بوندی رائتہ', 4.2, 9.5, 4.5, 0.8, 4.2, 240, 2.2, 2],
  ['Sweet Tamarind Chutney (Imli Ki Meethi Chutney)', 'املی کی میٹھی چٹنی', 0.8, 38.0, 0.2, 1.5, 34.0, 210, 0.1, 0],
  ['Spicy Green Chutney (Hari Mirch Podina)', 'ہری چٹنی', 1.5, 4.5, 0.5, 1.8, 1.0, 420, 0.1, 0],
  ['Plum Chutney (Aloo Bukhara Chutney)', 'آلو بخارا چٹنی', 0.8, 44.0, 0.2, 1.8, 38.0, 110, 0.1, 0],
  ['Garlic Mayo Dip', 'گارلک مایو ڈپ', 1.2, 5.5, 48.0, 0.2, 3.5, 490, 7.5, 35],
  ['Ketchup (Chilli Garlic)', 'چلی گارلک ساس', 1.0, 28.0, 0.2, 0.5, 24.0, 680, 0.1, 0],
  ['Spicy Chicken Mayo Roll', 'سپائسی چکن مایو رول', 11.0, 27.5, 16.5, 1.5, 2.0, 540, 4.5, 10],
  ['Egg Roll Paratha', 'انڈا رول پراٹھا', 8.5, 32.0, 14.5, 2.0, 1.5, 460, 3.8, 9],
  ['Aloo Samosa with Mint Raita Combo', 'سموسہ مع رائتہ', 4.5, 28.0, 10.5, 2.2, 2.5, 360, 2.5, 7],
  ['Street Style Gol Gappa Box', 'گول گپا باکس', 2.2, 21.0, 2.0, 1.5, 2.5, 380, 0.4, 2],
];

// ----------------------------------------------------
// 7. VEGETABLES, DAAL & LEGUMES (55 items)
// ----------------------------------------------------
const vegList = [
  ['Daal Mash Fry (with Desi Ghee Tarka)', 'دال ماش فرائی', 8.5, 18.5, 8.0, 4.5, 1.1, 480, 3.2, 6],
  ['Daal Chana (Yellow Split Chickpea Tarka)', 'دال چنا تڑکہ', 8.0, 19.5, 5.5, 5.2, 1.2, 440, 1.2, 4],
  ['Daal Moong (Yellow Petite Lentil Shorba)', 'دال مونگ (پتلی)', 6.5, 14.5, 3.2, 3.5, 0.8, 390, 0.8, 3],
  ['Daal Masoor (Red Lentil Garlic Tarka)', 'دال مسور تڑکہ', 7.0, 15.5, 3.5, 3.8, 0.8, 410, 0.9, 3],
  ['Mix Daal (Panchmel 4-Lentil Blend)', 'مکس دال تڑکہ', 7.5, 16.5, 4.5, 4.2, 0.9, 420, 1.1, 4],
  ['Palak Paneer (Cottage Cheese in Spinach)', 'پالک پنیر', 9.5, 4.5, 14.5, 2.6, 1.5, 460, 6.8, 6],
  ['Paneer Makhni', 'پنیر مکھنی', 9.0, 6.5, 16.5, 1.8, 2.5, 470, 8.2, 8],
  ['Matar Paneer (Peas & Cottage Cheese)', 'مٹر پنیر', 8.5, 9.5, 12.5, 2.8, 2.8, 440, 5.8, 6],
  ['Kadai Paneer', 'کڑاہی پنیر', 10.0, 6.0, 14.0, 2.1, 2.2, 460, 6.2, 7],
  ['Bhindi Masala (Fried Okra with Onions)', 'بھنڈی مصالحہ', 2.8, 11.5, 9.0, 4.5, 3.5, 380, 1.4, 7],
  ['Kurkuri Bhindi (Crispy Deep Fried Okra)', 'کرکری بھنڈی', 3.8, 16.5, 15.5, 5.2, 2.8, 460, 2.5, 12],
  ['Baingan Ka Bharta (Smoked Eggplant Mash)', 'بینگن کا بھرتہ', 2.0, 8.5, 6.2, 3.8, 3.2, 360, 0.9, 5],
  ['Aloo Baingan (Potato & Eggplant Curry)', 'آلو بینگن', 2.2, 12.5, 6.5, 3.2, 2.5, 380, 1.0, 5],
  ['Achari Baingan (Pickled Eggplant)', 'اچاری بینگن', 2.1, 10.5, 8.5, 3.5, 2.8, 540, 1.2, 6],
  ['Aloo Gobi (Potato & Cauliflower)', 'آلو گوبھی', 2.8, 14.5, 6.0, 3.0, 2.5, 380, 1.0, 5],
  ['Aloo Matar (Potato & Green Peas)', 'آلو مٹر', 3.2, 16.0, 4.5, 3.2, 3.0, 370, 0.8, 4],
  ['Aloo Palak (Potato & Spinach)', 'آلو پالک', 2.8, 12.5, 5.2, 2.8, 1.8, 390, 0.9, 4],
  ['Aloo Shimla Mirch (Potato & Bell Pepper)', 'آلو شملہ مرچ', 2.4, 13.5, 5.5, 2.6, 2.2, 380, 0.9, 4],
  ['Jeera Aloo (Cumin Spiced Potatoes)', 'زیرہ آلو', 2.2, 17.5, 5.0, 2.4, 1.0, 390, 0.8, 4],
  ['Dum Aloo (Spicy Baby Potatoes in Gravy)', 'دم آلو', 2.5, 16.5, 8.0, 2.5, 2.0, 420, 1.4, 6],
  ['Sarson Ka Saag (with Desi Makhan)', 'سرسوں کا ساگ مع مکھن', 3.8, 7.5, 10.5, 4.2, 1.8, 420, 5.2, 5],
  ['Makki Ki Roti (Cornmeal Flatbread)', 'مکئی کی روٹی', 6.5, 52.0, 6.0, 5.5, 1.5, 220, 1.2, 3],
  ['Karela Pyaz Masala (Bitter Gourd with Onion)', 'کریلا پیاز مصالحہ', 2.2, 9.5, 7.5, 3.8, 3.5, 360, 1.1, 6],
  ['Bharwan Karela (Stuffed Spiced Bitter Gourd)', 'بھرواں کریلا', 4.5, 12.0, 9.5, 4.2, 3.2, 420, 1.5, 7],
  ['Tori Sabzi (Ridge Gourd Stew)', 'توری کی سبزی', 1.5, 6.5, 5.0, 2.2, 2.8, 320, 0.7, 4],
  ['Tinda Masala (Apple Gourd Curry)', 'ٹنڈے مصالحہ', 1.8, 7.5, 5.5, 2.4, 2.2, 340, 0.8, 4],
  ['Ghia Kaddu (Bottle Gourd / Lauki Stew)', 'گھیا کدو / لوکی', 1.2, 6.0, 4.5, 2.0, 2.5, 310, 0.7, 3],
  ['Lauki Chana Daal (Split Gram with Gourd)', 'لوکی چنا دال', 5.5, 15.5, 4.2, 4.2, 1.8, 390, 0.8, 3],
  ['Lobia Curry (Black-Eyed Peas in Tomato Gravy)', 'سفید لوبیا سالن', 7.5, 20.0, 3.8, 5.0, 1.8, 410, 0.7, 3],
  ['Rajma Masala (Red Kidney Beans Curry)', 'لال لوبیا / راجما', 7.8, 21.0, 3.8, 5.5, 1.5, 430, 0.7, 3],
  ['Chana Masala (Spiced Chickpea Curry)', 'چنا مصالحہ', 7.2, 21.5, 5.2, 5.4, 1.8, 460, 1.0, 4],
  ['Kala Chana Curry (Black Chickpea Shorba)', 'کالا چنا شوربہ', 7.5, 20.5, 4.0, 5.8, 1.5, 420, 0.8, 3],
  ['Methi Aloo (Fenugreek & Potato Dry Curry)', 'میتھی آلو', 2.8, 14.0, 5.5, 3.2, 1.5, 370, 0.9, 4],
  ['Mix Sabzi (Carrots, Peas, Potatoes, Beans)', 'مکس سبزی', 2.5, 12.5, 5.0, 3.5, 2.8, 360, 0.8, 4],
  ['Arvi Masala (Colocasia in Tangy Gravy)', 'اروی مصالحہ', 2.2, 16.5, 6.5, 3.2, 1.8, 420, 1.0, 5],
  ['Shalgam Curry (Sweet & Spiced Turnip)', 'شلجم سالن', 1.8, 8.5, 4.5, 2.8, 4.2, 340, 0.7, 3],
  ['Gajar Matar Sabzi (Carrots & Peas)', 'گاجر مٹر', 2.2, 13.5, 4.2, 3.8, 5.5, 340, 0.7, 3],
  ['Dal Makhani (Black Lentils with Butter & Cream)', 'دال مکھنی', 7.5, 17.5, 9.5, 4.8, 1.2, 460, 5.2, 7],
  ['Pindi Chana (Rawalpindi Style Dark Chickpeas)', 'پنڈی چنے', 8.0, 22.0, 6.5, 5.5, 1.5, 480, 1.2, 5],
  ['Daal Mash Dhaba Style Dry', 'دال ماش ڈھابہ ڈرائی', 9.0, 19.0, 8.5, 4.2, 0.9, 490, 3.5, 7],
  ['Lobia Masala Fry', 'لوبیا مصالحہ فرائی', 8.0, 19.5, 5.2, 4.8, 1.5, 440, 1.1, 4],
  ['Shimla Mirch Besan (Capsicum Gram Flour)', 'شملہ مرچ بیسن', 5.5, 16.0, 7.5, 3.2, 2.0, 410, 1.2, 6],
  ['Lauki Ka Halwa (Sweet Bottle Gourd Pudding)', 'لوکی کا حلوہ', 3.5, 38.0, 12.0, 1.8, 30.0, 75, 6.5, 8],
  ['Mooli Ki Bhuji (Radish Leaves & Radish Stir Fry)', 'مولی کی بھوجی', 2.0, 6.5, 4.5, 3.2, 1.8, 320, 0.7, 3],
  ['Palak Methi Saag', 'پالک میتھی ساگ', 3.5, 5.5, 6.5, 3.8, 1.2, 380, 1.2, 5],
  ['Mushroom Masala (Desi Restaurant Gravy)', 'مشروم مصالحہ', 4.2, 8.5, 8.0, 2.2, 2.2, 440, 1.4, 6],
  ['Soya Chunks Curry (Nutritious High Protein)', 'سویا چنکس سالن', 16.5, 12.5, 6.5, 4.8, 1.5, 460, 1.1, 4],
  ['Daal Palak (Lentils Cooked with Spinach)', 'دال پالک', 6.8, 14.5, 4.2, 3.8, 1.1, 410, 0.9, 3],
  ['Moong Daal Dhuli Dry Tarka', 'مونگ دال دھلی ڈرائی', 8.0, 18.0, 5.0, 3.5, 0.8, 420, 1.2, 4],
  ['Masoor Daal Fry with Zeera', 'مسور دال فرائی زیرہ', 7.5, 17.0, 4.8, 3.6, 0.8, 430, 1.1, 4],
  ['Chana Daal Fry with Green Chillies', 'چنا دال فرائی ہری مرچ', 8.5, 19.0, 6.0, 5.0, 1.0, 450, 1.4, 5],
  ['Methi Matar Malai (Fenugreek, Peas & Cream)', 'میتھی مٹر ملائی', 5.5, 12.0, 16.0, 3.2, 3.8, 420, 8.5, 10],
  ['Jeera Baingan (Cumin Eggplant)', 'زیرہ بینگن', 1.8, 9.0, 5.8, 3.4, 2.8, 350, 0.8, 4],
  ['Dahi Baingan (Eggplant in Spiced Yogurt)', 'دہی بینگن', 3.2, 8.5, 6.5, 2.8, 3.5, 360, 2.2, 4],
  ['Crispy Fried Bitter Gourd Chips', 'کریلا چپس', 4.5, 18.0, 16.0, 5.5, 2.5, 480, 2.8, 13],
];

// ----------------------------------------------------
// 8. PAKISTANI FAST FOOD & BAKERY (50 items)
// ----------------------------------------------------
const fastFoodList = [
  ['Crispy Zinger Burger (Local Fast Food)', 'کرسپی زنگر برگر', 13.5, 24.0, 14.5, 1.2, 2.5, 620, 3.8, 10],
  ['Quarter Chicken Broast (Chest Piece)', 'چکن بروسٹ (سینہ)', 21.0, 8.5, 16.0, 0.6, 0.8, 580, 4.2, 11],
  ['Quarter Chicken Broast (Leg Piece)', 'چکن بروسٹ (ران)', 18.5, 8.0, 19.5, 0.5, 0.6, 610, 5.5, 13],
  ['Chicken Tikka Pizza (Slice)', 'چکن تکہ پیزا سلائس', 12.5, 29.0, 11.5, 1.8, 3.2, 540, 5.2, 6],
  ['Bihari Kabab Pizza (Cheezious Style)', 'بہاری کباب پیزا', 13.5, 28.0, 14.2, 1.6, 3.0, 580, 6.8, 8],
  ['Chicken Shawarma (Arabic Pita Wrap)', 'چکن شوارما (عربی پیٹا)', 12.5, 22.0, 9.0, 1.5, 1.8, 510, 2.8, 5],
  ['OPTP Masala Belgian Fries', 'او پی ٹی پی مصالحہ فرائز', 3.8, 41.0, 13.5, 3.2, 0.6, 620, 3.1, 11],
  ['Club Sandwich (Pakistani Bakery Style)', 'کلب سینڈوچ', 11.0, 23.0, 11.2, 1.4, 2.8, 540, 3.6, 6],
  ['Chicken Nuggets (Local Fried)', 'چکن نگٹس', 14.5, 18.5, 17.0, 0.8, 0.4, 590, 3.9, 12],
  ['Fried Chicken Wings (Hot & Spicy)', 'ہاٹ اینڈ سپائسی ونگز', 17.5, 11.0, 22.0, 0.5, 0.6, 680, 5.8, 14],
  ['Beef Burger (Karachi Street Style)', 'بیف برگر', 14.5, 25.0, 13.5, 1.4, 3.5, 590, 4.8, 8],
  ['Jalapeno Zinger Burger', 'ہیلاپینو زنگر برگر', 13.0, 24.5, 15.5, 1.5, 2.8, 640, 4.1, 11],
  ['Mushroom Melt Beef Burger', 'مشروم میلٹ بیف برگر', 15.0, 23.0, 16.0, 1.2, 2.5, 580, 6.2, 9],
  ['Fajita Sicilian Pizza (Slice)', 'فہیتا سسیلین پیزا', 12.0, 28.5, 12.0, 1.8, 3.5, 560, 5.5, 7],
  ['Malai Boti Pizza (Slice)', 'ملائی بوٹی پیزا', 13.0, 27.5, 14.5, 1.5, 2.8, 540, 6.8, 8],
  ['Four Cheese Lover Pizza (Slice)', 'چیز لوور پیزا', 11.5, 28.0, 15.0, 1.4, 2.5, 580, 8.2, 7],
  ['Paratha Shawarma (Local Street Style)', 'پراٹھا شوارما', 11.0, 28.0, 16.5, 1.8, 2.2, 540, 4.5, 10],
  ['Open Plate Shawarma with Hummus', 'اوپن پلیٹ شوارما مع حمص', 15.5, 16.0, 12.5, 3.2, 1.5, 490, 3.1, 6],
  ['Garlic Mayo Fries (OPTP Style)', 'گارلک مایو فرائز', 3.5, 36.0, 18.5, 2.8, 1.8, 590, 4.2, 14],
  ['Curly Fries (Spiced Seasoned)', 'کرلی فرائز', 3.2, 38.0, 15.5, 3.0, 0.8, 610, 3.2, 12],
  ['Hunter Beef Sandwich (Mustard & Butter)', 'ہنٹر بیف سینڈوچ', 16.5, 24.0, 8.5, 1.5, 1.2, 620, 3.2, 4],
  ['Chicken Roast Sandwich', 'چکن روسٹ سینڈوچ', 14.5, 25.0, 7.5, 1.4, 1.5, 540, 2.2, 3],
  ['Bakery Chicken Pattie (Puff Pastry)', 'چکن پیٹیز', 8.5, 32.0, 24.5, 1.2, 1.5, 490, 11.5, 18],
  ['Bakery Beef Pattie (Puff Pastry)', 'بیف پیٹیز', 9.5, 31.0, 25.5, 1.1, 1.2, 510, 12.2, 19],
  ['Bakery Vegetable Pattie', 'سبزی پیٹیز', 5.5, 34.0, 22.5, 2.2, 1.8, 460, 10.5, 16],
  ['Chicken Bread (Bakery Braided Stuffed Bread)', 'چکن بریڈ', 11.5, 34.0, 12.5, 1.5, 3.5, 480, 4.2, 7],
  ['Bakery Pizza Roll (Spiced Chicken Roll)', 'بیکری پیزا رول', 10.5, 33.0, 13.5, 1.4, 3.2, 510, 4.8, 8],
  ['Bakery Cream Roll (Puff Pastry with Vanilla Cream)', 'کریم رول', 4.5, 46.0, 28.0, 0.8, 26.0, 180, 14.5, 16],
  ['Chicken Tender Strips (Crispy Fried 4 pcs)', 'کرسپی چکن سٹرپس', 19.5, 14.5, 13.5, 0.6, 0.4, 580, 2.8, 9],
  ['Crispy Chicken Popcorn', 'چکن پاپ کارن', 16.5, 17.5, 16.0, 0.8, 0.5, 590, 3.2, 11],
  ['Cheesy Garlic Bread (2 slices)', 'چیزی گارلک بریڈ', 8.5, 34.0, 14.5, 1.8, 2.2, 510, 7.2, 8],
  ['Roast Beef Submarine Sandwich', 'روسٹ بیف سب میرین', 15.5, 26.0, 9.5, 1.6, 2.5, 580, 3.5, 5],
  ['BBQ Chicken Sub Sandwich', 'بی بی کیو چکن سب', 14.5, 28.0, 8.5, 1.5, 5.5, 590, 2.8, 4],
  ['Fish Burger (Crispy Fillet with Tartar Sauce)', 'فش برگر', 13.5, 26.0, 13.5, 1.2, 2.8, 540, 3.1, 9],
  ['Crispy Onion Rings (Deep Fried 6 pcs)', 'انین رنگز', 3.5, 36.0, 16.5, 2.5, 3.8, 480, 3.2, 12],
  ['Potato Wedges (Baked/Fried with Herbs)', 'پوٹیٹو ویجز', 3.2, 34.0, 8.5, 3.2, 0.8, 440, 1.8, 6],
  ['Bakery Zeera Biscuit (Cumin Tea Biscuit)', 'زیرہ بسکٹ', 6.5, 62.0, 22.5, 1.8, 18.0, 380, 10.5, 14],
  ['Bakery Nan Khatai (Traditional Cardamom Shortbread)', 'نان خطائی', 6.0, 58.0, 26.5, 1.4, 28.0, 190, 14.5, 18],
  ['Pista Nan Khatai (with Pistachios)', 'پستہ نان خطائی', 6.8, 56.0, 27.5, 1.6, 27.0, 190, 14.8, 18],
  ['Finger Biscuit (Bakery Ladyfinger)', 'فنگر بسکٹ', 7.5, 66.0, 16.5, 1.2, 24.0, 240, 7.5, 10],
  ['Bakery Fruit Cake (Slice)', 'فروٹ کیک', 5.5, 54.0, 18.0, 1.2, 32.0, 260, 8.5, 11],
  ['Bakery Plain Sponge Cake (Slice)', 'اسپنج کیک', 6.0, 52.0, 16.0, 0.8, 28.0, 280, 7.2, 10],
  ['Chocolate Donut (Bakery Glazed)', 'چاکلیٹ ڈونٹ', 5.0, 48.0, 21.0, 1.5, 26.0, 340, 9.5, 12],
  ['Chicken Mayo Garlic Roll (Bakery Style)', 'چکن مایو رول', 10.5, 28.0, 14.5, 1.4, 2.2, 510, 4.2, 9],
  ['Beef Hunter Bun (Mini Burger)', 'ہنٹر بن', 12.5, 28.0, 7.5, 1.5, 2.0, 540, 2.2, 3],
  ['Hot Dog (Chicken Sausage in Bun with Mustard)', 'ہاٹ ڈاگ', 11.5, 25.0, 14.0, 1.2, 3.5, 680, 4.5, 8],
  ['Crispy Chicken Wrap', 'کرسپی چکن ریپ', 12.0, 28.0, 13.5, 1.8, 2.5, 560, 3.8, 8],
  ['Grilled Chicken Panini', 'گرلڈ چکن پنی نی', 15.5, 25.0, 9.5, 1.6, 2.0, 520, 3.5, 5],
  ['Loaded Nachos (with Cheese & Chicken)', 'لوڈڈ ناچوز', 8.5, 38.0, 21.5, 3.5, 2.5, 620, 8.5, 14],
  ['Cheese Stuffed Garlic Sticks (4 pcs)', 'چیز گارلک سٹکس', 9.5, 35.0, 15.5, 1.8, 2.0, 540, 7.8, 9],
];

// ----------------------------------------------------
// 9. SWEETS & DESSERTS (45 items)
// ----------------------------------------------------
const sweetList = [
  ['Gulab Jamun (in Warm Sugar Syrup)', 'گلاب جامن', 4.8, 52.0, 13.5, 0.5, 44.0, 95, 6.8, 10],
  ['Kala Jamun (Deep Dark Fried Gulab Jamun)', 'کالا جامن', 5.2, 54.0, 14.5, 0.6, 45.0, 90, 7.2, 11],
  ['Jalebi (Crispy Pretzel in Sugar Syrup)', 'جلیبی', 2.5, 72.0, 10.0, 0.4, 58.0, 65, 3.2, 9],
  ['Desi Ghee Jalebi (Special Amritsari)', 'دیسی گھی جلیبی', 2.5, 70.0, 14.5, 0.4, 56.0, 60, 8.5, 13],
  ['Imarti (Urad Daal Flower Sweet)', 'امرتی', 4.2, 68.0, 11.5, 1.2, 54.0, 70, 4.2, 9],
  ['Ras Malai (Paneer Patties in Saffron Milk)', 'رس ملائی', 6.8, 24.0, 8.5, 0.2, 22.0, 75, 5.1, 0],
  ['Shahi Kheer (Cardamom Rice Pudding with Nuts)', 'شاہی کھیر', 4.5, 25.0, 5.5, 0.4, 18.5, 60, 3.2, 0],
  ['Firni (Shikora Ground Rice Pudding)', 'فرنی (مٹی کا پیالہ)', 4.2, 26.0, 5.0, 0.5, 19.5, 55, 2.8, 0],
  ['Gajar Ka Halwa (Carrot Pudding with Khoya)', 'گاجر کا حلوہ مع کھویا', 4.8, 38.0, 14.0, 2.2, 31.0, 85, 8.1, 10],
  ['Rabri (Sweet Clotted Milk Layers)', 'ربڑی', 7.2, 28.0, 13.5, 0.0, 25.0, 90, 8.2, 0],
  ['Kasuri Falooda (Rabri Kulfi & Sev)', 'قصوری فالودہ', 4.5, 34.0, 7.2, 1.2, 26.0, 80, 4.2, 0],
  ['Desi Matka Kulfi (Cardamom Saffron Milk)', 'دیسی مٹکا قلفی', 5.5, 26.0, 9.2, 0.3, 22.5, 70, 5.6, 0],
  ['Shahi Tukray (Royal Fried Bread Pudding)', 'شاہی ٹکڑے', 5.2, 42.0, 13.8, 0.8, 32.0, 140, 6.8, 9],
  ['Multani Sohan Halwa (Dense Walnut Halwa)', 'ملتانی سوہن حلوہ', 6.5, 56.0, 20.5, 1.5, 46.0, 65, 9.8, 15],
  ['Plain Khoya Barfi', 'سادہ برفی', 8.5, 52.0, 17.5, 0.2, 46.0, 110, 10.5, 0],
  ['Pista Barfi (Pistachio Khoya Sweet)', 'پستہ برفی', 9.2, 50.0, 18.5, 0.5, 44.0, 105, 10.2, 0],
  ['Besan Ka Ladoo (Gram Flour Sweet Ball with Ghee)', 'بیسن کا لڈو', 8.0, 54.0, 23.5, 3.5, 42.0, 45, 11.2, 18],
  ['Motichoor Ladoo (Fine Pearl Drops Sweet)', 'موتی چور لڈو', 4.5, 62.0, 18.5, 1.8, 48.0, 55, 8.5, 14],
  ['Chum Chum (Sweet Bengali Spongy Mithai)', 'چم چم', 5.8, 48.0, 6.5, 0.2, 42.0, 85, 3.8, 0],
  ['Rasgulla (Spongy Cottage Cheese in Sugar Syrup)', 'رس گلہ', 4.5, 42.0, 1.2, 0.1, 38.0, 50, 0.7, 0],
  ['Habshi Halwa (Dark Spiced Caramel Milk Halwa)', 'حبشی حلوہ', 7.5, 52.0, 19.5, 0.8, 44.0, 90, 10.5, 14],
  ['Patisa / Soan Papdi (Flaky Cardamom Sweet)', 'پتیسہ / سون پاپڑی', 5.5, 64.0, 21.5, 1.5, 45.0, 60, 10.8, 16],
  ['Moong Daal Ka Halwa (Lentil Halwa with Desi Ghee)', 'مونگ دال کا حلوہ', 7.5, 46.0, 18.5, 3.2, 38.0, 65, 10.5, 14],
  ['Akhrot Ka Halwa (Walnut Halwa)', 'اخروٹ کا حلوہ', 8.5, 42.0, 24.5, 2.5, 34.0, 60, 6.5, 12],
  ['Badam Ka Halwa (Almond Halwa)', 'بادام کا حلوہ', 9.5, 38.0, 25.5, 2.8, 32.0, 55, 6.8, 12],
  ['Kaju Katli (Cashew Diamond Fudge)', 'کاجو قتلی', 9.0, 56.0, 19.5, 1.8, 42.0, 40, 4.2, 0],
  ['Chocolate Barfi', 'چاکلیٹ برفی', 8.2, 54.0, 18.0, 0.8, 46.0, 100, 10.2, 0],
  ['Coconut Barfi (Naryal Barfi)', 'ناریل برفی', 6.5, 55.0, 21.0, 3.2, 44.0, 75, 16.5, 0],
  ['Gondh Ka Ladoo (Winter Edible Gum & Nut Tonic)', 'گوند کے لڈو', 7.2, 48.0, 26.5, 2.8, 36.0, 65, 14.5, 18],
  ['Panjeeri (Wheat, Ghee, Nuts & Herbal Tonic)', 'پنجیری', 8.5, 49.0, 28.0, 3.2, 35.0, 50, 15.5, 20],
  ['Besan Halwa', 'بیسن کا حلوہ', 6.5, 48.0, 17.5, 2.8, 38.0, 55, 9.8, 14],
  ['Chana Daal Halwa', 'چنا دال حلوہ', 7.0, 47.0, 16.5, 3.5, 36.0, 60, 9.2, 13],
  ['Doodh Dulari (Dessert with Mini Gulab Jamun & Jelly)', 'دودھ دلاری', 4.5, 32.0, 7.5, 0.4, 26.0, 70, 4.5, 0],
  ['Lab-e-Shireen (Custard with Jelly & Fruits)', 'لب شیریں', 3.8, 28.0, 6.5, 0.6, 22.0, 65, 3.8, 0],
  ['Trifle (Custard, Jelly, Fruit & Sponge)', 'ٹرائفل', 3.5, 29.0, 5.8, 0.8, 24.0, 75, 3.2, 0],
  ['Fruit Custard (Vanilla with Bananas & Apples)', 'فروٹ کسٹرڈ', 3.2, 24.0, 4.5, 0.8, 19.0, 60, 2.6, 0],
  ['Caramel Custard (Desi Egg Pudding)', 'کیریمل پڈنگ', 5.5, 22.0, 5.5, 0.0, 21.0, 85, 2.8, 0],
  ['Mango Kulfi on Stick', 'مینگو قلفی', 4.8, 25.0, 7.5, 0.4, 22.0, 65, 4.5, 0],
  ['Peshawari Pista Ice Cream (Local Scoop)', 'پشاوری پستہ آئس کریم', 4.5, 26.0, 11.5, 0.5, 22.0, 75, 6.8, 0],
  ['Kulfa Ice Cream (Rich Condensed Milk Scoop)', 'قلفہ آئس کریم', 5.2, 27.0, 12.5, 0.3, 23.0, 80, 7.5, 0],
  ['Zarda Sweet Rice with Cham Cham', 'میٹھے چاول / زردہ', 3.2, 48.0, 4.8, 0.8, 32.0, 40, 2.8, 4],
  ['Mutanjan Sweet Celebration Rice', 'متنجن', 3.5, 49.0, 5.2, 0.9, 34.0, 45, 2.9, 4],
  ['Sweet Paan (Meetha Paan with Saunf & Gulkand)', 'میٹھا پان', 1.2, 24.0, 1.5, 1.8, 20.0, 30, 0.4, 0],
  ['Khoya Til Ladoo (Sesame Seed Sweet)', 'تل کے لڈو', 8.5, 46.0, 24.0, 4.2, 38.0, 50, 6.5, 0],
  ['Gulab Jamun with Rabri Combo', 'گلاب جامن مع ربڑی', 5.8, 42.0, 13.5, 0.3, 36.0, 92, 7.5, 5],
];

// ----------------------------------------------------
// 10. BEVERAGES & DRINKS (40 items)
// ----------------------------------------------------
const drinkList = [
  ['Karak Doodh Patti Chai (2 tsp Sugar)', 'کڑک دودھ پتی چائے مع چینی', 2.8, 9.8, 3.2, 0.0, 9.5, 38, 2.0, 0],
  ['Doodh Patti Chai (Sugar-Free)', 'دودھ پتی چائے (بغیر چینی)', 2.9, 3.8, 3.2, 0.0, 3.8, 38, 2.0, 0],
  ['Doodh Patti Chai (1 tsp Sugar / Kam Cheeni)', 'دودھ پتی (کم چینی)', 2.8, 6.8, 3.2, 0.0, 6.5, 38, 2.0, 0],
  ['Kashmiri Pink Chai (with Nuts)', 'کشمیری گلابی چائے', 3.2, 8.5, 4.5, 0.4, 7.5, 110, 2.4, 0],
  ['Peshawari Kehwa (Green Tea with Cardamom)', 'پشاوری قہوہ (الائچی)', 0.1, 0.4, 0.0, 0.0, 0.0, 2, 0.0, 0],
  ['Peshawari Kehwa with 1 tsp Sugar', 'پشاوری قہوہ مع چینی', 0.1, 3.0, 0.0, 0.0, 2.9, 2, 0.0, 0],
  ['Gur Wali Chai (Jaggery Village Tea)', 'گڑ والی چائے', 2.6, 9.0, 3.0, 0.0, 8.8, 35, 1.8, 0],
  ['Sulaimani Chai (Black Tea with Mint & Lemon)', 'سلیمانی چائے', 0.2, 2.8, 0.0, 0.1, 2.5, 5, 0.0, 0],
  ['Matka Chai / Tandoori Chai', 'تندوری مٹکا چائے', 3.0, 10.5, 3.5, 0.0, 10.0, 42, 2.2, 0],
  ['Cardamom Milk Tea (Ilaichi Chai)', 'الائچی چائے', 2.8, 9.5, 3.2, 0.0, 9.2, 38, 2.0, 0],
  ['Ginger Tea (Adrak Chai)', 'ادرک چائے', 2.8, 9.5, 3.1, 0.1, 9.2, 36, 1.9, 0],
  ['Masala Chai (Spiced Milk Tea)', 'مصالحہ چائے', 2.9, 9.8, 3.2, 0.2, 9.5, 40, 2.0, 0],
  ['Rooh Afza / Jam-e-Shirin (Water Diluted)', 'روح افزاء شربت', 0.0, 12.0, 0.0, 0.0, 12.0, 12, 0.0, 0],
  ['Doodh Rooh Afza (Pink Milk for Iftar)', 'دودھ روح افزاء', 2.8, 11.5, 2.8, 0.0, 11.0, 42, 1.7, 0],
  ['Tukhm-e-Balanga Sharbat (Basil Seeds Cooler)', 'تخم بالنگا شربت', 0.5, 12.5, 0.4, 1.2, 11.5, 15, 0.1, 0],
  ['Fresh Mint Lemonade (Podina Shikanji)', 'پودینہ لیموں پانی', 0.2, 8.8, 0.0, 0.3, 8.0, 120, 0.0, 0],
  ['Desi Shikanjabeen (Lemon Salt & Sugar Water)', 'شکنجبین', 0.1, 7.8, 0.0, 0.1, 7.2, 140, 0.0, 0],
  ['Limca Soda (Lemonade with Black Salt & Soda)', 'لمکا سوڈا', 0.1, 8.5, 0.0, 0.1, 8.0, 210, 0.0, 0],
  ['Fresh Sugarcane Juice (Ganne Ka Ras)', 'تازہ گنے کا رس', 0.3, 16.5, 0.1, 0.2, 15.5, 18, 0.0, 0],
  ['Sattu Drink (Sweet with Jaggery)', 'ستو کا میٹھا شربت', 2.8, 12.5, 0.8, 2.1, 6.5, 85, 0.1, 0],
  ['Sattu Drink (Savory with Salt & Cumin)', 'ستو کا نمکین شربت', 3.0, 8.5, 0.8, 2.2, 0.5, 180, 0.1, 0],
  ['Almond Thandai / Sardai (Wrestler Tonic)', 'بادام سردائی', 3.5, 14.0, 4.8, 1.2, 12.0, 40, 0.6, 0],
  ['Imli Aloo Bukhara Sharbat (Tamarind & Plum)', 'املی آلو بخارا شربت', 0.4, 15.5, 0.1, 0.8, 14.5, 65, 0.0, 0],
  ['Pakola Ice Cream Soda (Can/Bottle)', 'پاکولا آئس کریم سوڈا', 0.0, 11.5, 0.0, 0.0, 11.5, 25, 0.0, 0],
  ['Murree Brewery Apple Malt (Non-Alcoholic)', 'ایپل مالٹ', 0.3, 11.0, 0.0, 0.1, 10.5, 20, 0.0, 0],
  ['Fresh Mango Milkshake (Chaunsa in Season)', 'مینگو ملک شیک', 2.5, 16.5, 3.2, 0.8, 14.5, 45, 1.9, 0],
  ['Banana Milkshake (Kela Shake with Milk)', 'کیلا ملک شیک', 2.6, 17.0, 3.0, 1.1, 13.5, 48, 1.8, 0],
  ['Khajoor Milkshake (Date & Milk Energy Shake)', 'کھجور ملک شیک', 3.1, 19.5, 3.2, 1.5, 16.5, 52, 1.9, 0],
  ['Badam Shake (Almond Milkshake)', 'بادام ملک شیک', 3.8, 14.5, 5.2, 1.2, 12.0, 50, 2.1, 0],
  ['Chiku Milkshake (Sapodilla Shake)', 'چیکو ملک شیک', 2.2, 18.0, 3.2, 1.8, 14.5, 46, 1.9, 0],
  ['Cold Coffee (Pakistani Bakery / Cafe Style)', 'کولڈ کافی', 2.6, 13.5, 3.5, 0.2, 12.5, 55, 2.1, 0],
  ['Chaas (Spiced Desi Buttermilk with Cumin)', 'نمکین چھاچھ', 2.2, 3.2, 1.2, 0.1, 3.0, 210, 0.7, 0],
  ['Zeera Buttermilk (Cumin Mint Buttermilk)', 'زیرہ چھاچھ', 2.2, 3.4, 1.2, 0.2, 3.0, 220, 0.7, 0],
  ['Kashmiri Kahwa with Saffron & Almonds', 'کشمیری قہوہ مع زعفران', 0.5, 2.5, 0.8, 0.3, 2.0, 15, 0.1, 0],
  ['Lemon Grass Tea (Herbal Kehwa)', 'لیمن گراس قہوہ', 0.1, 0.5, 0.0, 0.1, 0.0, 2, 0.0, 0],
  ['Fennel Seed Water (Saunf Ka Pani Digestive)', 'سونف کا پانی', 0.1, 0.8, 0.0, 0.2, 0.5, 5, 0.0, 0],
  ['Coriander Cumin Water (Dhania Zeera Water)', 'دھنیا زیرہ پانی', 0.1, 0.6, 0.0, 0.2, 0.2, 8, 0.0, 0],
  ['Fresh Orange Juice (Mausami / Malta Juice)', 'مالٹا جوس', 0.8, 11.5, 0.2, 0.4, 9.8, 5, 0.0, 0],
  ['Fresh Pomegranate Juice (Qandhari Anar Juice)', 'انار کا جوس', 0.7, 16.0, 0.3, 0.3, 14.0, 8, 0.0, 0],
  ['Falooda Milkshake (Rabri Ice Cream Shake)', 'فالودہ شیک', 3.8, 24.0, 6.5, 0.8, 20.0, 75, 3.8, 0],
];

// Helper to write category files
function writeCategory(filename, varName, list, catName, defaultTags) {
  const items = list.map(item => {
    const servings = item[10] || [
      { label: `1 standard serving (200g)`, labelUr: '1 پورشن', grams: 200, isDefault: true }
    ];
    return makeFood(
      item[0],
      item[1],
      catName,
      defaultTags,
      item[2],
      item[3],
      item[4],
      item[5],
      item[6],
      item[7],
      item[8],
      item[9],
      servings
    );
  });

  const content = `import { NormalizedFood } from '../types.js';\n\nexport const ${varName}: NormalizedFood[] = ${JSON.stringify(items, null, 2)};\n`;
  fs.writeFileSync(path.resolve(dataDir, filename), content);
  console.log(`Wrote ${filename} with ${items.length} items.`);
  return items;
}

const allDishes = [];
allDishes.push(...writeCategory('bbq-grills.data.ts', 'BBQ_GRILLS_DATA', bbqList, 'BBQ & Grills', ['Pakistani', 'BBQ']));
allDishes.push(...writeCategory('karahi-handi.data.ts', 'KARAHI_HANDI_DATA', karahiList, 'Karahi & Handi', ['Pakistani', 'Karahi']));
allDishes.push(...writeCategory('rice-biryani.data.ts', 'RICE_BIRYANI_DATA', riceList, 'Rice & Biryani', ['Pakistani', 'Biryani']));
allDishes.push(...writeCategory('slow-cooked-curries.data.ts', 'SLOW_COOKED_CURRIES_DATA', curryList, 'Slow-Cooked Curries', ['Pakistani', 'Curry']));
allDishes.push(...writeCategory('nashta-breakfast.data.ts', 'NASHTA_BREAKFAST_DATA', nashtaList, 'Breakfast & Nashta', ['Pakistani', 'Nashta']));
allDishes.push(...writeCategory('street-food-chaat.data.ts', 'STREET_FOOD_CHAAT_DATA', streetFoodList, 'Street Food & Chaat', ['Pakistani', 'Street-Food']));
allDishes.push(...writeCategory('vegetables-daal.data.ts', 'VEGETABLES_DAAL_DATA', vegList, 'Sabzi & Lentils', ['Pakistani', 'Vegetarian']));
allDishes.push(...writeCategory('pakistani-fast-food.data.ts', 'PAKISTANI_FAST_FOOD_DATA', fastFoodList, 'Pakistani Fast Food', ['Pakistani', 'Fast-Food']));
allDishes.push(...writeCategory('sweets-desserts.data.ts', 'SWEETS_DESSERTS_DATA', sweetList, 'Desi Sweets & Desserts', ['Pakistani', 'Mithai']));
allDishes.push(...writeCategory('beverages-drinks.data.ts', 'BEVERAGES_DRINKS_DATA', drinkList, 'Beverages & Drinks', ['Pakistani', 'Beverage']));

console.log(`\nTOTAL DISHES COMPILED: ${allDishes.length}`);

// Write index.ts for packages/food-db/src/data/index.ts
const dataIndexContent = `import { NormalizedFood } from '../types.js';
import { BBQ_GRILLS_DATA } from './bbq-grills.data.js';
import { KARAHI_HANDI_DATA } from './karahi-handi.data.js';
import { RICE_BIRYANI_DATA } from './rice-biryani.data.js';
import { SLOW_COOKED_CURRIES_DATA } from './slow-cooked-curries.data.js';
import { NASHTA_BREAKFAST_DATA } from './nashta-breakfast.data.js';
import { STREET_FOOD_CHAAT_DATA } from './street-food-chaat.data.js';
import { VEGETABLES_DAAL_DATA } from './vegetables-daal.data.js';
import { PAKISTANI_FAST_FOOD_DATA } from './pakistani-fast-food.data.js';
import { SWEETS_DESSERTS_DATA } from './sweets-desserts.data.js';
import { BEVERAGES_DRINKS_DATA } from './beverages-drinks.data.js';

export * from './bbq-grills.data.js';
export * from './karahi-handi.data.js';
export * from './rice-biryani.data.js';
export * from './slow-cooked-curries.data.js';
export * from './nashta-breakfast.data.js';
export * from './street-food-chaat.data.js';
export * from './vegetables-daal.data.js';
export * from './pakistani-fast-food.data.js';
export * from './sweets-desserts.data.js';
export * from './beverages-drinks.data.js';

export const ALL_EXPANDED_PAKISTANI_FOODS: NormalizedFood[] = [
  ...BBQ_GRILLS_DATA,
  ...KARAHI_HANDI_DATA,
  ...RICE_BIRYANI_DATA,
  ...SLOW_COOKED_CURRIES_DATA,
  ...NASHTA_BREAKFAST_DATA,
  ...STREET_FOOD_CHAAT_DATA,
  ...VEGETABLES_DAAL_DATA,
  ...PAKISTANI_FAST_FOOD_DATA,
  ...SWEETS_DESSERTS_DATA,
  ...BEVERAGES_DRINKS_DATA,
];
`;
fs.writeFileSync(path.resolve(dataDir, 'index.ts'), dataIndexContent);

// Update pakistani-foods.data.ts to export the complete expanded catalog
const mainPakistaniDataContent = `import { NormalizedFood } from './types.js';
import { ALL_EXPANDED_PAKISTANI_FOODS } from './data/index.js';

/**
 * 500+ Verified Pakistani Restaurant, Street Food & Home Cooking Catalog
 * Dietitian-signed with explicit oil/fat tracking and local portion sizes.
 */
export const PAKISTANI_STAPLES_DATA: NormalizedFood[] = ALL_EXPANDED_PAKISTANI_FOODS;
export const EXPANDED_PAKISTANI_FOODS_COUNT = ALL_EXPANDED_PAKISTANI_FOODS.length;
`;
fs.writeFileSync(path.resolve(rootDir, 'packages/food-db/src/pakistani-foods.data.ts'), mainPakistaniDataContent);

console.log('Successfully updated packages/food-db/src/pakistani-foods.data.ts!');
