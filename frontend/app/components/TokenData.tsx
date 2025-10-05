// "use client";
// import { useEffect, useState } from "react";
// import {
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   Tooltip,
//   CartesianGrid,
//   ReferenceLine
// } from "recharts";

// interface TradeData {
//   token: string;
//   price_in_sol: number;
//   rsi: number;
//   time: string; // use for XAxis
// }

// export default function RSIChart({ token }: { token: string }) {
//   const [data, setData] = useState<TradeData[]>([]);

//   useEffect(() => {
//     const ws = new WebSocket("ws://localhost:3030/ws");
//     ws.onmessage = (event) => {
//       const msg: TradeData = JSON.parse(event.data);
//       if (msg.token === token) {
//         setData(prev => [...prev.slice(-50), msg]); // keep last 50 points
//       }
//     };
//     return () => ws.close();
//   }, [token]);

//   return (
//     <div>
//       <h2>{token} Price & RSI</h2>
//       <LineChart width={600} height={300} data={data}>
//         <CartesianGrid strokeDasharray="3 3" />
//         <XAxis dataKey="time" />
//         <YAxis yAxisId="left" domain={['auto','auto']} />
//         <YAxis yAxisId="right" orientation="right" domain={[0,100]} />
//         <Tooltip />
//         <Line yAxisId="left" type="monotone" dataKey="price_in_sol" stroke="#8884d8" />
//         <Line yAxisId="right" type="monotone" dataKey="rsi" stroke="#82ca9d" />
//         <ReferenceLine y={70} stroke="red" strokeDasharray="3 3" />
//         <ReferenceLine y={30} stroke="green" strokeDasharray="3 3" />
//       </LineChart>
//     </div>
//   );
// }
// "use client";

// import { useEffect, useState } from "react";
// import {
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   Legend,
// } from "recharts";
// import axios from "axios";

// interface RSIData {
//   token: string;
//   rsi_values: number[];
// }

// export default function RSIChart({ token }: { token: string }) {
//   const [data, setData] = useState<{ index: number; rsi: number }[]>([]);

//   useEffect(() => {
//     const fetchData = async () => {
//       const res = await axios.get("/rsi_output.json");
//       const allData: RSIData[] = res.data;
//       const tokenData = allData.find((t) => t.token === token);
//       if (tokenData) {
//         setData(tokenData.rsi_values.map((rsi, idx) => ({ index: idx, rsi })));
//       }
//     };
//     fetchData();
//   }, [token]);

//   return (
//     <LineChart width={600} height={300} data={data}>
//       <XAxis dataKey="index" />
//       <YAxis domain={[0, 100]} />
//       <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
//       <Tooltip />
//       <Legend />
//       <Line type="monotone" dataKey="rsi" stroke="#8884d8" />
//       <Line type="monotone" dataKey={() => 70} stroke="#ff0000" strokeDasharray="5 5" />
//       <Line type="monotone" dataKey={() => 30} stroke="#00ff00" strokeDasharray="5 5" />
//     </LineChart>
//   );
// }
// "use client";

// import { useEffect, useState } from "react";
// import axios from "axios";
// import {
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   Legend,
//   ResponsiveContainer,
// } from "recharts";

// interface TokenData {
//   token: string;
//   times: string[];
//   prices: number[];
//   volumes_sol: number[];
//   volumes_token: number[];
//   rsi: number[];
// }

// interface ChartPoint {
//   time: string;
//   price: number;
//   rsi: number;
//   volume_sol: number;
// }

// export default function TokenDashboard({ token }: { token: string }) {
//   const [data, setData] = useState<ChartPoint[]>([]);
  

//  useEffect(() => {
//   if (!token) return; // exit if token is not selected yet

//   const fetchData = async () => {
//     try {
//       const res = await axios.get("http://localhost:3030/rsi");
//       const allData: TokenData[] = res.data;

//       console.log("All tokens:", allData.map(t => t.token));
//       console.log("Selected token:", token);

//       const tokenData = allData.find(
//         (t) => t.token.trim().toLowerCase() === token.trim().toLowerCase()
//       );

//       if (tokenData) {
//         const chartData: ChartPoint[] = tokenData.times.map((time, idx) => ({
//           time,
//           price: tokenData.prices[idx],
//           rsi: tokenData.rsi[idx] || 0,
//           volume_sol: tokenData.volumes_sol[idx],
//         }));
//         setData(chartData);
//       } else {
//         console.warn("Token not found in backend data!");
//       }
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   fetchData();
// }, [token]);


//   return (
//     <ResponsiveContainer width="100%" height={400}>
//       <LineChart data={data}>
//         <CartesianGrid strokeDasharray="3 3" />
//         <XAxis dataKey="time" />
//         <YAxis yAxisId="left" orientation="left" domain={["auto", "auto"]} />
//         <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
//         <Tooltip />
//         <Legend />
//         <Line yAxisId="left" type="monotone" dataKey="price" stroke="#8884d8" name="Price" />
//         <Line yAxisId="right" type="monotone" dataKey="rsi" stroke="#82ca9d" name="RSI" />
//         <Line yAxisId="left" type="monotone" dataKey="volume_sol" stroke="#ffc658" name="Volume(SOL)" />
//       </LineChart>
//     </ResponsiveContainer>
//   );
// }
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
        const res = await axios.get("http://localhost:3030/rsi");
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
