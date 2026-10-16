/**
 * Foods that were second copies of a dish already in the catalogue, mapped to
 * the entry that replaces each one.
 *
 * Most are the `ghar_expanded_*` home-menu rows: re-entries of staples that
 * already exist, filed under "Pakistani Fast Food" and carrying roughly half
 * the staple's calories (Palak Gosht at 84 kcal/100g against 174), so a user
 * saw the same dish twice with two different answers. The rest are generic
 * restaurant-menu rows ("Lassi Namkeen", "Anda (fried)") repeating a staple or
 * a Diet & Basics food.
 *
 * Retired rather than deleted from their source files: ids are assigned by
 * position for foods without one, so cutting rows would renumber everything
 * after them and break the ids in users' saved presets. They are filtered out
 * after ids are assigned, and `resolveFoodId` redirects a saved id to its
 * replacement. Legitimate variants stay: chest vs leg piece, Lahori vs
 * Shinwari, sugar levels, and Diet & Basics "Low Oil" / "No Sugar" versions.
 */
export const RETIRED_DUPLICATE_IDS: Readonly<Record<string, string>> = {
  // Curries & karahi
  ghar_expanded_2: 'pak_food_187', // Aloo Gosht Shorba → Aloo Gosht (Mutton Shorba)
  ghar_expanded_3: 'pak_food_199', // Palak Gosht
  ghar_expanded_4: 'pak_food_58', // Chicken White Karahi
  ghar_expanded_5: 'pak_food_56', // Murgh Karahi → Chicken Karahi
  ghar_expanded_6: 'pak_food_205', // Bhindi Gosht
  ghar_expanded_7: 'pak_food_202', // Karela Gosht
  ghar_expanded_8: 'pak_food_193', // Kofta Curry
  ghar_expanded_10: 'pak_food_186', // Mutton Kunna → Kunna Gosht
  ghar_expanded_12: 'pak_food_196', // Keema Matar → Matar Keema
  ghar_expanded_13: 'pak_food_195', // Keema Aloo → Aloo Keema
  ghar_expanded_14: 'pak_food_67', // Chicken Jalfrezi
  ghar_expanded_16: 'pak_food_71', // Maghaz Masala
  ghar_expanded_17: 'pak_food_232', // Anda Ghotala
  ghar_expanded_19: 'pak_food_64', // Chicken Makhni Handi
  ghar_expanded_20: 'pak_food_195', // Aloo Keema Bhuna → Aloo Keema
  ghar_expanded_47: 'pak_food_230', // Chana Salan → Lahori Cholay
  pak_food_192: 'pak_food_212', // White Shadi Korma (Chicken) → Chicken White Korma

  // Daal & sabzi
  ghar_expanded_15: 'pak_food_358', // Sarson Ka Saag
  ghar_expanded_22: 'pak_food_339', // Daal Chana Tarka
  ghar_expanded_23: 'pak_food_338', // Daal Mash Fry
  ghar_expanded_24: 'pak_food_360', // Karela Pyaz Masala
  ghar_expanded_25: 'pak_food_347', // Bhindi Masala
  ghar_expanded_26: 'pak_food_350', // Aloo Baingan
  ghar_expanded_28: 'pak_food_349', // Baingan Ka Bharta
  ghar_expanded_29: 'pak_food_354', // Aloo Palak
  ghar_expanded_30: 'pak_food_365', // Lauki Chana Daal
  ghar_expanded_33: 'pak_food_355', // Shimla Mirch Aloo → Aloo Shimla Mirch
  ghar_expanded_34: 'pak_food_366', // Lobia Curry
  pak_food_613: 'pak_food_338', // Daal Mash (1 plate) → Daal Mash Fry

  // Rice
  ghar_expanded_36: 'pak_food_123', // Sindhi Chicken Biryani → Sindhi Biryani
  ghar_expanded_37: 'pak_food_132', // Chana Pulao
  ghar_expanded_38: 'pak_food_133', // Matar Pulao
  ghar_expanded_39: 'pak_food_127', // Chicken Yakhni Pulao
  ghar_expanded_40: 'pak_food_134', // Daal Chawal Plate → Daal Chawal Combo
  pak_food_597: 'pak_food_134', // Daal Chawal → Daal Chawal Combo
  ghar_expanded_41: 'pak_food_136', // Tahiri → Aloo Tahiri
  ghar_expanded_42: 'pak_food_135', // Moong Daal Khichdi
  ghar_expanded_43: 'pak_food_138', // Zeera Rice
  ghar_expanded_44: 'pak_food_137', // Steamed Basmati → Plain Boiled Basmati
  ghar_expanded_45: 'pak_food_126', // Mutton Pulao → Mutton Yakhni Pulao
  pak_food_596: 'pak_food_122', // Chicken Biryani

  // Breads & breakfast
  ghar_expanded_46: 'pak_food_612', // Halwa Puri Platter → Halwa Puri
  ghar_expanded_49: 'pak_food_236', // Aloo Paratha
  ghar_expanded_50: 'pak_food_238', // Mooli Paratha
  ghar_expanded_51: 'pak_food_239', // Qeema Paratha → Keema Paratha
  ghar_expanded_52: 'diet_egg_5', // Omelette (Onion Tomato Chilli) → Masala Omelette
  ghar_expanded_54: 'pak_food_233', // Khagina
  pak_food_254: 'diet_basic_1', // Hard Boiled Egg (200g serving) → Boiled Egg (Whole)
  ghar_expanded_55: 'pak_food_241', // Lachha Paratha
  ghar_expanded_56: 'pak_food_243', // Meetha Paratha
  ghar_expanded_57: 'pak_food_226', // Sada Tawa Roti → Roti / Chapati
  ghar_expanded_59: 'pak_food_359', // Makki Ki Roti
  ghar_expanded_60: 'diet_grain_4', // Bajre Ki Roti → Bajra Roti
  ghar_expanded_61: 'pak_food_257', // Besan Ki Roti
  ghar_expanded_62: 'pak_food_267', // Khameeri Roti
  ghar_expanded_65: 'pak_food_272', // Tandoori Paratha
  ghar_expanded_66: 'pak_food_228', // Crispy Puri → Puri
  pak_food_594: 'diet_basic_3', // Anda (fried) → Fried Egg
  pak_food_595: 'pak_food_235', // Paratha (plain) → Plain Paratha
  pak_food_598: 'pak_food_226', // Roti (Whole Wheat) → Roti / Chapati

  // Drinks
  ghar_expanded_67: 'pak_food_488', // Karak Doodh Patti Chai
  ghar_expanded_69: 'pak_food_498', // Adrak Wali Chai → Ginger Tea
  ghar_expanded_70: 'pak_food_494', // Gur Wali Chai → Gur Chai (Jaggery Village Tea)
  ghar_expanded_71: 'pak_food_495', // Sulemani Qahwa → Sulaimani Chai
  ghar_expanded_72: 'diet_bev_14', // Namkeen Lassi → Salted Lassi
  pak_food_249: 'diet_bev_14', // Salted Lassi (Namkeen) → Salted Lassi
  ghar_expanded_73: 'pak_food_248', // Meethi Lassi with Malai → Sweet Lassi
  ghar_expanded_74: 'pak_food_508', // Sattu Sharbat (Namkeen) → Sattu Drink (Savory)
  ghar_expanded_75: 'pak_food_510', // Imli Aloo Bukhara Sharbat
  ghar_expanded_76: 'pak_food_501', // Rooh Afza Milk → Doodh Rooh Afza
  pak_food_588: 'pak_food_489', // Doodh Patti → Doodh Patti Chai
  pak_food_590: 'diet_bev_2', // Green Tea / Qahwa → Green Tea (No Sugar)
  pak_food_591: 'diet_bev_12', // Coffee (doodh wali) → Coffee with Milk & Sugar
  pak_food_592: 'pak_food_248', // Lassi Meethi → Sweet Lassi
  pak_food_593: 'diet_bev_14', // Lassi Namkeen → Salted Lassi
  pak_food_611: 'pak_food_488', // Karak Chai → Karak Doodh Patti Chai

  // Sweets
  ghar_expanded_78: 'pak_food_229', // Suji Ka Halwa
  ghar_expanded_79: 'pak_food_451', // Gajar Ka Halwa
  ghar_expanded_80: 'pak_food_449', // Kheer
  ghar_expanded_81: 'pak_food_161', // Zarda
  ghar_expanded_84: 'pak_food_450', // Firni
  ghar_expanded_85: 'pak_food_455', // Shahi Tukray
  ghar_expanded_86: 'pak_food_477', // Trifle

  // Staples repeating a Diet & Basics food of the same name
  pak_food_20: 'diet_pk_5', // Fish Tikka
  pak_food_298: 'diet_salad_8', // Chana Chaat
  pak_food_321: 'diet_soup_2', // Chicken Corn Soup
  pak_food_325: 'diet_salad_7', // Kachumber Salad
};

/**
 * The id a saved reference should resolve to: itself, or the replacement for
 * a retired duplicate. Follows chains so a later retirement of a replacement
 * still lands on a live food.
 */
export function resolveFoodId(id: string): string {
  let current = id;
  const seen = new Set<string>();
  while (RETIRED_DUPLICATE_IDS[current] && !seen.has(current)) {
    seen.add(current);
    current = RETIRED_DUPLICATE_IDS[current];
  }
  return current;
}
