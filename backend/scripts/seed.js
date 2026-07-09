const bcrypt = require('bcryptjs');
const pool = require('../config/db');

const RESTAURANTS = [
  {
    name: 'Spice Garden',
    description: 'Authentic Indian flavors with a modern twist. Tandoor specials and vibrant curries.',
    address: '42 MG Road',
    city: 'Bangalore',
    cuisine_type: 'Indian',
    theme_color: 'sunset',
    emoji: '🌶️',
    rating: 4.8,
    price_range: '$$',
    opening_time: '11:00',
    closing_time: '23:00',
    tables: [
      { n: 1, cap: 2, loc: 'Window Booth', type: 'booth', vip: false, x: 60, y: 80 },
      { n: 2, cap: 4, loc: 'Main Hall', type: 'standard', vip: false, x: 180, y: 100 },
      { n: 3, cap: 4, loc: 'Main Hall', type: 'standard', vip: false, x: 300, y: 100 },
      { n: 4, cap: 6, loc: 'Family Section', type: 'standard', vip: false, x: 420, y: 120 },
      { n: 5, cap: 8, loc: 'Private Room', type: 'private', vip: true, x: 550, y: 80 },
      { n: 6, cap: 2, loc: 'Bar Counter', type: 'bar', vip: false, x: 100, y: 280 },
      { n: 7, cap: 4, loc: 'Terrace', type: 'outdoor', vip: false, x: 250, y: 320 },
      { n: 8, cap: 6, loc: 'Terrace', type: 'outdoor', vip: false, x: 400, y: 320 },
      { n: 9, cap: 10, loc: 'Banquet', type: 'banquet', vip: true, x: 600, y: 280 },
      { n: 10, cap: 2, loc: 'Couples Corner', type: 'booth', vip: false, x: 60, y: 200 },
    ],
  },
  {
    name: 'Sakura Sushi House',
    description: 'Fresh omakase, sashimi, and handcrafted rolls in a zen-inspired setting.',
    address: '18 Sakura Lane',
    city: 'Mumbai',
    cuisine_type: 'Japanese',
    theme_color: 'cherry',
    emoji: '🍣',
    rating: 4.9,
    price_range: '$$$',
    opening_time: '12:00',
    closing_time: '22:30',
    tables: [
      { n: 1, cap: 2, loc: 'Sushi Bar', type: 'bar', vip: false, x: 80, y: 90 },
      { n: 2, cap: 2, loc: 'Sushi Bar', type: 'bar', vip: false, x: 160, y: 90 },
      { n: 3, cap: 4, loc: 'Tatami Room', type: 'standard', vip: false, x: 280, y: 110 },
      { n: 4, cap: 4, loc: 'Tatami Room', type: 'standard', vip: false, x: 380, y: 110 },
      { n: 6, cap: 6, loc: 'Garden View', type: 'outdoor', vip: false, x: 500, y: 130 },
      { n: 7, cap: 8, loc: 'VIP Lounge', type: 'private', vip: true, x: 620, y: 100 },
      { n: 8, cap: 2, loc: 'Window Seat', type: 'booth', vip: false, x: 90, y: 250 },
      { n: 9, cap: 4, loc: 'Main Floor', type: 'standard', vip: false, x: 220, y: 280 },
      { n: 10, cap: 4, loc: 'Main Floor', type: 'standard', vip: false, x: 340, y: 280 },
      { n: 11, cap: 12, loc: 'Chef Table', type: 'banquet', vip: true, x: 520, y: 300 },
    ],
  },
  {
    name: 'La Bella Italia',
    description: 'Wood-fired pizzas, handmade pasta, and fine Italian wines.',
    address: '7 Via Roma',
    city: 'Delhi',
    cuisine_type: 'Italian',
    theme_color: 'forest',
    emoji: '🍕',
    rating: 4.7,
    price_range: '$$',
    opening_time: '11:30',
    closing_time: '23:00',
    tables: [
      { n: 1, cap: 2, loc: 'Patio', type: 'outdoor', vip: false, x: 70, y: 70 },
      { n: 2, cap: 2, loc: 'Patio', type: 'outdoor', vip: false, x: 150, y: 70 },
      { n: 3, cap: 4, loc: 'Dining Room', type: 'standard', vip: false, x: 260, y: 100 },
      { n: 4, cap: 4, loc: 'Dining Room', type: 'standard', vip: false, x: 360, y: 100 },
      { n: 5, cap: 6, loc: 'Wine Cellar', type: 'private', vip: true, x: 480, y: 90 },
      { n: 6, cap: 8, loc: 'Grand Hall', type: 'banquet', vip: true, x: 600, y: 110 },
      { n: 7, cap: 2, loc: 'Corner Booth', type: 'booth', vip: false, x: 80, y: 220 },
      { n: 8, cap: 4, loc: 'Fireplace', type: 'standard', vip: false, x: 200, y: 260 },
      { n: 9, cap: 4, loc: 'Fireplace', type: 'standard', vip: false, x: 320, y: 260 },
      { n: 10, cap: 6, loc: 'Garden Terrace', type: 'outdoor', vip: false, x: 450, y: 300 },
    ],
  },
  {
    name: 'Ocean Blue Bistro',
    description: 'Coastal seafood, grilled catches, and sunset cocktails by the waterfront.',
    address: '99 Marine Drive',
    city: 'Chennai',
    cuisine_type: 'Seafood',
    theme_color: 'ocean',
    emoji: '🦞',
    rating: 4.6,
    price_range: '$$$',
    opening_time: '10:00',
    closing_time: '22:00',
    tables: [
      { n: 1, cap: 2, loc: 'Deck View', type: 'outdoor', vip: false, x: 90, y: 85 },
      { n: 2, cap: 2, loc: 'Deck View', type: 'outdoor', vip: false, x: 170, y: 85 },
      { n: 3, cap: 4, loc: 'Main Deck', type: 'standard', vip: false, x: 280, y: 105 },
      { n: 4, cap: 4, loc: 'Main Deck', type: 'standard', vip: false, x: 380, y: 105 },
      { n: 5, cap: 6, loc: 'Lighthouse Room', type: 'private', vip: true, x: 500, y: 95 },
      { n: 6, cap: 8, loc: 'Captain Suite', type: 'private', vip: true, x: 620, y: 115 },
      { n: 7, cap: 2, loc: 'Bar Rail', type: 'bar', vip: false, x: 100, y: 240 },
      { n: 8, cap: 4, loc: 'Indoor Lounge', type: 'standard', vip: false, x: 230, y: 270 },
      { n: 9, cap: 6, loc: 'Sunset Terrace', type: 'outdoor', vip: false, x: 400, y: 310 },
      { n: 10, cap: 10, loc: 'Event Pier', type: 'banquet', vip: true, x: 560, y: 290 },
      { n: 11, cap: 4, loc: 'Indoor Lounge', type: 'standard', vip: false, x: 330, y: 270 },
      { n: 12, cap: 2, loc: 'Nook', type: 'booth', vip: false, x: 70, y: 180 },
    ],
  },
  {
    name: 'Taco Fiesta',
    description: 'Bold Mexican street food, margaritas, and live mariachi on weekends.',
    address: '55 Fiesta Street',
    city: 'Hyderabad',
    cuisine_type: 'Mexican',
    theme_color: 'citrus',
    emoji: '🌮',
    rating: 4.5,
    price_range: '$',
    opening_time: '11:00',
    closing_time: '00:00',
    tables: [
      { n: 1, cap: 2, loc: 'Street Side', type: 'outdoor', vip: false, x: 75, y: 95 },
      { n: 2, cap: 4, loc: 'Colorful Hall', type: 'standard', vip: false, x: 200, y: 110 },
      { n: 3, cap: 4, loc: 'Colorful Hall', type: 'standard', vip: false, x: 310, y: 110 },
      { n: 4, cap: 6, loc: 'Party Pit', type: 'banquet', vip: false, x: 430, y: 130 },
      { n: 5, cap: 2, loc: 'Bar Stools', type: 'bar', vip: false, x: 120, y: 250 },
      { n: 6, cap: 4, loc: 'Rooftop', type: 'outdoor', vip: false, x: 280, y: 290 },
      { n: 7, cap: 8, loc: 'Fiesta Room', type: 'private', vip: true, x: 520, y: 100 },
      { n: 8, cap: 2, loc: 'Booth', type: 'booth', vip: false, x: 90, y: 190 },
    ],
  },
  {
    name: 'Golden Dragon',
    description: 'Classic Cantonese dim sum, Peking duck, and elegant tea service.',
    address: '33 Dragon Gate',
    city: 'Kolkata',
    cuisine_type: 'Chinese',
    theme_color: 'gold',
    emoji: '🥟',
    rating: 4.7,
    price_range: '$$',
    opening_time: '11:00',
    closing_time: '22:30',
    tables: [
      { n: 1, cap: 2, loc: 'Tea Room', type: 'standard', vip: false, x: 85, y: 88 },
      { n: 2, cap: 4, loc: 'Jade Hall', type: 'standard', vip: false, x: 210, y: 105 },
      { n: 3, cap: 4, loc: 'Jade Hall', type: 'standard', vip: false, x: 320, y: 105 },
      { n: 4, cap: 6, loc: 'Emperor Room', type: 'private', vip: true, x: 450, y: 95 },
      { n: 5, cap: 8, loc: 'Dragon Banquet', type: 'banquet', vip: true, x: 590, y: 115 },
      { n: 6, cap: 2, loc: 'Lantern Corner', type: 'booth', vip: false, x: 95, y: 230 },
      { n: 7, cap: 4, loc: 'Courtyard', type: 'outdoor', vip: false, x: 260, y: 285 },
      { n: 8, cap: 4, loc: 'Courtyard', type: 'outdoor', vip: false, x: 370, y: 285 },
      { n: 9, cap: 6, loc: 'Main Floor', type: 'standard', vip: false, x: 500, y: 270 },
      { n: 10, cap: 10, loc: 'Grand Ballroom', type: 'banquet', vip: true, x: 630, y: 300 },
    ],
  },
  {
    name: 'Le Petit Café',
    description: 'Parisian pastries, artisan coffee, and romantic candlelit dinners.',
    address: '12 Rue de Paris',
    city: 'Pune',
    cuisine_type: 'French',
    theme_color: 'lavender',
    emoji: '🥐',
    rating: 4.9,
    price_range: '$$$',
    opening_time: '08:00',
    closing_time: '21:00',
    tables: [
      { n: 1, cap: 2, loc: 'Window Nook', type: 'booth', vip: false, x: 70, y: 100 },
      { n: 2, cap: 2, loc: 'Window Nook', type: 'booth', vip: false, x: 155, y: 100 },
      { n: 3, cap: 2, loc: 'Bistro Bar', type: 'bar', vip: false, x: 250, y: 90 },
      { n: 4, cap: 4, loc: 'Salon', type: 'standard', vip: false, x: 360, y: 115 },
      { n: 5, cap: 4, loc: 'Salon', type: 'standard', vip: false, x: 460, y: 115 },
      { n: 6, cap: 6, loc: 'Garden', type: 'outdoor', vip: false, x: 580, y: 130 },
      { n: 7, cap: 2, loc: 'Reading Corner', type: 'standard', vip: false, x: 100, y: 250 },
      { n: 8, cap: 4, loc: 'Private Salon', type: 'private', vip: true, x: 300, y: 290 },
    ],
  },
  {
    name: 'Smoke & Ember BBQ',
    description: 'Slow-smoked brisket, ribs, and southern comfort in a rustic lodge.',
    address: '88 Hickory Road',
    city: 'Jaipur',
    cuisine_type: 'American BBQ',
    theme_color: 'ember',
    emoji: '🥩',
    rating: 4.6,
    price_range: '$$',
    opening_time: '12:00',
    closing_time: '23:30',
    tables: [
      { n: 1, cap: 4, loc: 'Pit Room', type: 'standard', vip: false, x: 100, y: 100 },
      { n: 2, cap: 4, loc: 'Pit Room', type: 'standard', vip: false, x: 220, y: 100 },
      { n: 3, cap: 6, loc: 'Lodge Hall', type: 'standard', vip: false, x: 350, y: 120 },
      { n: 4, cap: 8, loc: 'Smokehouse VIP', type: 'private', vip: true, x: 500, y: 95 },
      { n: 5, cap: 2, loc: 'Bar', type: 'bar', vip: false, x: 80, y: 260 },
      { n: 6, cap: 4, loc: 'Patio Grill', type: 'outdoor', vip: false, x: 240, y: 300 },
      { n: 7, cap: 6, loc: 'Patio Grill', type: 'outdoor', vip: false, x: 380, y: 300 },
      { n: 8, cap: 10, loc: 'Barn Banquet', type: 'banquet', vip: true, x: 550, y: 280 },
      { n: 9, cap: 2, loc: 'Corner Booth', type: 'booth', vip: false, x: 130, y: 190 },
      { n: 10, cap: 4, loc: 'Fire Pit', type: 'outdoor', vip: false, x: 450, y: 220 },
    ],
  },
  {
    name: 'Bombay Street Kitchen',
    description: 'Vibrant street food, chaat, vada pav, and Mumbai-style fast casual dining.',
    address: '21 Linking Road',
    city: 'Mumbai',
    cuisine_type: 'Street Food',
    theme_color: 'citrus',
    emoji: '🥘',
    rating: 4.4,
    price_range: '$',
    opening_time: '10:00',
    closing_time: '23:00',
    tables: [
      { n: 1, cap: 2, loc: 'Street Counter', type: 'bar', vip: false, x: 80, y: 90 },
      { n: 2, cap: 4, loc: 'Main Hall', type: 'standard', vip: false, x: 200, y: 110 },
      { n: 3, cap: 4, loc: 'Main Hall', type: 'standard', vip: false, x: 310, y: 110 },
      { n: 4, cap: 6, loc: 'Family Zone', type: 'standard', vip: false, x: 430, y: 130 },
      { n: 5, cap: 2, loc: 'Window', type: 'booth', vip: false, x: 90, y: 230 },
      { n: 6, cap: 4, loc: 'Rooftop', type: 'outdoor', vip: false, x: 260, y: 290 },
      { n: 7, cap: 8, loc: 'Party Room', type: 'banquet', vip: true, x: 520, y: 100 },
      { n: 8, cap: 2, loc: 'Corner', type: 'booth', vip: false, x: 120, y: 180 },
      { n: 9, cap: 4, loc: 'Rooftop', type: 'outdoor', vip: false, x: 380, y: 290 },
      { n: 10, cap: 6, loc: 'VIP Lounge', type: 'private', vip: true, x: 600, y: 120 },
      { n: 11, cap: 4, loc: 'Main Hall', type: 'standard', vip: false, x: 340, y: 110 },
      { n: 12, cap: 2, loc: 'Bar', type: 'bar', vip: false, x: 100, y: 280 },
    ],
  },
  {
    name: 'Royal Thali House',
    description: 'Unlimited thali spreads, Rajasthani delicacies, and royal dining experience.',
    address: '5 Palace Road',
    city: 'Jaipur',
    cuisine_type: 'Indian',
    theme_color: 'gold',
    emoji: '🍛',
    rating: 4.8,
    price_range: '$$',
    opening_time: '11:00',
    closing_time: '22:30',
    tables: [
      { n: 1, cap: 2, loc: 'Royal Nook', type: 'booth', vip: false, x: 70, y: 95 },
      { n: 2, cap: 4, loc: 'Durbar Hall', type: 'standard', vip: false, x: 210, y: 110 },
      { n: 3, cap: 4, loc: 'Durbar Hall', type: 'standard', vip: false, x: 320, y: 110 },
      { n: 4, cap: 6, loc: 'Maharaja Room', type: 'private', vip: true, x: 460, y: 95 },
      { n: 5, cap: 8, loc: 'Grand Banquet', type: 'banquet', vip: true, x: 600, y: 115 },
      { n: 6, cap: 2, loc: 'Courtyard', type: 'outdoor', vip: false, x: 100, y: 250 },
      { n: 7, cap: 4, loc: 'Courtyard', type: 'outdoor', vip: false, x: 240, y: 290 },
      { n: 8, cap: 4, loc: 'Inner Hall', type: 'standard', vip: false, x: 370, y: 270 },
      { n: 9, cap: 6, loc: 'Inner Hall', type: 'standard', vip: false, x: 500, y: 280 },
      { n: 10, cap: 10, loc: 'Celebration Hall', type: 'banquet', vip: true, x: 630, y: 300 },
    ],
  },
  {
    name: 'Neon Noodle Bar',
    description: 'Asian fusion ramen, dim sum, and bubble tea in a neon-lit modern space.',
    address: '14 Cyber Hub',
    city: 'Gurgaon',
    cuisine_type: 'Asian Fusion',
    theme_color: 'cherry',
    emoji: '🍜',
    rating: 4.6,
    price_range: '$$',
    opening_time: '11:30',
    closing_time: '23:30',
    tables: [
      { n: 1, cap: 2, loc: 'Ramen Bar', type: 'bar', vip: false, x: 85, y: 88 },
      { n: 2, cap: 2, loc: 'Ramen Bar', type: 'bar', vip: false, x: 165, y: 88 },
      { n: 3, cap: 4, loc: 'Neon Lounge', type: 'standard', vip: false, x: 280, y: 105 },
      { n: 4, cap: 4, loc: 'Neon Lounge', type: 'standard', vip: false, x: 385, y: 105 },
      { n: 5, cap: 6, loc: 'Private Pod', type: 'private', vip: true, x: 510, y: 95 },
      { n: 6, cap: 2, loc: 'Window Booth', type: 'booth', vip: false, x: 95, y: 235 },
      { n: 7, cap: 4, loc: 'Terrace', type: 'outdoor', vip: false, x: 260, y: 295 },
      { n: 8, cap: 4, loc: 'Terrace', type: 'outdoor', vip: false, x: 375, y: 295 },
      { n: 9, cap: 8, loc: 'Group Zone', type: 'banquet', vip: false, x: 530, y: 270 },
      { n: 10, cap: 2, loc: 'Counter', type: 'bar', vip: false, x: 110, y: 180 },
      { n: 11, cap: 4, loc: 'Neon Lounge', type: 'standard', vip: false, x: 440, y: 105 },
    ],
  },
  {
    name: 'Harvest & Vine',
    description: 'Farm-to-table organic cuisine, local wines, and seasonal tasting menus.',
    address: '9 Vineyard Lane',
    city: 'Bangalore',
    cuisine_type: 'Farm-to-Table',
    theme_color: 'forest',
    emoji: '🍷',
    rating: 4.9,
    price_range: '$$$',
    opening_time: '12:00',
    closing_time: '22:00',
    tables: [
      { n: 1, cap: 2, loc: 'Garden Patio', type: 'outdoor', vip: false, x: 75, y: 85 },
      { n: 2, cap: 2, loc: 'Garden Patio', type: 'outdoor', vip: false, x: 160, y: 85 },
      { n: 3, cap: 4, loc: 'Wine Room', type: 'standard', vip: false, x: 270, y: 105 },
      { n: 4, cap: 4, loc: 'Wine Room', type: 'standard', vip: false, x: 375, y: 105 },
      { n: 5, cap: 6, loc: 'Cellar Private', type: 'private', vip: true, x: 500, y: 90 },
      { n: 6, cap: 2, loc: 'Chef Counter', type: 'bar', vip: false, x: 90, y: 240 },
      { n: 7, cap: 4, loc: 'Greenhouse', type: 'outdoor', vip: false, x: 250, y: 300 },
      { n: 8, cap: 6, loc: 'Harvest Hall', type: 'standard', vip: false, x: 400, y: 280 },
      { n: 9, cap: 8, loc: 'Estate Banquet', type: 'banquet', vip: true, x: 580, y: 110 },
      { n: 10, cap: 2, loc: 'Reading Nook', type: 'booth', vip: false, x: 130, y: 190 },
      { n: 11, cap: 4, loc: 'Vineyard View', type: 'outdoor', vip: false, x: 470, y: 300 },
      { n: 12, cap: 4, loc: 'Wine Room', type: 'standard', vip: false, x: 330, y: 105 },
      { n: 13, cap: 10, loc: 'Grand Tasting', type: 'banquet', vip: true, x: 620, y: 290 },
    ],
  },
];

