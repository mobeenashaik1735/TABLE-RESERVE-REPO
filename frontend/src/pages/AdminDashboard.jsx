import { useEffect, useState } from 'react';
import API from '../api/axios';
import { useTheme } from '../context/ThemeContext';

function AdminDashboard() {
  const { t } = useTheme();
  const [reservations, setReservations] = useState([]);
  const [tables, setTables] = useState([]);
  const [newTable, setNewTable] = useState({ table_number: '', capacity: '', location: '' });

  const fetchData = async () => {
    const resReservations = await API.get('/reservations/all');
    const resTables = await API.get('/tables');
    setReservations(resReservations.data);
    setTables(resTables.data);
  };

  useEffect(() => {
    setTimeout(() => {
      fetchData();
    }, 0);
  }, []);

  const handleChange = (e) => {
    setNewTable({ ...newTable, [e.target.name]: e.target.value });
  };

  const addTable = async (e) => {
    e.preventDefault();
    await API.post('/tables', newTable);
    setNewTable({ table_number: '', capacity: '', location: '' });
    fetchData();
  };

  const deleteTable = async (id) => {
    await API.delete(`/tables/${id}`);
    fetchData();
  };

  return (
    <div className={`min-h-screen ${t.bg} p-8 transition-colors duration-500`}>
      <div className="max-w-4xl mx-auto space-y-8">
        <h2 className={`text-2xl font-bold ${t.text}`}>Admin Dashboard</h2>

        <div className={`${t.card} p-6 rounded-2xl shadow-md`}>
          <h3 className={`text-xl font-bold mb-4 ${t.text}`}>Manage Tables</h3>
          <form onSubmit={addTable} className="grid grid-cols-4 gap-3 mb-4">
            <input
              type="number"
              name="table_number"
              placeholder="Table #"
              value={newTable.table_number}
              onChange={handleChange}
              className={`p-2 rounded-xl border ${t.input}`}
              required
            />
            <input
              type="number"
              name="capacity"
              placeholder="Capacity"
              value={newTable.capacity}
              onChange={handleChange}
              className={`p-2 rounded-xl border ${t.input}`}
              required
            />
            <input
              type="text"
              name="location"
              placeholder="Location"
              value={newTable.location}
              onChange={handleChange}
              className={`p-2 rounded-xl border ${t.input}`}
              required
            />
            <button className={`rounded-xl text-white font-semibold bg-gradient-to-r ${t.accent} hover:opacity-90`}>Add Table</button>
          </form>
          <ul className="space-y-2">
            {tables.map((tbl) => (
              <li key={tbl.id} className={`flex justify-between border ${t.tableRow} p-3 rounded-xl ${t.card}`}>
                <span className={t.text}>Table {tbl.table_number} — Capacity {tbl.capacity} — {tbl.location}</span>
                <button onClick={() => deleteTable(tbl.id)} className="text-red-500 hover:text-red-400">Delete</button>
              </li>
            ))}
          </ul>
        </div>

        <div className={`${t.card} p-6 rounded-2xl shadow-md`}>
          <h3 className={`text-xl font-bold mb-4 ${t.text}`}>All Reservations</h3>
          <table className={`w-full text-left text-sm ${t.text}`}>
            <thead>
              <tr className={`border-b ${t.tableHeader}`}>
                <th className="p-2">Customer</th>
                <th className="p-2">Table</th>
                <th className="p-2">Date</th>
                <th className="p-2">Time</th>
                <th className="p-2">Party</th>
                <th className="p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((r) => (
                <tr key={r.id} className={`border-b ${t.tableRow}`}>
                  <td className="p-2">{r.user_name} ({r.user_email})</td>
                  <td className="p-2">{r.table_number} - {r.location}</td>
                  <td className="p-2">{r.reservation_date?.slice(0,10)}</td>
                  <td className="p-2">{r.reservation_time}</td>
                  <td className="p-2">{r.party_size}</td>
                  <td className={`p-2 ${r.status === 'cancelled' ? 'text-red-500' : t.success}`}>{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
