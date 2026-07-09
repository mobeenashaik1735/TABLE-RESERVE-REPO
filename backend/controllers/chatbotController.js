const DAY_MAP = {
  sunday: 0, sun: 0,
  monday: 1, mon: 1,
  tuesday: 2, tue: 2, tues: 2,
  wednesday: 3, wed: 3,
  thursday: 4, thu: 4, thur: 4, thurs: 4,
  friday: 5, fri: 5,
  saturday: 6, sat: 6,
};

function parseDate(input, today = new Date()) {
  const lower = input.toLowerCase().trim();
  if (lower === 'today') return formatDate(today);
  if (lower === 'tomorrow') {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return formatDate(d);
  }

  const dayMatch = lower.match(/\b(sunday|monday|tuesday|wednesday|thursday|friday|saturday|sun|mon|tue|tues|wed|thu|thur|thurs|fri|sat)\b/);
  if (dayMatch) {
    const targetDay = DAY_MAP[dayMatch[1]];
    const d = new Date(today);
    const diff = (targetDay - d.getDay() + 7) % 7 || 7;
    d.setDate(d.getDate() + diff);
    return formatDate(d);
  }

  const isoMatch = lower.match(/(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) return isoMatch[1];

  const slashMatch = lower.match(/(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/);
  if (slashMatch) {
    const month = slashMatch[1].padStart(2, '0');
    const day = slashMatch[2].padStart(2, '0');
    const year = slashMatch[3] ? (slashMatch[3].length === 2 ? `20${slashMatch[3]}` : slashMatch[3]) : today.getFullYear();
    return `${year}-${month}-${day}`;
  }

  return null;
}

function parseTime(input) {
  const lower = input.toLowerCase();
  const match = lower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (!match) return null;

  let hour = parseInt(match[1], 10);
  const minutes = match[2] || '00';
  const meridiem = match[3];

  if (meridiem === 'pm' && hour < 12) hour += 12;
  if (meridiem === 'am' && hour === 12) hour = 0;
  if (!meridiem && hour >= 1 && hour <= 11 && lower.includes('pm')) hour += 12;

  return `${String(hour).padStart(2, '0')}:${minutes}`;
}

function parsePartySize(input) {
  const patterns = [
    /(?:for|party of|table for|book(?:ing)? for|reserve for)\s*(\d+)/i,
    /(\d+)\s*(?:people|guests|persons|pax)/i,
    /\b(\d+)\s*(?:at|on|tomorrow|today)/i,
  ];
  for (const p of patterns) {
    const m = input.match(p);
    if (m) return parseInt(m[1], 10);
  }
  const lone = input.match(/\b([2-9]|1[0-2])\b/);
  return lone ? parseInt(lone[1], 10) : null;
}

function formatDate(d) {
  return d.toISOString().slice(0, 10);
}

const parseBookingIntent = async (req, res) => {
  const { message, restaurant_id } = req.body;
  if (!message?.trim()) {
    return res.status(400).json({ message: 'Message is required' });
  }

  const text = message.trim();
  const party_size = parsePartySize(text);
  const date = parseDate(text) || parseDate('tomorrow');
  const time = parseTime(text) || '19:00';

  const preferences = [];
  if (/window|view|outdoor|terrace|patio/i.test(text)) preferences.push('outdoor');
  if (/vip|private|quiet/i.test(text)) preferences.push('vip');
  if (/booth/i.test(text)) preferences.push('booth');

  const reply = party_size
    ? `I found a booking for ${party_size} guest${party_size > 1 ? 's' : ''} on ${date} at ${time.slice(0, 5)}.${preferences.length ? ` Preferences: ${preferences.join(', ')}.` : ''} Shall I check availability?`
    : `I could parse the date (${date}) and time (${time.slice(0, 5)}), but I need the party size. Try: "Book a table for 4 tomorrow at 8 PM."`;

  res.json({
    reply,
    parsed: {
      date,
      time,
      party_size,
      preferences,
      restaurant_id: restaurant_id || null,
      ready: !!(party_size && date && time),
    },
  });
};

module.exports = { parseBookingIntent };