function makeStandardTables() {
  return [
    { n: 1, cap: 2, loc: 'Window Booth', type: 'booth', vip: false, x: 70, y: 90 },
    { n: 2, cap: 4, loc: 'Main Hall', type: 'standard', vip: false, x: 200, y: 110 },
    { n: 3, cap: 4, loc: 'Main Hall', type: 'standard', vip: false, x: 310, y: 110 },
    { n: 4, cap: 6, loc: 'Family Section', type: 'standard', vip: false, x: 430, y: 130 },
    { n: 5, cap: 8, loc: 'Private Room', type: 'private', vip: true, x: 560, y: 100 },
    { n: 6, cap: 2, loc: 'Bar Counter', type: 'bar', vip: false, x: 100, y: 260 },
    { n: 7, cap: 4, loc: 'Terrace', type: 'outdoor', vip: false, x: 280, y: 300 },
    { n: 8, cap: 6, loc: 'Garden', type: 'outdoor', vip: false, x: 450, y: 300 },
  ];
}

const INDIAN_STATE_RESTAURANTS = [
  { name: 'Coastal Andhra Kitchen', description: 'Spicy Andhra meals, seafood curries, and traditional banana-leaf thalis.', address: '12 Beach Road', city: 'Visakhapatnam', cuisine_type: 'Andhra', theme_color: 'sunset', emoji: '🐟', rating: 4.5, price_range: '$$', opening_time: '11:00', closing_time: '22:30' },
  { name: 'Himalayan Orchid', description: 'Northeastern flavors, momos, and organic hill-station cuisine.', address: '3 Ganga Market', city: 'Itanagar', cuisine_type: 'Northeastern', theme_color: 'forest', emoji: '🌸', rating: 4.4, price_range: '$$', opening_time: '10:00', closing_time: '21:30' },
  { name: 'Brahmaputra Spice House', description: 'Assamese fish tenga, pitha, and tea-garden inspired dishes.', address: '45 GS Road', city: 'Guwahati', cuisine_type: 'Assamese', theme_color: 'ocean', emoji: '🍵', rating: 4.6, price_range: '$$', opening_time: '11:00', closing_time: '22:00' },
  { name: 'Litti Chokha Corner', description: 'Authentic Bihari litti, sattu paratha, and rustic village-style meals.', address: '8 Fraser Road', city: 'Patna', cuisine_type: 'Bihari', theme_color: 'ember', emoji: '🫓', rating: 4.3, price_range: '$', opening_time: '10:00', closing_time: '22:00' },
  { name: 'Chhattisgarh Tribal Table', description: 'Forest-foraged ingredients, chila, and tribal rice specialties.', address: '22 Ring Road', city: 'Raipur', cuisine_type: 'Chhattisgarhi', theme_color: 'forest', emoji: '🌿', rating: 4.4, price_range: '$$', opening_time: '11:00', closing_time: '22:00' },
  { name: 'Goan Beach Shack', description: 'Fresh catch, vindaloo, bebinca, and sunset cocktails on the sand.', address: '1 Calangute Beach', city: 'Panaji', cuisine_type: 'Goan', theme_color: 'ocean', emoji: '🏖️', rating: 4.7, price_range: '$$', opening_time: '11:00', closing_time: '23:00' },
  { name: 'Gujarat Thali Palace', description: 'Unlimited Gujarati thali, dhokla, thepla, and festive sweets.', address: '17 CG Road', city: 'Ahmedabad', cuisine_type: 'Gujarati', theme_color: 'gold', emoji: '🥗', rating: 4.8, price_range: '$$', opening_time: '11:00', closing_time: '22:30' },
  { name: 'Haryana Haveli Dhaba', description: 'Punjabi-Haryanvi parathas, kadhi, and lassi in a haveli setting.', address: '5 Ambala Road', city: 'Ambala', cuisine_type: 'North Indian', theme_color: 'sunset', emoji: '🥛', rating: 4.5, price_range: '$', opening_time: '08:00', closing_time: '23:00' },
  { name: 'Shimla Snow View Café', description: 'Himachali siddu, trout, and warm apple pie with mountain views.', address: '9 Mall Road', city: 'Shimla', cuisine_type: 'Himachali', theme_color: 'lavender', emoji: '🏔️', rating: 4.6, price_range: '$$', opening_time: '09:00', closing_time: '21:00' },
  { name: 'Ranchi Tribal Kitchen', description: 'Jharkhandi handia-inspired platters, rice beer pairings, and tribal curries.', address: '14 Main Road', city: 'Ranchi', cuisine_type: 'Jharkhandi', theme_color: 'ember', emoji: '🍲', rating: 4.3, price_range: '$$', opening_time: '11:00', closing_time: '22:00' },
  { name: 'Kerala Backwater Bistro', description: 'Appam, stew, karimeen pollichathu, and coconut-laced coastal fare.', address: '6 Marine Drive', city: 'Kochi', cuisine_type: 'Kerala', theme_color: 'forest', emoji: '🥥', rating: 4.8, price_range: '$$', opening_time: '11:00', closing_time: '22:30' },
  { name: 'MP Royal Bhuna', description: 'Bhuna gosht, poha-jalebi breakfasts, and Malwa plateau specialties.', address: '3 Hamidia Road', city: 'Bhopal', cuisine_type: 'Madhya Pradeshi', theme_color: 'gold', emoji: '🍛', rating: 4.5, price_range: '$$', opening_time: '08:00', closing_time: '22:30' },
  { name: 'Imphal Ema Kitchen', description: 'Manipuri eromba, singju, and fermented bamboo-shoot delicacies.', address: '2 Thangal Bazaar', city: 'Imphal', cuisine_type: 'Manipuri', theme_color: 'cherry', emoji: '🌶️', rating: 4.4, price_range: '$$', opening_time: '10:00', closing_time: '21:30' },
  { name: 'Shillong Cloud Kitchen', description: 'Khasi jadoh, smoked pork, and Meghalaya hill-station comfort food.', address: '11 Police Bazaar', city: 'Shillong', cuisine_type: 'Khasi', theme_color: 'lavender', emoji: '☁️', rating: 4.6, price_range: '$$', opening_time: '10:00', closing_time: '22:00' },
  { name: 'Mizo Bamboo Hut', description: 'Mizo bai, smoked meats, and bamboo-steamed rice platters.', address: '4 Zarkawt', city: 'Aizawl', cuisine_type: 'Mizo', theme_color: 'forest', emoji: '🎋', rating: 4.3, price_range: '$$', opening_time: '11:00', closing_time: '21:30' },
  { name: 'Naga Hills Smokehouse', description: 'Smoked pork with axone, fermented flavors, and tribal feasts.', address: '7 Kohima Main', city: 'Kohima', cuisine_type: 'Naga', theme_color: 'ember', emoji: '🔥', rating: 4.5, price_range: '$$', opening_time: '11:00', closing_time: '22:00' },
  { name: 'Odisha Temple Kitchen', description: 'Mahaprasad-inspired dalma, chenna poda, and coastal Odia thalis.', address: '19 Janpath', city: 'Bhubaneswar', cuisine_type: 'Odia', theme_color: 'gold', emoji: '🛕', rating: 4.6, price_range: '$$', opening_time: '11:00', closing_time: '22:00' },
  { name: 'Amritsar Golden Dhaba', description: 'Amritsari kulcha, lassi, and langar-inspired vegetarian spreads.', address: '1 Hall Bazaar', city: 'Amritsar', cuisine_type: 'Punjabi', theme_color: 'sunset', emoji: '🫓', rating: 4.9, price_range: '$', opening_time: '07:00', closing_time: '23:00' },
  { name: 'Gangtok Mountain Spice', description: 'Sikkimese thukpa, momos, and organic Himalayan farm plates.', address: '6 MG Marg', city: 'Gangtok', cuisine_type: 'Sikkimese', theme_color: 'ocean', emoji: '🏔️', rating: 4.7, price_range: '$$', opening_time: '10:00', closing_time: '22:00' },
  { name: 'Agartala River View', description: 'Tripuri muya awandru, berma chutney, and Bengali-Tripuri fusion.', address: '10 Hari Ganga', city: 'Agartala', cuisine_type: 'Tripuri', theme_color: 'citrus', emoji: '🌊', rating: 4.3, price_range: '$$', opening_time: '11:00', closing_time: '21:30' },
  { name: 'Lucknow Nawabi House', description: 'Galouti kebab, biryani, and Awadhi dum pukht in a nawabi ambience.', address: '25 Hazratganj', city: 'Lucknow', cuisine_type: 'Awadhi', theme_color: 'gold', emoji: '👑', rating: 4.8, price_range: '$$$', opening_time: '12:00', closing_time: '23:00' },
  { name: 'Dehradun Valley Grill', description: 'Garhwali chainsoo, trout from hill streams, and organic salads.', address: '8 Rajpur Road', city: 'Dehradun', cuisine_type: 'Garhwali', theme_color: 'forest', emoji: '🌲', rating: 4.5, price_range: '$$', opening_time: '10:00', closing_time: '22:00' },
  { name: 'Srinagar Dal Lake Houseboat', description: 'Wazwan feasts, kahwa, and Kashmiri rogan josh with lake views.', address: 'Dal Lake Boulevard', city: 'Srinagar', cuisine_type: 'Kashmiri', theme_color: 'lavender', emoji: '🛶', rating: 4.7, price_range: '$$$', opening_time: '11:00', closing_time: '22:30' },
  { name: 'Leh High Altitude Kitchen', description: 'Thukpa, momos, and Ladakhi butter tea in a cozy mountain lodge.', address: '4 Changspa Road', city: 'Leh', cuisine_type: 'Ladakhi', theme_color: 'ocean', emoji: '🏔️', rating: 4.6, price_range: '$$', opening_time: '09:00', closing_time: '21:00' },
  { name: 'Pondicherry French Quarter', description: 'Creole seafood, French pastries, and Tamil-French fusion by the beach.', address: '2 Rue Dumas', city: 'Pondicherry', cuisine_type: 'Indo-French', theme_color: 'cherry', emoji: '🥐', rating: 4.7, price_range: '$$$', opening_time: '11:00', closing_time: '23:00' },
  { name: 'Chandigarh Sector 17 Grill', description: 'Modern Punjabi grill, tandoori platters, and craft mocktails.', address: 'Sector 17 Plaza', city: 'Chandigarh', cuisine_type: 'Contemporary Indian', theme_color: 'citrus', emoji: '🍖', rating: 4.6, price_range: '$$', opening_time: '11:30', closing_time: '23:30' },
  { name: 'Mysore Palace Dining', description: 'Karnataka-style bisi bele bath, Mysore pak, and royal vegetarian thali.', address: '12 Sayyaji Rao Road', city: 'Mysore', cuisine_type: 'Karnataka', theme_color: 'gold', emoji: '🏰', rating: 4.7, price_range: '$$', opening_time: '11:00', closing_time: '22:00' },
  { name: 'Nagpur Orange Orchard', description: 'Saoji curry, tarri poha, and Vidarbha-style spicy regional fare.', address: '9 Wardha Road', city: 'Nagpur', cuisine_type: 'Maharashtrian', theme_color: 'citrus', emoji: '🍊', rating: 4.5, price_range: '$$', opening_time: '10:00', closing_time: '22:30' },
  { name: 'Noida Cyber Spice', description: 'North Indian fusion, live counters, and corporate-friendly dining.', address: '21 Sector 18', city: 'Noida', cuisine_type: 'North Indian', theme_color: 'cherry', emoji: '🌃', rating: 4.4, price_range: '$$', opening_time: '11:00', closing_time: '23:00' },
  { name: 'Coimbatore Kongu Kitchen', description: 'Kongunadu biryani, millet meals, and Tamil Nadu countryside flavors.', address: '5 Avinashi Road', city: 'Coimbatore', cuisine_type: 'Tamil', theme_color: 'sunset', emoji: '🍚', rating: 4.6, price_range: '$$', opening_time: '11:00', closing_time: '22:00' },
  { name: 'Warangal Fort Feast', description: 'Telangana spicy curries, sakinalu snacks, and festive banana-leaf meals.', address: '3 Hanamkonda Road', city: 'Warangal', cuisine_type: 'Telangana', theme_color: 'ember', emoji: '🏯', rating: 4.4, price_range: '$$', opening_time: '11:00', closing_time: '22:30' },
  { name: 'Siliguri Tea Garden Bistro', description: 'Darjeeling tea pairings, momos, and Bengali hill-station comfort food.', address: '11 Hill Cart Road', city: 'Siliguri', cuisine_type: 'Bengali', theme_color: 'forest', emoji: '🍃', rating: 4.5, price_range: '$$', opening_time: '10:00', closing_time: '22:00' },
  { name: 'Udaipur Lake Palace Dining', description: 'Rajasthani laal maas, dal baati, and lakeside candlelit dinners.', address: 'Lake Pichola Road', city: 'Udaipur', cuisine_type: 'Rajasthani', theme_color: 'gold', emoji: '🏰', rating: 4.9, price_range: '$$$', opening_time: '12:00', closing_time: '23:00' },
  { name: 'Port Blair Island Grill', description: 'Andaman seafood, coconut curries, and tropical island dining.', address: '2 Aberdeen Bazaar', city: 'Port Blair', cuisine_type: 'Seafood', theme_color: 'ocean', emoji: '🏝️', rating: 4.5, price_range: '$$', opening_time: '11:00', closing_time: '22:00' },
  { name: 'Daman Coastal Kitchen', description: 'Portuguese-Indian fusion, fresh prawns, and beachside grills.', address: '1 Devka Beach Road', city: 'Daman', cuisine_type: 'Coastal', theme_color: 'ocean', emoji: '🦐', rating: 4.4, price_range: '$$', opening_time: '11:00', closing_time: '23:00' },
].map((r) => ({ ...r, tables: makeStandardTables() }));

