import { Area, AreaChart, ResponsiveContainer } from "recharts";

const Sparkline = ({
  color = "#8b5cf6",
  data,
}: {
  color?: string;
  data: number[];
}) => (
  <div className="h-10 w-24">
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data.map((val, i) => ({ i, val }))}>
        <Area
          type="monotone"
          dataKey="val"
          stroke={color}
          fill="none"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

export default Sparkline;
