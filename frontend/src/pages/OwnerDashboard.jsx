import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import { useTheme } from '../context/ThemeContext';

function OwnerDashboard() {
  const { t } = useTheme();
  const user = JSON.parse(localStorage.getItem('user'));
  const [myRestaurants, setMyRestaurants] = useState([]);
  const [newRestaurant, setNewRestaurant] = useState({
    name: '', description: '', address: '', city: '', opening_time: '09:00', closing_time: '22:00',
  });
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [tables, setTables] = useState([]);
  const [newTable, setNewTable] = useState({ table_number: '', capacity: '', location: '' });

  const fetchMyRestaurants = async () => {
    const res = await API.get(`/restaurants/owner/${user.id}`);
    setMyRestaurants(res.data);
  };

  useEffect(() => {
    setTimeout(() => {
      fetchMyRestaurants();
    }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRestaurantChange = (e) => {
    setNewRestaurant({ ...newRestaurant, [e.target.name]: e.target.value });
  };

  const createRestaurant = async (e) => {
    e.preventDefault();
    await API.post('/restaurants', { ...newRestaurant, owner_id: user.id });
    setNewRestaurant({ name: '', description: '', address: '', city: '', opening_time: '09:00', closing_time: '22:00' });
    fetchMyRestaurants();
  };

  const selectRestaurant = async (restaurant) => {
    setSelectedRestaurant(restaurant);
    const res = await API.get(`/tables?restaurant_id=${restaurant.id}`);
    setTables(res.data);
  };

  const handleTableChange = (e) => {
    setNewTable({ ...newTable, [e.target.name]: e.target.value });
  };

  const addTable = async (e) => {
    e.preventDefault();
    await API.post('/tables', { ...newTable, restaurant_id: selectedRestaurant.id });
    setNewTable({ table_number: '', capacity: '', location: '' });
    const res = await API.get(`/tables?restaurant_id=${selectedRestaurant.id}`);
    setTables(res.data);
  };

  const deleteTable = async (id) => {
    await API.delete(`/tables/${id}`);
    const res = await API.get(`/tables?restaurant_id=${selectedRestaurant.id}`);
    setTables(res.data);
  };

  return (
    <div className={`min-h-screen ${t.bg} p-8 transition-colors duration-500`}>
      <div className="max-w-4xl mx-auto space-y-8">
        <h2 className={`text-2xl font-bold ${t.text}`}>Owner Dashboard</h2>

        <div className={`${t.card} p-6 rounded-2xl shadow-md`}>
          <h3 className={`text-xl font-bold mb-4 ${t.text}`}>Register Your Restaurant</h3>
          <form onSubmit={createRestaurant} className="grid grid-cols-2 gap-3">
            <input name="name" placeholder="Restaurant Name" value={newRestaurant.name} onChange={handleRestaurantChange} className={`p-2 rounded-xl border ${t.input}`} required />
            <input name="city" placeholder="City" value={newRestaurant.city} onChange={handleRestaurantChange} className={`p-2 rounded-xl border ${t.input}`} required />
            <input name="address" placeholder="Address" value={newRestaurant.address} onChange={handleRestaurantChange} className={`p-2 rounded-xl border ${t.input} col-span-2`} required />
            <textarea name="description" placeholder="Description" value={newRestaurant.description} onChange={handleRestaurantChange} className={`p-2 rounded-xl border ${t.input} col-span-2`} />
            <label className={`text-sm ${t.muted}`}>Opening Time
              <input type="time" name="opening_time" value={newRestaurant.opening_time} onChange={handleRestaurantChange} className={`p-2 rounded-xl border ${t.input} w-full`} />
            </label>
            <label className={`text-sm ${t.muted}`}>Closing Time
              <input type="time" name="closing_time" value={newRestaurant.closing_time} onChange={handleRestaurantChange} className={`p-2 rounded-xl border ${t.input} w-full`} />
            </label>
            <button className={`col-span-2 py-2 rounded-xl text-white font-semibold bg-gradient-to-r ${t.accent} hover:opacity-90`}>Create Restaurant</button>
          </form>
        </div>

        <div className={`${t.card} p-6 rounded-2xl shadow-md`}>
          <h3 className={`text-xl font-bold mb-4 ${t.text}`}>My Restaurants</h3>
          <ul className="space-y-2">
            {myRestaurants.map((r) => (
              <li key={r.id} className={`flex justify-between items-center border ${t.tableRow} p-3 rounded-xl`}>
                <span className={t.text}>{r.name} — {r.city}</span>
                <div>
                  <button onClick={() => selectRestaurant(r)} className={t.link}>Manage Tables</button>
                  <Link to={`/floorplan/${r.id}`} className={`${t.link} ml-3`}>Floor Plan</Link>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {selectedRestaurant && (
          <div className={`${t.card} p-6 rounded-2xl shadow-md`}>
            <h3 className={`text-xl font-bold mb-4 ${t.text}`}>Manage Tables — {selectedRestaurant.name}</h3>
            <form onSubmit={addTable} className="grid grid-cols-4 gap-3 mb-4">
              <input type="number" name="table_number" placeholder="Table #" value={newTable.table_number} onChange={handleTableChange} className={`p-2 rounded-xl border ${t.input}`} required />
              <input type="number" name="capacity" placeholder="Capacity" value={newTable.capacity} onChange={handleTableChange} className={`p-2 rounded-xl border ${t.input}`} required />
              <input type="text" name="location" placeholder="Location" value={newTable.location} onChange={handleTableChange} className={`p-2 rounded-xl border ${t.input}`} required />
              <button className={`rounded-xl text-white font-semibold bg-gradient-to-r ${t.accent} hover:opacity-90`}>Add Table</button>
            </form>
            <ul className="space-y-2">
              {tables.map((tbl) => (
                <li key={tbl.id} className={`flex justify-between border ${t.tableRow} p-3 rounded-xl`}>
                  <span className={t.text}>Table {tbl.table_number} — Capacity {tbl.capacity} — {tbl.location}</span>
                  <button onClick={() => deleteTable(tbl.id)} className="text-red-500 hover:text-red-400">Delete</button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default OwnerDashboard;
