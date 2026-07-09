import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import API from '../api/axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

function Analytics() {
  const { restaurantId } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    API.get(`/reservations/analytics/${restaurantId}`).then((res) => setData(res.data));
  }, [restaurantId]);

  if (!data) return <p className="p-8">Loading analytics...</p>;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="font-semibold mb-4">Bookings by Day</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.byDay}>
              <XAxis dataKey="reservation_date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="font-semibold mb-4">Party Size Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={data.partySizeDist} dataKey="count" nameKey="party_size" outerRadius={80} label>
                {data.partySizeDist.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="font-semibold mb-4">Cancellation Rate</h3>
          <ul>
            {data.cancelRate.map((row) => (
              <li key={row.status}>{row.status}: {row.count}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Analytics;