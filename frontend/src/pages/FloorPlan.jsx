import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import API from '../api/axios';
import { useTheme } from '../context/ThemeContext';

const TABLE_COLORS = {
  standard: 'from-blue-400 to-cyan-500',
  booth: 'from-violet-400 to-purple-500',
  bar: 'from-amber-400 to-orange-500',
  outdoor: 'from-emerald-400 to-green-500',
  private: 'from-rose-400 to-pink-500',
  banquet: 'from-indigo-400 to-violet-500',
};

function FloorPlan() {
  const { restaurantId } = useParams();
  const [tables, setTables] = useState([]);
  const { t } = useTheme();

  const fetchTables = async () => {
    const res = await API.get(`/tables?restaurant_id=${restaurantId}`);
    setTables(res.data);
  };

  useEffect(() => {
    setTimeout(() => {
      fetchTables();
    }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  return (
    <div className={`min-h-screen ${t.bg} p-6 md:p-8 transition-colors duration-500`}>
      <div className="max-w-4xl mx-auto">
        <h2 className={`text-2xl font-bold mb-2 ${t.text}`}>Restaurant Floor Plan</h2>
        <p className={`text-sm ${t.muted} mb-6`}>Drag tables to arrange your floor plan · {tables.length} tables</p>

        <div className="flex flex-wrap gap-2 mb-4">
          {Object.entries(TABLE_COLORS).map(([type, color]) => (
            <span key={type} className={`text-xs px-2 py-1 rounded-full bg-gradient-to-r ${color} text-white capitalize`}>{type}</span>
          ))}
        </div>

        <div
          className={`relative ${t.card} border-2 border-dashed rounded-2xl mx-auto`}
          style={{ width: '100%', maxWidth: '800px', height: '500px' }}
          onDragOver={(e) => e.preventDefault()}
        >
          {tables.map((tbl) => {
            const color = TABLE_COLORS[tbl.table_type] || TABLE_COLORS.standard;
            return (
              <div
                key={tbl.id}
                draggable
                onDragEnd={async (e) => {
                  const container = e.target.parentElement.getBoundingClientRect();
                  const x = e.clientX - container.left;
                  const y = e.clientY - container.top;
                  await API.put(`/tables/${tbl.id}/position`, { x_position: x, y_position: y });
                  fetchTables();
                }}
                className={`absolute flex items-center justify-center bg-gradient-to-br ${color} text-white rounded-full cursor-move shadow-lg select-none ring-2 ring-white/30 ${tbl.is_vip ? 'ring-amber-300' : ''}`}
                style={{
                  left: tbl.x_position || 50,
                  top: tbl.y_position || 50,
                  width: `${30 + tbl.capacity * 8}px`,
                  height: `${30 + tbl.capacity * 8}px`,
                }}
              >
                <div className="text-center text-xs">
                  <div className="font-bold">T{tbl.table_number}</div>
                  <div>{tbl.capacity}p</div>
                  {tbl.is_vip && <div className="text-[10px]">⭐</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default FloorPlan;
