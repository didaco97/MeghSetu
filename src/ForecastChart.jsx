import React from "react";
import { useReducedMotion } from "motion/react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { day } from "./data";
export default function ForecastChart({ data, reference, metric = "rain" }) {
  const reducedMotion = useReducedMotion();
  const items = (data?.days || []).map((x) => {
    const match = reference?.days?.find((r) => r.date === x.date);
    return {
      name: day(x.date),
      date: x.date,
      selected: metric === "rain" ? x.rain : x.high,
      reference: metric === "rain" ? match?.rain : match?.high,
    };
  });
  return (
    <div
      className="forecast-chart"
      role="img"
      aria-label={`Seven-day ${metric === "rain" ? "rainfall" : "maximum temperature"} chart comparing selected and reference coordinates`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={items}
          margin={{ top: 15, right: 12, bottom: 0, left: -22 }}
        >
          <CartesianGrid
            stroke="#dcecf4"
            vertical={false}
            strokeDasharray="3 5"
          />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#527990" }}
            dy={8}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#527990" }}
          />
          <Tooltip
            cursor={{ fill: "#eaf8ff" }}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #bedfec",
              fontSize: 12,
            }}
            formatter={(v, name) => [
              `${v ?? "—"} ${metric === "rain" ? "mm" : "°C"}`,
              name === "selected" ? "Selected location" : "Reference point",
            ]}
          />
          <Legend
            formatter={(value) =>
              value === "selected" ? "Selected location" : "Reference point"
            }
            wrapperStyle={{ fontSize: 11, paddingTop: 16 }}
          />
          {metric === "rain" ? (
            <Bar
              dataKey="selected"
              fill="#149aca"
              isAnimationActive={!reducedMotion}
              radius={[5, 5, 0, 0]}
              maxBarSize={28}
            />
          ) : (
            <Line
              type="monotone"
              dataKey="selected"
              stroke="#087da8"
              isAnimationActive={!reducedMotion}
              strokeWidth={3}
              dot={{ r: 3 }}
            />
          )}
          <Line
            type="monotone"
            dataKey="reference"
            stroke="#bc8423"
            isAnimationActive={!reducedMotion}
            strokeWidth={2}
            strokeDasharray="5 3"
            dot={{ r: 3 }}
            connectNulls={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
