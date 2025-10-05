"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface TokenData {
  token: string;
  times: string[];
  prices: number[];
  volumes_sol: number[];
  volumes_token: number[];
  rsi: number[];
}

interface ChartPoint {
  time: string;
  price: number;
  rsi: number;
  volume_sol: number;
}

export default function TokenDashboard() {
  const [allData, setAllData] = useState<TokenData[]>([]);
  const [token, setToken] = useState<string>("token1");
  const [data, setData] = useState<ChartPoint[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get("https://my-trading-analytics-2.onrender.com/rsi");
        setAllData(res.data);
      } catch (err) {
        console.error("Error fetching backend data:", err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!token || allData.length === 0) return;

    const tokenData = allData.find(
      (t) => t.token.trim().toLowerCase() === token.trim().toLowerCase()
    );

    if (!tokenData) {
      console.warn("Selected token not found:", token);
      setData([]);
      return;
    }

    const chartData: ChartPoint[] = tokenData.times.map((time, idx) => ({
      time,
      price: tokenData.prices[idx],
      rsi: tokenData.rsi[idx] || 0,
      volume_sol: tokenData.volumes_sol[idx],
    }));

    setData(chartData);
  }, [token, allData]);

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>Token Dashboard</h1>

      {/* Token Selector */}
      <div style={{ marginBottom: "20px" }}>
        <label htmlFor="token-select">Select Token: </label>
        <select
          id="token-select"
          value={token}
          onChange={(e) => setToken(e.target.value)}
        >
          {allData.map((t) => (
            <option key={t.token} value={t.token}>
              {t.token}
            </option>
          ))}
        </select>
      </div>

      {/* Price Chart */}
      <h2>Price Chart (SOL)</h2>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="price" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <p>No price data available</p>
      )}

      {/* RSI Chart */}
      <h2>RSI Chart</h2>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="rsi" stroke="#82ca9d" />
            {/* Overbought / Oversold lines */}
            <ReferenceLine y={70} stroke="red" strokeDasharray="3 3" />
            <ReferenceLine y={30} stroke="blue" strokeDasharray="3 3" />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <p>No RSI data available</p>
      )}
    </div>
  );
}
