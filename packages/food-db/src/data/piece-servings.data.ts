import { FoodServingItem, NormalizedFood } from '../types.js';

/**
 * Per-piece servings for countable foods.
 *
 * 542 staples shipped with one serving, "1 standard serving (200g)". For a
 * curry that is a fair katori; for a countable food it is wrong by several
 * times — one tap on Gulab Jamun logged 200g (≈700 kcal) when a piece is ~45g,
 * and "4 egg whites" against a 200g serving became 800g. Each food below gets
 * a piece serving as its default, with the old 200g kept as a second choice.
 *
 * Weights are typical Pakistani portion sizes (estimates, not weighed per
 * vendor). Keyed by exact name so a renamed food fails the coverage test
 * rather than silently losing its piece serving.
 */
const PIECE_SERVINGS: Readonly<Record<string, { label: string; grams: number }>> = {
  // Breads
  'Aloo Paratha (Stuffed Potato)': { label: '1 paratha', grams: 150 },
  'Gobi Paratha (Cauliflower Stuffed)': { label: '1 paratha', grams: 150 },
  'Mooli Paratha (Radish Stuffed)': { label: '1 paratha', grams: 150 },
  'Keema Paratha (Beef Stuffed)': { label: '1 paratha', grams: 150 },
  'Cheese Paratha': { label: '1 paratha', grams: 140 },
  'Methi Paratha (Fenugreek Herb)': { label: '1 paratha', grams: 110 },
  'Meetha Paratha (Sugar Stuffed)': { label: '1 paratha', grams: 120 },
  'Lachha Paratha (Flaky Layered)': { label: '1 paratha', grams: 100 },
  'Tandoori Paratha': { label: '1 paratha', grams: 100 },
  'Feteer Paratha (Layered Bread)': { label: '1 paratha', grams: 120 },
  'Tandoori Kulcha (Plain)': { label: '1 kulcha', grams: 90 },
  'Roghani Kulcha (with Sesame Seeds & Butter)': { label: '1 kulcha', grams: 100 },
  'Khameeri Roti (Leavened Tandoori Flatbread)': { label: '1 roti', grams: 100 },
  'Makki Ki Roti (Cornmeal Flatbread)': { label: '1 roti', grams: 80 },
  'Besan Ki Roti (Gram Flour Flatbread)': { label: '1 roti', grams: 70 },
  'French Toast (Meetha Toast)': { label: '1 slice', grams: 65 },

  // Eggs
  'Half Fry Egg (Sunny Side Up in Ghee)': { label: '1 egg', grams: 50 },
  'Full Fry Crispy Fried Egg': { label: '1 egg', grams: 50 },
  'Anda Ghotala (Karachi Egg Scramble)': { label: '2-egg portion', grams: 120 },
  'Khagina (Egg Bhurji)': { label: '2-egg portion', grams: 120 },
  'Nargisi Kofta (with Hard Boiled Egg inside)': { label: '1 kofta', grams: 120 },

  // Kebabs (per piece / skewer)
  'Beef Seekh Kebab / Kabab (Restaurant Style)': { label: '1 seekh', grams: 60 },
  'Chicken Seekh Kabab': { label: '1 seekh', grams: 60 },
  'Mutton Seekh Kabab': { label: '1 seekh', grams: 60 },
  'Afghani Seekh Kabab': { label: '1 seekh', grams: 60 },
  'Peshawari Chapli Kebab / Kabab (Beef)': { label: '1 chapli kabab', grams: 120 },
  'Chicken Chapli Kabab': { label: '1 chapli kabab', grams: 110 },
  'Shami Kabab (Beef & Daal Chana)': { label: '1 shami kabab', grams: 50 },
  'Chicken Shami Kabab': { label: '1 shami kabab', grams: 50 },
  'Chicken Reshmi Kabab': { label: '1 skewer', grams: 80 },
  'Gola Kabab (Beef)': { label: '1 skewer', grams: 80 },
  'Mutton Kabab': { label: '1 skewer', grams: 80 },
  'Beef Kabab': { label: '1 skewer', grams: 80 },
  'Chicken Kabab': { label: '1 skewer', grams: 80 },
  'Kofta Kabab Skewer': { label: '1 skewer', grams: 80 },
  'Mutton Bihari Kabab': { label: '1 skewer', grams: 80 },
  'Chicken Tangdi Kabab': { label: '1 drumstick', grams: 120 },
  'Kalmi Kabab (Stuffed Drumstick)': { label: '1 piece', grams: 130 },

  // Street food & snacks
  'Aloo Samosa (Crispy Fried Potato)': { label: '1 samosa', grams: 80 },
  'Keema Samosa (Beef Mince Crispy)': { label: '1 samosa', grams: 60 },
  'Chicken Samosa': { label: '1 samosa', grams: 60 },
  'Mix Vegetable Pakora': { label: '1 pakora', grams: 20 },
  'Palak Pakora (Spinach Crispy)': { label: '1 pakora', grams: 15 },
  'Aloo Pakora (Sliced Potato Fritter)': { label: '1 pakora', grams: 20 },
  'Pyaaz Pakora (Onion Bhajji)': { label: '1 pakora', grams: 20 },
  'Mirch Pakora (Green Chilli Stuffed)': { label: '1 pakora', grams: 45 },
  'Paneer Pakora (Cottage Cheese)': { label: '1 pakora', grams: 30 },
  'Bread Pakora with Potato Stuffing': { label: '1 piece', grams: 90 },
  'Fish Pakora (Fried Fish Nuggets)': { label: '1 piece', grams: 25 },
  'Aloo Tikki (Street Style Potato Cutlet)': { label: '1 tikki', grams: 70 },
  'Chicken Cutlet (Bakery Style)': { label: '1 cutlet', grams: 80 },
  'Beef Keema Cutlet': { label: '1 cutlet', grams: 70 },
  'Vegetable Spring Roll (Crispy Fried)': { label: '1 roll', grams: 50 },
  'Chicken Spring Roll': { label: '1 roll', grams: 60 },
  'Gol Gappay / Pani Puri (Khatta Paani)': { label: '1 gol gappa', grams: 15 },
  'Bun Kabab (Daal Anda - Karachi)': { label: '1 bun kabab', grams: 150 },
  'Bun Kabab (Beef Patty with Egg Dip)': { label: '1 bun kabab', grams: 160 },
  'Chicken Shami Bun Kabab': { label: '1 bun kabab', grams: 150 },

  // Bakery
  'Rusk / Cake Rusk (Dunking Biscuit for Chai)': { label: '1 rusk', grams: 15 },
  'Bakery Zeera Biscuit (Cumin Tea Biscuit)': { label: '1 biscuit', grams: 10 },
  'Finger Biscuit (Bakery Ladyfinger)': { label: '1 biscuit', grams: 8 },
  'Bakery Fruit Cake (Slice)': { label: '1 slice', grams: 60 },
  'Bakery Plain Sponge Cake (Slice)': { label: '1 slice', grams: 50 },
  'Chocolate Donut (Bakery Glazed)': { label: '1 donut', grams: 70 },
  'Bakery Cream Roll (Puff Pastry with Vanilla Cream)': { label: '1 cream roll', grams: 50 },
  'Bakery Pizza Roll (Spiced Chicken Roll)': { label: '1 roll', grams: 90 },
  'Chicken Mayo Garlic Roll (Bakery Style)': { label: '1 roll', grams: 90 },
  'Beef Hunter Bun (Mini Burger)': { label: '1 bun', grams: 100 },
  'Hot Dog (Chicken Sausage in Bun with Mustard)': { label: '1 hot dog', grams: 150 },
  'Chicken Tikka Pizza (Slice)': { label: '1 slice', grams: 110 },
  'Fajita Sicilian Pizza (Slice)': { label: '1 slice', grams: 110 },
  'Malai Boti Pizza (Slice)': { label: '1 slice', grams: 110 },
  'Four Cheese Lover Pizza (Slice)': { label: '1 slice', grams: 110 },

  // Sweets
  'Gulab Jamun (in Warm Sugar Syrup)': { label: '1 gulab jamun', grams: 45 },
  'Kala Jamun (Deep Dark Fried Gulab Jamun)': { label: '1 kala jamun', grams: 50 },
  'Jalebi (Crispy Pretzel in Sugar Syrup)': { label: '1 jalebi', grams: 30 },
  'Ghee Jalebi (Amritsari)': { label: '1 jalebi', grams: 30 },
  'Plain Khoya Barfi': { label: '1 piece', grams: 30 },
  'Pista Barfi (Pistachio Khoya Sweet)': { label: '1 piece', grams: 30 },
  'Chocolate Barfi': { label: '1 piece', grams: 30 },
  'Coconut Barfi (Naryal Barfi)': { label: '1 piece', grams: 30 },
  'Besan Ka Ladoo (Gram Flour Sweet Ball with Ghee)': { label: '1 ladoo', grams: 40 },
  'Motichoor Ladoo (Fine Pearl Drops Sweet)': { label: '1 ladoo', grams: 40 },
  'Gondh Ka Ladoo (Winter Edible Gum & Nut Tonic)': { label: '1 ladoo', grams: 40 },
  'Khoya Til Ladoo (Sesame Seed Sweet)': { label: '1 ladoo', grams: 30 },
  'Rasgulla (Spongy Cottage Cheese in Sugar Syrup)': { label: '1 rasgulla', grams: 50 },
  'Mango Kulfi on Stick': { label: '1 kulfi', grams: 70 },
};

export const PIECE_SERVING_FOOD_NAMES = Object.keys(PIECE_SERVINGS);

/**
 * The food with its piece serving first and default; the generic serving it
 * had stays as a non-default second choice. Foods not in the table, or that
 * already define a piece serving, are returned unchanged.
 */
export function withPieceServing(food: NormalizedFood): NormalizedFood {
  const piece = PIECE_SERVINGS[food.name];
  if (!piece) return food;

  const pieceServing: FoodServingItem = {
    label: `${piece.label} (${piece.grams}g)`,
    grams: piece.grams,
    isDefault: true,
  };
  return {
    ...food,
    servings: [
      pieceServing,
      ...food.servings.map((s) => ({ ...s, isDefault: false })),
    ],
  };
}
