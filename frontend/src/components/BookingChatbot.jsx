import { useState, useRef, useEffect } from 'react';
import API from '../api/axios';
import { useTheme } from '../context/ThemeContext';

const SUGGESTIONS = [
  'Book a table for 4 tomorrow at 8 PM',
  'Reserve for 2 on Friday at 7pm outdoor',
  'Table for 6 today at 12:30',
];

function BookingChatbot({ restaurantId, onParsed }) {
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hi! I can help you book a table. Try: "Book a table for 4 tomorrow at 8 PM"' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const bottomRef = useRef(null);
  const { t } = useTheme();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    setMessages((m) => [...m, { role: 'user', text }]);
    setInput('');
    setLoading(true);

    try {
      const res = await API.post('/chatbot/parse', { message: text, restaurant_id: restaurantId });
      setMessages((m) => [...m, { role: 'bot', text: res.data.reply }]);
      if (res.data.parsed?.ready) {
        onParsed?.(res.data.parsed);
      }
    } catch {
      setMessages((m) => [...m, { role: 'bot', text: 'Sorry, I could not understand that. Please try again.' }]);
    }
    setLoading(false);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-2xl shadow-xl hover:scale-105 transition-transform flex items-center justify-center"
        title="AI Booking Assistant"
      >
        🤖
      </button>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-40 w-80 sm:w-96 rounded-2xl shadow-2xl ${t.card} border overflow-hidden flex flex-col`} style={{ maxHeight: '480px' }}>
      <div className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white p-4 flex justify-between items-center">
        <div>
          <p className="font-bold">AI Booking Assistant</p>
          <p className="text-xs opacity-80">Natural language booking</p>
        </div>
        <button type="button" onClick={() => setOpen(false)} className="text-white/80 hover:text-white text-xl">×</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[280px]">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${
              msg.role === 'user'
                ? 'bg-violet-500 text-white rounded-br-sm'
                : `${t.surface} ${t.text} rounded-bl-sm`
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && <p className={`text-xs ${t.muted} animate-pulse`}>Thinking...</p>}
        <div ref={bottomRef} />
      </div>

      <div className="p-2 border-t flex flex-wrap gap-1">
        {SUGGESTIONS.map((s) => (
          <button key={s} type="button" onClick={() => sendMessage(s)} className={`text-[10px] px-2 py-1 rounded-full ${t.surface} ${t.muted} hover:opacity-80`}>
            {s.slice(0, 30)}…
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
        className="p-3 border-t flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your booking request..."
          className={`flex-1 p-2 rounded-xl border text-sm ${t.input}`}
        />
        <button type="submit" disabled={loading} className="px-4 py-2 rounded-xl bg-violet-500 text-white text-sm font-semibold disabled:opacity-50">
          Send
        </button>
      </form>
    </div>
  );
}

export default BookingChatbot;