const ALL_RESTAURANTS = [...RESTAURANTS, ...INDIAN_STATE_RESTAURANTS];

const AVATAR_COLORS = ['indigo', 'rose', 'emerald', 'amber', 'violet', 'cyan', 'fuchsia', 'orange'];

async function seed() {
  const ownerResult = await pool.query("SELECT id FROM users WHERE role = 'owner' LIMIT 1");
  let ownerId = ownerResult.rows[0]?.id;

  if (!ownerId) {
    const adminResult = await pool.query("SELECT id FROM users LIMIT 1");
    ownerId = adminResult.rows[0]?.id;
  }

  if (!ownerId) {
    const hash = await bcrypt.hash('owner123', 10);
    const newOwner = await pool.query(
      "INSERT INTO users (name, email, password, role, phone, avatar_color) VALUES ($1, $2, $3, 'owner', $4, $5) RETURNING id",
      ['Demo Owner', 'owner@reserveease.com', hash, '+91 98765 43210', 'violet']
    );
    ownerId = newOwner.rows[0].id;
    console.log('Created demo owner: owner@reserveease.com / owner123');
  }

  const demoUser = await pool.query("SELECT id FROM users WHERE email = 'demo@reserveease.com'");
  if (demoUser.rows.length === 0) {
    const hash = await bcrypt.hash('demo123', 10);
    await pool.query(
      "INSERT INTO users (name, email, password, role, phone, avatar_color) VALUES ($1, $2, $3, 'customer', $4, $5)",
      ['Demo User', 'demo@reserveease.com', hash, '+91 91234 56789', 'rose']
    );
    console.log('Created demo user: demo@reserveease.com / demo123');
  }

  await pool.query('DELETE FROM waitlist WHERE restaurant_id IN (SELECT id FROM restaurants)');
  await pool.query('DELETE FROM reservations WHERE table_id IN (SELECT id FROM tables WHERE restaurant_id IN (SELECT id FROM restaurants))');
  await pool.query('DELETE FROM tables WHERE restaurant_id IN (SELECT id FROM restaurants)');
  await pool.query('DELETE FROM restaurants');

  for (const r of ALL_RESTAURANTS) {
    const inserted = await pool.query(
      `INSERT INTO restaurants (owner_id, name, description, address, city, opening_time, closing_time, slot_duration, cuisine_type, theme_color, emoji, rating, price_range)
       VALUES ($1,$2,$3,$4,$5,$6,$7,60,$8,$9,$10,$11,$12) RETURNING id`,
      [ownerId, r.name, r.description, r.address, r.city, r.opening_time, r.closing_time, r.cuisine_type, r.theme_color, r.emoji, r.rating, r.price_range]
    );
    const restaurantId = inserted.rows[0].id;

    for (const t of r.tables) {
      await pool.query(
        `INSERT INTO tables (table_number, capacity, location, restaurant_id, x_position, y_position, table_type, is_vip)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [t.n, t.cap, t.loc, restaurantId, t.x, t.y, t.type, t.vip]
      );
    }
    console.log(`Seeded ${r.name} with ${r.tables.length} tables`);
  }

  const users = await pool.query("SELECT id FROM users WHERE avatar_color IS NULL OR avatar_color = 'indigo'");
  for (let i = 0; i < users.rows.length; i++) {
    await pool.query('UPDATE users SET avatar_color = $1 WHERE id = $2', [
      AVATAR_COLORS[i % AVATAR_COLORS.length],
      users.rows[i].id,
    ]);
  }

  const total = await pool.query('SELECT COUNT(*) FROM restaurants');
  const tableTotal = await pool.query('SELECT COUNT(*) FROM tables');
  console.log(`\nSeed complete: ${total.rows[0].count} restaurants, ${tableTotal.rows[0].count} tables`);
}


module.exports = seed;
