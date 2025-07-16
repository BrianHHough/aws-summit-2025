"use client";

import dynamic from 'next/dynamic';

// Dynamic import for ResponsiveLine
const ResponsiveLine = dynamic(
  () => import('@nivo/line').then((mod) => mod.ResponsiveLine),
  { ssr: false }
);

const data = [
  {
    id: "Documents",
    color: "#A7836B",
    data: [
      { x: "Jan", y: 2 },
      { x: "Feb", y: 3 },
      { x: "Mar", y: 5 },
      { x: "Apr", y: 7 },
      { x: "May", y: 8 },
      { x: "Jun", y: 10 },
      { x: "Jul", y: 12 },
    ],
  },
  {
    id: "Chats",
    color: "#299D90",
    data: [
      { x: "Jan", y: 4 },
      { x: "Feb", y: 7 },
      { x: "Mar", y: 9 },
      { x: "Apr", y: 12 },
      { x: "May", y: 15 },
      { x: "Jun", y: 19 },
      { x: "Jul", y: 24 },
    ],
  },
];

export function DashboardStats() {
  return (
    <div style={{ height: 350 }}>
      <ResponsiveLine
        data={data}
        margin={{ top: 40, right: 30, bottom: 50, left: 40 }}
        xScale={{ type: "point" }}
        yScale={{ type: "linear", min: 0, max: "auto", nice: true }}
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 0,
          tickPadding: 10,
        }}
        axisLeft={{
          tickSize: 0,
          tickPadding: 10,
          tickValues: [0, 6, 12, 18, 24, 30]
        }}
        colors={{ datum: 'color' }}
        pointSize={6}
        pointColor={{ theme: "background" }}
        pointBorderWidth={2}
        pointBorderColor={{ from: 'serieColor' }}
        enablePoints={true}
        useMesh={true}
        enableArea={true}
        tooltip={({ point }: { point: any }) => {
          // Find all points at the same x position
          const xValue = point.data.x;
          const allPointsAtX = data.map(serie => {
            const dataPoint = serie.data.find(d => d.x === xValue);
            return {
              id: serie.id,
              value: dataPoint?.y || 0,
              color: serie.color
            };
          });

          return (
            <div
              style={{
                padding: '12px',
                borderRadius: '4px',
                fontSize: '14px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                width: "140px",
              }}
            >
              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                {String(xValue)}
              </div>
              {allPointsAtX.map((item, index) => (
                <div key={index} style={{ color: item.color, marginBottom: '4px' }}>
                  {item.id.toLowerCase()}: {item.value}
                </div>
              ))}
            </div>
          );
        }}
        areaOpacity={0.3}
        enableGridX={false}
        enableGridY={false}
        legends={[]}
      />
    </div>
  );
}