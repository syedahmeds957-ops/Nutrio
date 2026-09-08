--
-- Nutrio Initial Seed Data: Core Pakistani Dishes & Serving Sizes
-- Generated from @nutrio/food-db
--

DO $$
DECLARE
  v_food_id UUID;
BEGIN
  -- Dish: Roti / Chapati (Whole Wheat)
  INSERT INTO core.foods (
    name, name_ur, category, cuisine_tags,
    kcal_100g, protein_100g, carb_100g, fat_100g, fibre_100g,
    sugar_100g, sodium_mg_100g, sat_fat_100g, source, verified_by, oil_added_g
  ) VALUES (
    'Roti / Chapati (Whole Wheat)', 'روٹی / چپاتی', 'Breads & Grains', ARRAY['Pakistani', 'Desi', 'Daily'],
    265, 9, 52, 1.8, 7,
    0.5, 180, 0.4, 'pak_custom', 'computed', 0
  ) RETURNING id INTO v_food_id;

  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 medium roti (45g)', '1 درمیانی روٹی', 45, true);
  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 large ghar ki roti (65g)', '1 بڑی روٹی', 65, false);
  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 small phulka (30g)', '1 چھوٹا پھلکا', 30, false);

  -- Dish: Tandoori Naan (Plain)
  INSERT INTO core.foods (
    name, name_ur, category, cuisine_tags,
    kcal_100g, protein_100g, carb_100g, fat_100g, fibre_100g,
    sugar_100g, sodium_mg_100g, sat_fat_100g, source, verified_by, oil_added_g
  ) VALUES (
    'Tandoori Naan (Plain)', 'تندوری نان', 'Breads & Grains', ARRAY['Pakistani', 'Tandoor'],
    285, 8.5, 54, 3.5, 3,
    2, 420, 0.8, 'pak_custom', 'computed', 1
  ) RETURNING id INTO v_food_id;

  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 medium naan (90g)', '1 درمیانہ نان', 90, true);
  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1/2 naan (45g)', 'آدھا نان', 45, false);

  -- Dish: Roghani Naan
  INSERT INTO core.foods (
    name, name_ur, category, cuisine_tags,
    kcal_100g, protein_100g, carb_100g, fat_100g, fibre_100g,
    sugar_100g, sodium_mg_100g, sat_fat_100g, source, verified_by, oil_added_g
  ) VALUES (
    'Roghani Naan', 'روغنی نان', 'Breads & Grains', ARRAY['Pakistani', 'Tandoor', 'Dawat'],
    320, 8, 50, 9.5, 2.5,
    3, 450, 3.8, 'pak_custom', 'computed', 8
  ) RETURNING id INTO v_food_id;

  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 roghani naan (120g)', '1 روغنی نان', 120, true);
  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1/2 roghani naan (60g)', 'آدھا روغنی نان', 60, false);

  -- Dish: Paratha (Plain Fried)
  INSERT INTO core.foods (
    name, name_ur, category, cuisine_tags,
    kcal_100g, protein_100g, carb_100g, fat_100g, fibre_100g,
    sugar_100g, sodium_mg_100g, sat_fat_100g, source, verified_by, oil_added_g
  ) VALUES (
    'Paratha (Plain Fried)', 'سادہ پراٹھا', 'Breads & Grains', ARRAY['Pakistani', 'Breakfast', 'Nashta'],
    360, 6.8, 46, 16.5, 4.2,
    0.8, 280, 6.5, 'pak_custom', 'computed', 14
  ) RETURNING id INTO v_food_id;

  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 medium paratha (80g)', '1 درمیانہ پراٹھا', 80, true);
  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 large tawa paratha (110g)', '1 بڑا پراٹھا', 110, false);

  -- Dish: Aalo Paratha
  INSERT INTO core.foods (
    name, name_ur, category, cuisine_tags,
    kcal_100g, protein_100g, carb_100g, fat_100g, fibre_100g,
    sugar_100g, sodium_mg_100g, sat_fat_100g, source, verified_by, oil_added_g
  ) VALUES (
    'Aalo Paratha', 'آلو پراٹھا', 'Breads & Grains', ARRAY['Pakistani', 'Breakfast', 'Nashta'],
    310, 5.5, 48, 11.2, 3.8,
    1.2, 360, 4.2, 'pak_custom', 'computed', 10
  ) RETURNING id INTO v_food_id;

  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 medium aalo paratha (120g)', '1 درمیانہ آلو پراٹھا', 120, true);

  -- Dish: Puri (Deep Fried)
  INSERT INTO core.foods (
    name, name_ur, category, cuisine_tags,
    kcal_100g, protein_100g, carb_100g, fat_100g, fibre_100g,
    sugar_100g, sodium_mg_100g, sat_fat_100g, source, verified_by, oil_added_g
  ) VALUES (
    'Puri (Deep Fried)', 'پوری', 'Breads & Grains', ARRAY['Pakistani', 'Breakfast', 'Halwa Puri'],
    420, 6.2, 44, 24.5, 2.1,
    0.5, 240, 5.8, 'pak_custom', 'computed', 22
  ) RETURNING id INTO v_food_id;

  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 standard puri (40g)', '1 پوری', 40, true);
  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '2 puris (80g)', '2 پوریاں', 80, false);

  -- Dish: Sheermal
  INSERT INTO core.foods (
    name, name_ur, category, cuisine_tags,
    kcal_100g, protein_100g, carb_100g, fat_100g, fibre_100g,
    sugar_100g, sodium_mg_100g, sat_fat_100g, source, verified_by, oil_added_g
  ) VALUES (
    'Sheermal', 'شیرمال', 'Breads & Grains', ARRAY['Pakistani', 'Karachi', 'Dawat'],
    345, 7.8, 52, 12, 2,
    8.5, 310, 5.2, 'pak_custom', 'computed', 10
  ) RETURNING id INTO v_food_id;

  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 piece sheermal (100g)', '1 شیرمال', 100, true);
  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1/2 sheermal (50g)', 'آدھا شیرمال', 50, false);

  -- Dish: Steamed Basmati Rice (Plain Chawal)
  INSERT INTO core.foods (
    name, name_ur, category, cuisine_tags,
    kcal_100g, protein_100g, carb_100g, fat_100g, fibre_100g,
    sugar_100g, sodium_mg_100g, sat_fat_100g, source, verified_by, oil_added_g
  ) VALUES (
    'Steamed Basmati Rice (Plain Chawal)', 'سادہ سفید چاول', 'Breads & Grains', ARRAY['Pakistani', 'Daily', 'Lunch'],
    130, 2.7, 28.2, 0.3, 0.4,
    0.1, 2, 0.1, 'pak_custom', 'computed', 0
  ) RETURNING id INTO v_food_id;

  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 katori / small bowl (150g)', '1 کٹوری چاول', 150, true);
  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 standard plate (250g)', '1 پلیٹ چاول', 250, false);

  -- Dish: Zeera Rice (Cumin Rice)
  INSERT INTO core.foods (
    name, name_ur, category, cuisine_tags,
    kcal_100g, protein_100g, carb_100g, fat_100g, fibre_100g,
    sugar_100g, sodium_mg_100g, sat_fat_100g, source, verified_by, oil_added_g
  ) VALUES (
    'Zeera Rice (Cumin Rice)', 'زیرہ چاول', 'Breads & Grains', ARRAY['Pakistani', 'Daily', 'Lunch'],
    155, 2.8, 27.5, 3.8, 0.6,
    0.1, 160, 0.8, 'pak_custom', 'computed', 3
  ) RETURNING id INTO v_food_id;

  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 katori (150g)', '1 کٹوری زیرہ چاول', 150, true);
  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 standard plate (250g)', '1 پلیٹ', 250, false);

  -- Dish: Chicken Biryani (Karachi Style)
  INSERT INTO core.foods (
    name, name_ur, category, cuisine_tags,
    kcal_100g, protein_100g, carb_100g, fat_100g, fibre_100g,
    sugar_100g, sodium_mg_100g, sat_fat_100g, source, verified_by, oil_added_g
  ) VALUES (
    'Chicken Biryani (Karachi Style)', 'چکن بریانی', 'Rice & Meat Dishes', ARRAY['Pakistani', 'Karachi', 'Dawat'],
    185, 9.5, 22, 6.8, 1.2,
    0.6, 380, 1.8, 'pak_custom', 'computed', 18
  ) RETURNING id INTO v_food_id;

  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 standard plate (350g)', '1 معیاری پلیٹ', 350, true);
  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 large plate / full box (500g)', '1 بڑی پلیٹ', 500, false);
  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 small katori (150g)', '1 چھوٹی کٹوری', 150, false);

  -- Dish: Beef Biryani
  INSERT INTO core.foods (
    name, name_ur, category, cuisine_tags,
    kcal_100g, protein_100g, carb_100g, fat_100g, fibre_100g,
    sugar_100g, sodium_mg_100g, sat_fat_100g, source, verified_by, oil_added_g
  ) VALUES (
    'Beef Biryani', 'بیف بریانی', 'Rice & Meat Dishes', ARRAY['Pakistani', 'Karachi', 'Dawat'],
    205, 11.2, 21, 8.5, 1.1,
    0.5, 410, 3.2, 'pak_custom', 'computed', 20
  ) RETURNING id INTO v_food_id;

  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 standard plate (350g)', '1 پلیٹ بیف بریانی', 350, true);
  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 large plate (500g)', '1 بڑی پلیٹ', 500, false);

  -- Dish: Chicken Pulao (Yakhni Pulao)
  INSERT INTO core.foods (
    name, name_ur, category, cuisine_tags,
    kcal_100g, protein_100g, carb_100g, fat_100g, fibre_100g,
    sugar_100g, sodium_mg_100g, sat_fat_100g, source, verified_by, oil_added_g
  ) VALUES (
    'Chicken Pulao (Yakhni Pulao)', 'چکن یخنی پلاؤ', 'Rice & Meat Dishes', ARRAY['Pakistani', 'Lahori', 'Daily'],
    175, 8.8, 23.5, 5.5, 0.8,
    0.4, 340, 1.4, 'pak_custom', 'computed', 14
  ) RETURNING id INTO v_food_id;

  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 standard plate (350g)', '1 پلیٹ چکن پلاؤ', 350, true);
  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 small katori (150g)', '1 کٹوری پلاؤ', 150, false);

  -- Dish: Mutton Pulao
  INSERT INTO core.foods (
    name, name_ur, category, cuisine_tags,
    kcal_100g, protein_100g, carb_100g, fat_100g, fibre_100g,
    sugar_100g, sodium_mg_100g, sat_fat_100g, source, verified_by, oil_added_g
  ) VALUES (
    'Mutton Pulao', 'مٹن پلاؤ', 'Rice & Meat Dishes', ARRAY['Pakistani', 'Dawat', 'Traditional'],
    215, 10.5, 22, 9.5, 0.8,
    0.3, 360, 3.8, 'pak_custom', 'computed', 16
  ) RETURNING id INTO v_food_id;

  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 standard plate (350g)', '1 پلیٹ مٹن پلاؤ', 350, true);

  -- Dish: Daal Chawal Combo
  INSERT INTO core.foods (
    name, name_ur, category, cuisine_tags,
    kcal_100g, protein_100g, carb_100g, fat_100g, fibre_100g,
    sugar_100g, sodium_mg_100g, sat_fat_100g, source, verified_by, oil_added_g
  ) VALUES (
    'Daal Chawal Combo', 'دال چاول', 'Rice & Meat Dishes', ARRAY['Pakistani', 'Comfort Food', 'Daily'],
    140, 4.8, 24.5, 2.5, 2.6,
    0.5, 220, 0.5, 'pak_custom', 'computed', 5
  ) RETURNING id INTO v_food_id;

  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 full plate (350g)', '1 پلیٹ دال چاول', 350, true);

  -- Dish: Khichdi (Rice & Moong Daal)
  INSERT INTO core.foods (
    name, name_ur, category, cuisine_tags,
    kcal_100g, protein_100g, carb_100g, fat_100g, fibre_100g,
    sugar_100g, sodium_mg_100g, sat_fat_100g, source, verified_by, oil_added_g
  ) VALUES (
    'Khichdi (Rice & Moong Daal)', 'کھچڑی', 'Rice & Meat Dishes', ARRAY['Pakistani', 'Comfort Food', 'Recovery'],
    135, 4.2, 23, 2.8, 1.8,
    0.3, 190, 1, 'pak_custom', 'computed', 4
  ) RETURNING id INTO v_food_id;

  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 katori / bowl (200g)', '1 پیالہ کھچڑی', 200, true);

  -- Dish: Chicken Karahi (Desi Style)
  INSERT INTO core.foods (
    name, name_ur, category, cuisine_tags,
    kcal_100g, protein_100g, carb_100g, fat_100g, fibre_100g,
    sugar_100g, sodium_mg_100g, sat_fat_100g, source, verified_by, oil_added_g
  ) VALUES (
    'Chicken Karahi (Desi Style)', 'چکن کڑاہی', 'Curries & Stews', ARRAY['Pakistani', 'Lahori', 'Karahi'],
    195, 16.5, 3.5, 12.8, 1,
    1.8, 440, 2.9, 'pak_custom', 'computed', 18
  ) RETURNING id INTO v_food_id;

  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 serving (200g)', '1 سرونگ چکن کڑاہی', 200, true);
  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 large serving (300g)', '1 بڑی سرونگ', 300, false);

  -- Dish: Mutton Karahi
  INSERT INTO core.foods (
    name, name_ur, category, cuisine_tags,
    kcal_100g, protein_100g, carb_100g, fat_100g, fibre_100g,
    sugar_100g, sodium_mg_100g, sat_fat_100g, source, verified_by, oil_added_g
  ) VALUES (
    'Mutton Karahi', 'مٹن کڑاہی', 'Curries & Stews', ARRAY['Pakistani', 'Peshawari', 'Karahi'],
    235, 17.5, 2.8, 17.5, 0.8,
    1.5, 460, 6.8, 'pak_custom', 'computed', 22
  ) RETURNING id INTO v_food_id;

  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 serving (200g)', '1 سرونگ مٹن کڑاہی', 200, true);

  -- Dish: Chicken Korma (Shahi)
  INSERT INTO core.foods (
    name, name_ur, category, cuisine_tags,
    kcal_100g, protein_100g, carb_100g, fat_100g, fibre_100g,
    sugar_100g, sodium_mg_100g, sat_fat_100g, source, verified_by, oil_added_g
  ) VALUES (
    'Chicken Korma (Shahi)', 'چکن قورمہ', 'Curries & Stews', ARRAY['Pakistani', 'Karachi', 'Dawat'],
    210, 15, 4.8, 14.5, 1,
    2.2, 480, 4.2, 'pak_custom', 'computed', 20
  ) RETURNING id INTO v_food_id;

  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 serving with gravy (200g)', '1 سرونگ چکن قورمہ', 200, true);

  -- Dish: Beef Nihari
  INSERT INTO core.foods (
    name, name_ur, category, cuisine_tags,
    kcal_100g, protein_100g, carb_100g, fat_100g, fibre_100g,
    sugar_100g, sodium_mg_100g, sat_fat_100g, source, verified_by, oil_added_g
  ) VALUES (
    'Beef Nihari', 'بیف نہاری', 'Curries & Stews', ARRAY['Pakistani', 'Karachi', 'Lahore', 'Breakfast'],
    225, 15.5, 6.2, 15.5, 0.8,
    0.5, 520, 6.2, 'pak_custom', 'computed', 25
  ) RETURNING id INTO v_food_id;

  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 standard bowl with meat (250g)', '1 پیالہ نہاری', 250, true);
  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 large bowl with nalli/marrow (350g)', '1 بڑا پیالہ', 350, false);

  -- Dish: Chicken Haleem / Daleem
  INSERT INTO core.foods (
    name, name_ur, category, cuisine_tags,
    kcal_100g, protein_100g, carb_100g, fat_100g, fibre_100g,
    sugar_100g, sodium_mg_100g, sat_fat_100g, source, verified_by, oil_added_g
  ) VALUES (
    'Chicken Haleem / Daleem', 'چکن حلیم / دلیم', 'Curries & Stews', ARRAY['Pakistani', 'Muharram', 'Traditional'],
    165, 10.5, 16, 6.8, 3.5,
    0.8, 410, 1.8, 'pak_custom', 'computed', 12
  ) RETURNING id INTO v_food_id;

  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 standard bowl (250g)', '1 پیالہ حلیم', 250, true);
  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 small katori (150g)', '1 کٹوری', 150, false);

  -- Dish: Beef Haleem
  INSERT INTO core.foods (
    name, name_ur, category, cuisine_tags,
    kcal_100g, protein_100g, carb_100g, fat_100g, fibre_100g,
    sugar_100g, sodium_mg_100g, sat_fat_100g, source, verified_by, oil_added_g
  ) VALUES (
    'Beef Haleem', 'بیف حلیم', 'Curries & Stews', ARRAY['Pakistani', 'Traditional'],
    185, 11.5, 15.5, 8.8, 3.5,
    0.7, 430, 3.2, 'pak_custom', 'computed', 15
  ) RETURNING id INTO v_food_id;

  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 standard bowl (250g)', '1 پیالہ بیف حلیم', 250, true);

  -- Dish: Beef Paya (Trotters Gravy)
  INSERT INTO core.foods (
    name, name_ur, category, cuisine_tags,
    kcal_100g, protein_100g, carb_100g, fat_100g, fibre_100g,
    sugar_100g, sodium_mg_100g, sat_fat_100g, source, verified_by, oil_added_g
  ) VALUES (
    'Beef Paya (Trotters Gravy)', 'بیف پائے', 'Curries & Stews', ARRAY['Pakistani', 'Lahori', 'Breakfast'],
    175, 14.2, 2.2, 12, 0.3,
    0.2, 480, 4.5, 'pak_custom', 'computed', 16
  ) RETURNING id INTO v_food_id;

  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 bowl with soup & meat (300g)', '1 پیالہ پائے', 300, true);

  -- Dish: Aalo Gosht (Meat & Potato Shorba)
  INSERT INTO core.foods (
    name, name_ur, category, cuisine_tags,
    kcal_100g, protein_100g, carb_100g, fat_100g, fibre_100g,
    sugar_100g, sodium_mg_100g, sat_fat_100g, source, verified_by, oil_added_g
  ) VALUES (
    'Aalo Gosht (Meat & Potato Shorba)', 'آلو گوشت', 'Curries & Stews', ARRAY['Pakistani', 'Daily', 'Home Cooking'],
    145, 9.8, 6.5, 8.8, 1.2,
    1, 360, 2.8, 'pak_custom', 'computed', 12
  ) RETURNING id INTO v_food_id;

  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 standard serving with shorba (220g)', '1 سرونگ آلو گوشت', 220, true);

  -- Dish: Chicken Handi (Boneless Creamy)
  INSERT INTO core.foods (
    name, name_ur, category, cuisine_tags,
    kcal_100g, protein_100g, carb_100g, fat_100g, fibre_100g,
    sugar_100g, sodium_mg_100g, sat_fat_100g, source, verified_by, oil_added_g
  ) VALUES (
    'Chicken Handi (Boneless Creamy)', 'چکن ہانڈی', 'Curries & Stews', ARRAY['Pakistani', 'Restaurant', 'Dawat'],
    215, 17, 4.2, 14.2, 0.8,
    2, 460, 5.5, 'pak_custom', 'computed', 18
  ) RETURNING id INTO v_food_id;

  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 serving (200g)', '1 سرونگ چکن ہانڈی', 200, true);

  -- Dish: Beef Kofta Curry (Meatball Curry)
  INSERT INTO core.foods (
    name, name_ur, category, cuisine_tags,
    kcal_100g, protein_100g, carb_100g, fat_100g, fibre_100g,
    sugar_100g, sodium_mg_100g, sat_fat_100g, source, verified_by, oil_added_g
  ) VALUES (
    'Beef Kofta Curry (Meatball Curry)', 'بیف کوفتہ سالن', 'Curries & Stews', ARRAY['Pakistani', 'Home Cooking'],
    180, 13.5, 5, 11.5, 1.2,
    1.5, 420, 4.2, 'pak_custom', 'computed', 15
  ) RETURNING id INTO v_food_id;

  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '2 koftas with gravy (180g)', '2 کوفتے مع سالن', 180, true);

  -- Dish: Beef Qeema (Minced Beef Fry)
  INSERT INTO core.foods (
    name, name_ur, category, cuisine_tags,
    kcal_100g, protein_100g, carb_100g, fat_100g, fibre_100g,
    sugar_100g, sodium_mg_100g, sat_fat_100g, source, verified_by, oil_added_g
  ) VALUES (
    'Beef Qeema (Minced Beef Fry)', 'بیف قیمہ', 'Curries & Stews', ARRAY['Pakistani', 'Daily', 'Nashta'],
    215, 18, 3.5, 14.2, 1,
    1.2, 390, 5, 'pak_custom', 'computed', 16
  ) RETURNING id INTO v_food_id;

  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 plate qeema (160g)', '1 پلیٹ قیمہ', 160, true);

  -- Dish: Daal Chana (Tadka)
  INSERT INTO core.foods (
    name, name_ur, category, cuisine_tags,
    kcal_100g, protein_100g, carb_100g, fat_100g, fibre_100g,
    sugar_100g, sodium_mg_100g, sat_fat_100g, source, verified_by, oil_added_g
  ) VALUES (
    'Daal Chana (Tadka)', 'دال چنا تڑکا', 'Daals & Pulses', ARRAY['Pakistani', 'Vegetarian', 'Daily'],
    135, 6.8, 17.5, 4.5, 4.8,
    1.2, 320, 0.8, 'pak_custom', 'computed', 8
  ) RETURNING id INTO v_food_id;

  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 katori / small bowl (150g)', '1 کٹوری دال', 150, true);
  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 deep plate serving (250g)', '1 گہری پلیٹ', 250, false);

  -- Dish: Daal Mash (Fry / Dhaba Style)
  INSERT INTO core.foods (
    name, name_ur, category, cuisine_tags,
    kcal_100g, protein_100g, carb_100g, fat_100g, fibre_100g,
    sugar_100g, sodium_mg_100g, sat_fat_100g, source, verified_by, oil_added_g
  ) VALUES (
    'Daal Mash (Fry / Dhaba Style)', 'دال ماش فرائی', 'Daals & Pulses', ARRAY['Pakistani', 'Dhaba', 'Daily'],
    165, 7.5, 18, 7.2, 3.8,
    1, 360, 1.8, 'pak_custom', 'computed', 12
  ) RETURNING id INTO v_food_id;

  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 katori (150g)', '1 کٹوری دال ماش', 150, true);

  -- Dish: Daal Masoor (Red Lentil Shorba)
  INSERT INTO core.foods (
    name, name_ur, category, cuisine_tags,
    kcal_100g, protein_100g, carb_100g, fat_100g, fibre_100g,
    sugar_100g, sodium_mg_100g, sat_fat_100g, source, verified_by, oil_added_g
  ) VALUES (
    'Daal Masoor (Red Lentil Shorba)', 'دال مسور پتلی', 'Daals & Pulses', ARRAY['Pakistani', 'Home Cooking', 'Daily'],
    105, 5.5, 14.2, 2.8, 3.2,
    0.8, 290, 0.5, 'pak_custom', 'computed', 5
  ) RETURNING id INTO v_food_id;

  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 katori (150g)', '1 کٹوری مسور دال', 150, true);

  -- Dish: Daal Moong (Yellow Moong)
  INSERT INTO core.foods (
    name, name_ur, category, cuisine_tags,
    kcal_100g, protein_100g, carb_100g, fat_100g, fibre_100g,
    sugar_100g, sodium_mg_100g, sat_fat_100g, source, verified_by, oil_added_g
  ) VALUES (
    'Daal Moong (Yellow Moong)', 'دال مونگ', 'Daals & Pulses', ARRAY['Pakistani', 'Home Cooking', 'Daily'],
    110, 6, 14.8, 3, 3.4,
    0.7, 280, 0.6, 'pak_custom', 'computed', 6
  ) RETURNING id INTO v_food_id;

  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 katori (150g)', '1 کٹوری مونگ دال', 150, true);

  -- Dish: Lahori Channay (Murgh Channay Gravy)
  INSERT INTO core.foods (
    name, name_ur, category, cuisine_tags,
    kcal_100g, protein_100g, carb_100g, fat_100g, fibre_100g,
    sugar_100g, sodium_mg_100g, sat_fat_100g, source, verified_by, oil_added_g
  ) VALUES (
    'Lahori Channay (Murgh Channay Gravy)', 'لاہوری چنے / مرغ چنے', 'Daals & Pulses', ARRAY['Pakistani', 'Lahori', 'Breakfast'],
    160, 8.2, 17.5, 6.5, 4.5,
    1.5, 410, 1.2, 'pak_custom', 'computed', 12
  ) RETURNING id INTO v_food_id;

  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 standard plate (200g)', '1 پلیٹ لاہوری چنے', 200, true);

  -- Dish: Lobia Ka Salan (Black-Eyed Peas)
  INSERT INTO core.foods (
    name, name_ur, category, cuisine_tags,
    kcal_100g, protein_100g, carb_100g, fat_100g, fibre_100g,
    sugar_100g, sodium_mg_100g, sat_fat_100g, source, verified_by, oil_added_g
  ) VALUES (
    'Lobia Ka Salan (Black-Eyed Peas)', 'لوبیا کا سالن', 'Daals & Pulses', ARRAY['Pakistani', 'Home Cooking'],
    125, 6.2, 16.5, 3.8, 4.2,
    1, 310, 0.6, 'pak_custom', 'computed', 6
  ) RETURNING id INTO v_food_id;

  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 katori (150g)', '1 کٹوری لوبیا', 150, true);

  -- Dish: Kadhi Pakora
  INSERT INTO core.foods (
    name, name_ur, category, cuisine_tags,
    kcal_100g, protein_100g, carb_100g, fat_100g, fibre_100g,
    sugar_100g, sodium_mg_100g, sat_fat_100g, source, verified_by, oil_added_g
  ) VALUES (
    'Kadhi Pakora', 'کڑھی پکوڑا', 'Daals & Pulses', ARRAY['Pakistani', 'Traditional', 'Lunch'],
    155, 4.8, 13.5, 9.2, 2.1,
    2.5, 440, 2.8, 'pak_custom', 'computed', 14
  ) RETURNING id INTO v_food_id;

  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 bowl with 2 pakoras (220g)', '1 پیالہ کڑھی پکوڑا', 220, true);

  -- Dish: Chicken Tikka (Quarter Leg Piece)
  INSERT INTO core.foods (
    name, name_ur, category, cuisine_tags,
    kcal_100g, protein_100g, carb_100g, fat_100g, fibre_100g,
    sugar_100g, sodium_mg_100g, sat_fat_100g, source, verified_by, oil_added_g
  ) VALUES (
    'Chicken Tikka (Quarter Leg Piece)', 'چکن تکہ (لیگ پیس)', 'Barbecue & Grills', ARRAY['Pakistani', 'BBQ', 'High Protein'],
    170, 23.5, 2, 7.5, 0.4,
    0.5, 490, 2.1, 'pak_custom', 'computed', 6
  ) RETURNING id INTO v_food_id;

  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 leg piece (approx 180g edible)', '1 چکن لیگ تکہ', 180, true);

  -- Dish: Chicken Tikka (Quarter Breast Piece)
  INSERT INTO core.foods (
    name, name_ur, category, cuisine_tags,
    kcal_100g, protein_100g, carb_100g, fat_100g, fibre_100g,
    sugar_100g, sodium_mg_100g, sat_fat_100g, source, verified_by, oil_added_g
  ) VALUES (
    'Chicken Tikka (Quarter Breast Piece)', 'چکن تکہ (بریسٹ پیس)', 'Barbecue & Grills', ARRAY['Pakistani', 'BBQ', 'High Protein', 'Lean'],
    150, 26.5, 1.8, 4.2, 0.4,
    0.4, 480, 1.2, 'pak_custom', 'computed', 4
  ) RETURNING id INTO v_food_id;

  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 breast piece (approx 200g edible)', '1 چکن سینہ تکہ', 200, true);

  -- Dish: Beef Seekh Kebab
  INSERT INTO core.foods (
    name, name_ur, category, cuisine_tags,
    kcal_100g, protein_100g, carb_100g, fat_100g, fibre_100g,
    sugar_100g, sodium_mg_100g, sat_fat_100g, source, verified_by, oil_added_g
  ) VALUES (
    'Beef Seekh Kebab', 'بیف سیخ کباب', 'Barbecue & Grills', ARRAY['Pakistani', 'BBQ', 'High Protein'],
    220, 19.5, 3.5, 14, 0.8,
    0.8, 510, 5.5, 'pak_custom', 'computed', 10
  ) RETURNING id INTO v_food_id;

  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 seekh skewer (80g)', '1 سیخ کباب', 80, true);
  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '2 skewers (160g)', '2 سیخ کباب', 160, false);

  -- Dish: Chicken Seekh Kebab
  INSERT INTO core.foods (
    name, name_ur, category, cuisine_tags,
    kcal_100g, protein_100g, carb_100g, fat_100g, fibre_100g,
    sugar_100g, sodium_mg_100g, sat_fat_100g, source, verified_by, oil_added_g
  ) VALUES (
    'Chicken Seekh Kebab', 'چکن سیخ کباب', 'Barbecue & Grills', ARRAY['Pakistani', 'BBQ', 'High Protein'],
    185, 21, 3.8, 9.5, 0.8,
    0.7, 490, 2.8, 'pak_custom', 'computed', 8
  ) RETURNING id INTO v_food_id;

  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 skewer (80g)', '1 چکن سیخ کباب', 80, true);
  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '2 skewers (160g)', '2 کباب', 160, false);

  -- Dish: Peshawari Chapli Kebab (Beef Fried)
  INSERT INTO core.foods (
    name, name_ur, category, cuisine_tags,
    kcal_100g, protein_100g, carb_100g, fat_100g, fibre_100g,
    sugar_100g, sodium_mg_100g, sat_fat_100g, source, verified_by, oil_added_g
  ) VALUES (
    'Peshawari Chapli Kebab (Beef Fried)', 'پشاوری چپلی کباب', 'Barbecue & Grills', ARRAY['Pakistani', 'Peshawar', 'Street Food'],
    280, 16.5, 5.5, 21.5, 1.1,
    1, 540, 7.8, 'pak_custom', 'computed', 18
  ) RETURNING id INTO v_food_id;

  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 medium chapli kebab (120g)', '1 درمیانہ چپلی کباب', 120, true);
  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 large bazaar chapli kebab (180g)', '1 بڑا چپلی کباب', 180, false);

  -- Dish: Chicken Reshmi Kebab
  INSERT INTO core.foods (
    name, name_ur, category, cuisine_tags,
    kcal_100g, protein_100g, carb_100g, fat_100g, fibre_100g,
    sugar_100g, sodium_mg_100g, sat_fat_100g, source, verified_by, oil_added_g
  ) VALUES (
    'Chicken Reshmi Kebab', 'چکن ریشمی کباب', 'Barbecue & Grills', ARRAY['Pakistani', 'BBQ'],
    205, 20, 3.2, 12.5, 0.5,
    0.8, 470, 4.8, 'pak_custom', 'computed', 10
  ) RETURNING id INTO v_food_id;

  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 skewer (80g)', '1 ریشمی کباب', 80, true);

  -- Dish: Beef Bihari Boti
  INSERT INTO core.foods (
    name, name_ur, category, cuisine_tags,
    kcal_100g, protein_100g, carb_100g, fat_100g, fibre_100g,
    sugar_100g, sodium_mg_100g, sat_fat_100g, source, verified_by, oil_added_g
  ) VALUES (
    'Beef Bihari Boti', 'بیف بہاری بوٹی', 'Barbecue & Grills', ARRAY['Pakistani', 'Karachi', 'BBQ'],
    230, 22.5, 2.5, 14.5, 0.5,
    0.6, 520, 5.8, 'pak_custom', 'computed', 12
  ) RETURNING id INTO v_food_id;

  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 plate bihari boti (150g)', '1 پلیٹ بہاری بوٹی', 150, true);

  -- Dish: Chicken Malai Boti
  INSERT INTO core.foods (
    name, name_ur, category, cuisine_tags,
    kcal_100g, protein_100g, carb_100g, fat_100g, fibre_100g,
    sugar_100g, sodium_mg_100g, sat_fat_100g, source, verified_by, oil_added_g
  ) VALUES (
    'Chicken Malai Boti', 'چکن ملائی بوٹی', 'Barbecue & Grills', ARRAY['Pakistani', 'BBQ', 'Mild'],
    215, 21, 2.8, 13.2, 0.3,
    0.9, 460, 5.2, 'pak_custom', 'computed', 10
  ) RETURNING id INTO v_food_id;

  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 plate (6 botis = 160g)', '1 پلیٹ ملائی بوٹی', 160, true);

  -- Dish: Aalo Palak (Potato & Spinach Curry)
  INSERT INTO core.foods (
    name, name_ur, category, cuisine_tags,
    kcal_100g, protein_100g, carb_100g, fat_100g, fibre_100g,
    sugar_100g, sodium_mg_100g, sat_fat_100g, source, verified_by, oil_added_g
  ) VALUES (
    'Aalo Palak (Potato & Spinach Curry)', 'آلو پالک', 'Vegetables & Sabzi', ARRAY['Pakistani', 'Vegetarian', 'Daily'],
    110, 3.2, 11.5, 6, 3,
    1.5, 340, 1.2, 'pak_custom', 'computed', 8
  ) RETURNING id INTO v_food_id;

  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 katori (150g)', '1 کٹوری آلو پالک', 150, true);

  -- Dish: Palak Gosht (Mutton with Spinach)
  INSERT INTO core.foods (
    name, name_ur, category, cuisine_tags,
    kcal_100g, protein_100g, carb_100g, fat_100g, fibre_100g,
    sugar_100g, sodium_mg_100g, sat_fat_100g, source, verified_by, oil_added_g
  ) VALUES (
    'Palak Gosht (Mutton with Spinach)', 'پالک گوشت', 'Vegetables & Sabzi', ARRAY['Pakistani', 'Home Cooking', 'Dawat'],
    175, 13.5, 4.5, 11.5, 2.5,
    1.2, 410, 4, 'pak_custom', 'computed', 14
  ) RETURNING id INTO v_food_id;

  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 standard serving (200g)', '1 سرونگ پالک گوشت', 200, true);

  -- Dish: Bhindi Masala (Fried Okra)
  INSERT INTO core.foods (
    name, name_ur, category, cuisine_tags,
    kcal_100g, protein_100g, carb_100g, fat_100g, fibre_100g,
    sugar_100g, sodium_mg_100g, sat_fat_100g, source, verified_by, oil_added_g
  ) VALUES (
    'Bhindi Masala (Fried Okra)', 'بھنڈی مصالحہ', 'Vegetables & Sabzi', ARRAY['Pakistani', 'Vegetarian', 'Daily'],
    120, 2.8, 9.5, 8, 3.2,
    2, 290, 1.5, 'pak_custom', 'computed', 12
  ) RETURNING id INTO v_food_id;

  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 katori (140g)', '1 کٹوری بھنڈی', 140, true);

  -- Dish: Aalo Gobi (Potato & Cauliflower)
  INSERT INTO core.foods (
    name, name_ur, category, cuisine_tags,
    kcal_100g, protein_100g, carb_100g, fat_100g, fibre_100g,
    sugar_100g, sodium_mg_100g, sat_fat_100g, source, verified_by, oil_added_g
  ) VALUES (
    'Aalo Gobi (Potato & Cauliflower)', 'آلو گوبھی', 'Vegetables & Sabzi', ARRAY['Pakistani', 'Vegetarian', 'Daily'],
    95, 2.5, 11, 4.8, 2.6,
    2.1, 310, 0.9, 'pak_custom', 'computed', 6
  ) RETURNING id INTO v_food_id;

  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 katori (150g)', '1 کٹوری آلو گوبھی', 150, true);

  -- Dish: Baingan Bharta (Roasted Eggplant)
  INSERT INTO core.foods (
    name, name_ur, category, cuisine_tags,
    kcal_100g, protein_100g, carb_100g, fat_100g, fibre_100g,
    sugar_100g, sodium_mg_100g, sat_fat_100g, source, verified_by, oil_added_g
  ) VALUES (
    'Baingan Bharta (Roasted Eggplant)', 'بینگن کا بھرتہ', 'Vegetables & Sabzi', ARRAY['Pakistani', 'Vegetarian', 'Daily'],
    85, 1.8, 7.5, 5.5, 3,
    3.2, 260, 0.9, 'pak_custom', 'computed', 8
  ) RETURNING id INTO v_food_id;

  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 katori (150g)', '1 کٹوری بھرتہ', 150, true);

  -- Dish: Karela Pyaz (Bitter Gourd Fry)
  INSERT INTO core.foods (
    name, name_ur, category, cuisine_tags,
    kcal_100g, protein_100g, carb_100g, fat_100g, fibre_100g,
    sugar_100g, sodium_mg_100g, sat_fat_100g, source, verified_by, oil_added_g
  ) VALUES (
    'Karela Pyaz (Bitter Gourd Fry)', 'کریلے پیاز', 'Vegetables & Sabzi', ARRAY['Pakistani', 'Vegetarian', 'Traditional'],
    115, 2, 9, 8.2, 3.5,
    3.5, 270, 1.4, 'pak_custom', 'computed', 12
  ) RETURNING id INTO v_food_id;

  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 katori (140g)', '1 کٹوری کریلے', 140, true);

  -- Dish: Karelay Gosht (Bitter Gourd with Meat)
  INSERT INTO core.foods (
    name, name_ur, category, cuisine_tags,
    kcal_100g, protein_100g, carb_100g, fat_100g, fibre_100g,
    sugar_100g, sodium_mg_100g, sat_fat_100g, source, verified_by, oil_added_g
  ) VALUES (
    'Karelay Gosht (Bitter Gourd with Meat)', 'کریلے گوشت', 'Vegetables & Sabzi', ARRAY['Pakistani', 'Traditional'],
    165, 11.5, 5.5, 11, 2.5,
    2.2, 380, 3.8, 'pak_custom', 'computed', 15
  ) RETURNING id INTO v_food_id;

  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 serving (180g)', '1 سرونگ کریلے گوشت', 180, true);

  -- Dish: Boiled Egg (Large)
  INSERT INTO core.foods (
    name, name_ur, category, cuisine_tags,
    kcal_100g, protein_100g, carb_100g, fat_100g, fibre_100g,
    sugar_100g, sodium_mg_100g, sat_fat_100g, source, verified_by, oil_added_g
  ) VALUES (
    'Boiled Egg (Large)', 'ابلا ہوا انڈا', 'Breakfast & Snacks', ARRAY['Pakistani', 'Breakfast', 'High Protein'],
    155, 12.6, 1.1, 10.6, 0,
    1.1, 124, 3.3, 'pak_custom', 'computed', 0
  ) RETURNING id INTO v_food_id;

  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 large egg (50g)', '1 انڈا', 50, true);
  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '2 large eggs (100g)', '2 انڈے', 100, false);

  -- Dish: Pakistani Omelette (Desi Pyaz Tamatar)
  INSERT INTO core.foods (
    name, name_ur, category, cuisine_tags,
    kcal_100g, protein_100g, carb_100g, fat_100g, fibre_100g,
    sugar_100g, sodium_mg_100g, sat_fat_100g, source, verified_by, oil_added_g
  ) VALUES (
    'Pakistani Omelette (Desi Pyaz Tamatar)', 'دیسی آملیٹ', 'Breakfast & Snacks', ARRAY['Pakistani', 'Breakfast', 'Nashta'],
    195, 11.2, 3.5, 15.2, 0.6,
    1.8, 340, 4.5, 'pak_custom', 'computed', 10
  ) RETURNING id INTO v_food_id;

  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '2-egg desi omelette (110g)', '2 انڈوں کا آملیٹ', 110, true);

  -- Dish: Anda Ghotala
  INSERT INTO core.foods (
    name, name_ur, category, cuisine_tags,
    kcal_100g, protein_100g, carb_100g, fat_100g, fibre_100g,
    sugar_100g, sodium_mg_100g, sat_fat_100g, source, verified_by, oil_added_g
  ) VALUES (
    'Anda Ghotala', 'انڈا گھوٹالہ', 'Breakfast & Snacks', ARRAY['Pakistani', 'Karachi', 'Dhaba'],
    210, 12.5, 4.8, 16, 1,
    2, 410, 5.2, 'pak_custom', 'computed', 14
  ) RETURNING id INTO v_food_id;

  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 plate anda ghotala (160g)', '1 پلیٹ انڈا گھوٹالہ', 160, true);

  -- Dish: Halwa (Suji Halwa for Halwa Puri)
  INSERT INTO core.foods (
    name, name_ur, category, cuisine_tags,
    kcal_100g, protein_100g, carb_100g, fat_100g, fibre_100g,
    sugar_100g, sodium_mg_100g, sat_fat_100g, source, verified_by, oil_added_g
  ) VALUES (
    'Halwa (Suji Halwa for Halwa Puri)', 'سوجی کا حلوہ', 'Breakfast & Snacks', ARRAY['Pakistani', 'Halwa Puri', 'Sweet'],
    360, 3.5, 52, 16, 1.2,
    38, 45, 8.5, 'pak_custom', 'computed', 15
  ) RETURNING id INTO v_food_id;

  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 katori halwa (100g)', '1 کٹوری حلوہ', 100, true);

  -- Dish: Samosa (Potato / Desi Aalo)
  INSERT INTO core.foods (
    name, name_ur, category, cuisine_tags,
    kcal_100g, protein_100g, carb_100g, fat_100g, fibre_100g,
    sugar_100g, sodium_mg_100g, sat_fat_100g, source, verified_by, oil_added_g
  ) VALUES (
    'Samosa (Potato / Desi Aalo)', 'آلو سموسہ', 'Breakfast & Snacks', ARRAY['Pakistani', 'Street Food', 'Snack'],
    260, 4.5, 32, 13, 2.8,
    1.5, 390, 3.2, 'pak_custom', 'computed', 12
  ) RETURNING id INTO v_food_id;

  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 standard samosa (75g)', '1 سموسہ', 75, true);
  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '2 samosas (150g)', '2 سموسے', 150, false);

  -- Dish: Pakora (Mixed Vegetable Fry)
  INSERT INTO core.foods (
    name, name_ur, category, cuisine_tags,
    kcal_100g, protein_100g, carb_100g, fat_100g, fibre_100g,
    sugar_100g, sodium_mg_100g, sat_fat_100g, source, verified_by, oil_added_g
  ) VALUES (
    'Pakora (Mixed Vegetable Fry)', 'مکس پکوڑے', 'Breakfast & Snacks', ARRAY['Pakistani', 'Ramzan', 'Rainy Day', 'Street Food'],
    290, 6.8, 28, 17, 4,
    2.2, 480, 3.8, 'pak_custom', 'computed', 18
  ) RETURNING id INTO v_food_id;

  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '4 pakoras (100g)', '4 پکوڑے', 100, true);
  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 small plate (150g)', '1 چھوٹی پلیٹ پکوڑے', 150, false);

  -- Dish: Shami Kebab (Beef & Chana Daal)
  INSERT INTO core.foods (
    name, name_ur, category, cuisine_tags,
    kcal_100g, protein_100g, carb_100g, fat_100g, fibre_100g,
    sugar_100g, sodium_mg_100g, sat_fat_100g, source, verified_by, oil_added_g
  ) VALUES (
    'Shami Kebab (Beef & Chana Daal)', 'شامی کباب', 'Breakfast & Snacks', ARRAY['Pakistani', 'Snack', 'Tea Time'],
    210, 16.5, 12, 10.8, 3.2,
    0.8, 450, 3.5, 'pak_custom', 'computed', 8
  ) RETURNING id INTO v_food_id;

  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 piece shami kebab (55g)', '1 شامی کباب', 55, true);
  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '2 pieces (110g)', '2 شامی کباب', 110, false);

  -- Dish: Bun Kabab (Karachi Street Style)
  INSERT INTO core.foods (
    name, name_ur, category, cuisine_tags,
    kcal_100g, protein_100g, carb_100g, fat_100g, fibre_100g,
    sugar_100g, sodium_mg_100g, sat_fat_100g, source, verified_by, oil_added_g
  ) VALUES (
    'Bun Kabab (Karachi Street Style)', 'بن کباب', 'Breakfast & Snacks', ARRAY['Pakistani', 'Karachi', 'Street Food'],
    220, 8.5, 28, 8.5, 2.2,
    4.5, 460, 2.2, 'pak_custom', 'computed', 10
  ) RETURNING id INTO v_food_id;

  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 standard bun kabab (160g)', '1 بن کباب', 160, true);

  -- Dish: Doodh Patti Chai (with Sugar)
  INSERT INTO core.foods (
    name, name_ur, category, cuisine_tags,
    kcal_100g, protein_100g, carb_100g, fat_100g, fibre_100g,
    sugar_100g, sodium_mg_100g, sat_fat_100g, source, verified_by, oil_added_g
  ) VALUES (
    'Doodh Patti Chai (with Sugar)', 'دودھ پتی چائے (میٹھی)', 'Beverages', ARRAY['Pakistani', 'Desi', 'Daily', 'Tea'],
    72, 2.8, 8.8, 2.9, 0,
    8.5, 40, 1.8, 'pak_custom', 'computed', 0
  ) RETURNING id INTO v_food_id;

  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 standard cup (150ml)', '1 کپ چائے', 150, true);
  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 dhaba mug / dhoodh patti glass (220ml)', '1 مگ دودھ پتی', 220, false);

  -- Dish: Karak Chai / Black Tea with Milk (No Sugar)
  INSERT INTO core.foods (
    name, name_ur, category, cuisine_tags,
    kcal_100g, protein_100g, carb_100g, fat_100g, fibre_100g,
    sugar_100g, sodium_mg_100g, sat_fat_100g, source, verified_by, oil_added_g
  ) VALUES (
    'Karak Chai / Black Tea with Milk (No Sugar)', 'سادہ دودھ والی چائے (بغیر چینی)', 'Beverages', ARRAY['Pakistani', 'Daily', 'Diet Friendly'],
    35, 2.1, 3.2, 1.6, 0,
    3.2, 35, 1, 'pak_custom', 'computed', 0
  ) RETURNING id INTO v_food_id;

  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 cup (150ml)', '1 کپ بغیر چینی', 150, true);

  -- Dish: Sulaimani / Green Tea (Kahwah)
  INSERT INTO core.foods (
    name, name_ur, category, cuisine_tags,
    kcal_100g, protein_100g, carb_100g, fat_100g, fibre_100g,
    sugar_100g, sodium_mg_100g, sat_fat_100g, source, verified_by, oil_added_g
  ) VALUES (
    'Sulaimani / Green Tea (Kahwah)', 'پشاوری قہوہ / سبز چائے', 'Beverages', ARRAY['Pakistani', 'Peshawari', 'Post Meal'],
    2, 0.1, 0.4, 0, 0,
    0, 2, 0, 'pak_custom', 'computed', 0
  ) RETURNING id INTO v_food_id;

  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 cup kahwah (150ml)', '1 کپ قہوہ', 150, true);

  -- Dish: Sweet Lassi (Meethi Lassi)
  INSERT INTO core.foods (
    name, name_ur, category, cuisine_tags,
    kcal_100g, protein_100g, carb_100g, fat_100g, fibre_100g,
    sugar_100g, sodium_mg_100g, sat_fat_100g, source, verified_by, oil_added_g
  ) VALUES (
    'Sweet Lassi (Meethi Lassi)', 'میٹھی لسی', 'Beverages', ARRAY['Pakistani', 'Punjabi', 'Summer'],
    95, 3.2, 14.5, 2.8, 0,
    14, 50, 1.8, 'pak_custom', 'computed', 0
  ) RETURNING id INTO v_food_id;

  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 standard glass (250ml)', '1 گلاس میٹھی لسی', 250, true);
  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 large punjabi dahi glass (400ml)', '1 بڑا گلاس', 400, false);

  -- Dish: Namkeen Lassi (Salted Mint Lassi)
  INSERT INTO core.foods (
    name, name_ur, category, cuisine_tags,
    kcal_100g, protein_100g, carb_100g, fat_100g, fibre_100g,
    sugar_100g, sodium_mg_100g, sat_fat_100g, source, verified_by, oil_added_g
  ) VALUES (
    'Namkeen Lassi (Salted Mint Lassi)', 'نمکین لسی', 'Beverages', ARRAY['Pakistani', 'Summer', 'Digestive'],
    45, 3, 3.8, 2, 0.1,
    3.5, 240, 1.2, 'pak_custom', 'computed', 0
  ) RETURNING id INTO v_food_id;

  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 standard glass (250ml)', '1 گلاس نمکین لسی', 250, true);

  -- Dish: Kheer (Rice Pudding with Dry Fruits)
  INSERT INTO core.foods (
    name, name_ur, category, cuisine_tags,
    kcal_100g, protein_100g, carb_100g, fat_100g, fibre_100g,
    sugar_100g, sodium_mg_100g, sat_fat_100g, source, verified_by, oil_added_g
  ) VALUES (
    'Kheer (Rice Pudding with Dry Fruits)', 'کھیر', 'Desserts & Sweets', ARRAY['Pakistani', 'Dawat', 'Traditional'],
    175, 4.5, 26, 6.2, 0.6,
    22, 60, 3.8, 'pak_custom', 'computed', 0
  ) RETURNING id INTO v_food_id;

  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 katori (120g)', '1 پیالی کھیر', 120, true);

  -- Dish: Gulab Jamun
  INSERT INTO core.foods (
    name, name_ur, category, cuisine_tags,
    kcal_100g, protein_100g, carb_100g, fat_100g, fibre_100g,
    sugar_100g, sodium_mg_100g, sat_fat_100g, source, verified_by, oil_added_g
  ) VALUES (
    'Gulab Jamun', 'گلاب جامن', 'Desserts & Sweets', ARRAY['Pakistani', 'Mithai', 'Dawat'],
    380, 5.5, 58, 15, 0.8,
    45, 110, 7.2, 'pak_custom', 'computed', 12
  ) RETURNING id INTO v_food_id;

  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 standard gulab jamun (50g)', '1 گلاب جامن', 50, true);
  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '2 gulab jamuns (100g)', '2 گلاب جامن', 100, false);

  -- Dish: Jalebi (Desi Ghee Fried)
  INSERT INTO core.foods (
    name, name_ur, category, cuisine_tags,
    kcal_100g, protein_100g, carb_100g, fat_100g, fibre_100g,
    sugar_100g, sodium_mg_100g, sat_fat_100g, source, verified_by, oil_added_g
  ) VALUES (
    'Jalebi (Desi Ghee Fried)', 'جلیبی', 'Desserts & Sweets', ARRAY['Pakistani', 'Mithai', 'Nashta'],
    390, 2.8, 72, 10.5, 0.4,
    56, 80, 5.8, 'pak_custom', 'computed', 14
  ) RETURNING id INTO v_food_id;

  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '2 pieces jalebi (60g)', '2 جلیبیاں', 60, true);
  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '100g serving', '100 گرام جلیبی', 100, false);

  -- Dish: Zarda (Sweet Flavoured Rice)
  INSERT INTO core.foods (
    name, name_ur, category, cuisine_tags,
    kcal_100g, protein_100g, carb_100g, fat_100g, fibre_100g,
    sugar_100g, sodium_mg_100g, sat_fat_100g, source, verified_by, oil_added_g
  ) VALUES (
    'Zarda (Sweet Flavoured Rice)', 'زردہ', 'Desserts & Sweets', ARRAY['Pakistani', 'Dawat', 'Shadi'],
    260, 3.2, 48, 6.5, 0.8,
    32, 45, 3.5, 'pak_custom', 'computed', 8
  ) RETURNING id INTO v_food_id;

  INSERT INTO core.food_servings (food_id, label, label_ur, grams, is_default)
  VALUES (v_food_id, '1 small plate (150g)', '1 پلیٹ زردہ', 150, true);

END $$;