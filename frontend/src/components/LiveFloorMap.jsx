const STATUS_STYLES = {
  available: 'bg-green-500 ring-green-300 shadow-green-500/40',
  reserved: 'bg-yellow-500 ring-yellow-300 shadow-yellow-500/40',
  occupied: 'bg-red-500 ring-red-300 shadow-red-500/40',
  cleaning: 'bg-blue-500 ring-blue-300 shadow-blue-500/40',
};

function LiveFloorMap({ tables, summary, legend, onTableClick, selectedTableId, interactive = true }) {
  if (!tables?.length) {
    return (
      <div className="text-center py-8 text-slate-500">
        <p className="text-3xl mb-2">🗺️</p>
        <p>Select date & time, then check availability to view the live floor map</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4">
        {Object.entries(legend || {}).map(([key, info]) => (
          <span key={key} className="flex items-center gap-1.5 text-xs font-medium">
            <span>{info.emoji}</span>
            <span>{info.label}</span>
            {summary && <span className="opacity-60">({summary[key] || 0})</span>}
          </span>
        ))}
      </div>

      <div
        className="relative bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl mx-auto overflow-hidden"
        style={{ width: '100%', maxWidth: '800px', height: '420px' }}
      >
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-32 h-8 bg-slate-400 rounded-full text-center text-[10px] leading-8">ENTRANCE</div>
          <div className="absolute bottom-4 left-4 w-24 h-16 bg-amber-400/30 rounded-lg" title="Kitchen" />
          <div className="absolute bottom-4 right-4 w-20 h-20 bg-cyan-400/30 rounded-full" title="Bar" />
        </div>

        {tables.map((table) => {
          const isSelected = selectedTableId === table.id;
          const canBook = table.status === 'available' && interactive;
          const statusClass = STATUS_STYLES[table.status] || STATUS_STYLES.available;

          return (
            <button
              key={table.id}
              type="button"
              disabled={!canBook}
              onClick={() => canBook && onTableClick?.(table)}
              title={`Table ${table.table_number} — ${table.statusInfo?.label || table.status} · ${table.capacity} seats · ${table.location}`}
              className={`absolute flex items-center justify-center text-white rounded-full shadow-lg select-none ring-2 transition-all duration-200
                ${statusClass}
                ${canBook ? 'cursor-pointer hover:scale-110 hover:shadow-xl' : 'cursor-not-allowed opacity-80'}
                ${isSelected ? 'ring-4 ring-violet-400 scale-110 z-10' : ''}
                ${table.is_vip ? 'ring-amber-300' : ''}`}
              style={{
                left: table.x_position || 50,
                top: table.y_position || 50,
                width: `${32 + table.capacity * 8}px`,
                height: `${32 + table.capacity * 8}px`,
              }}
            >
              <div className="text-center text-xs leading-tight">
                <div className="font-bold">T{table.table_number}</div>
                <div>{table.capacity}p</div>
                {table.is_vip && <div className="text-[10px]">⭐</div>}
              </div>
            </button>
          );
        })}
      </div>

      {interactive && (
        <p className="text-xs text-center mt-3 opacity-70">
          Click a 🟢 available table to select it for booking
        </p>
      )}
    </div>
  );
}

export default LiveFloorMap;
