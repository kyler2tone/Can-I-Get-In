export type UsState = {
  code: string;
  name: string;
  bounds: [[number, number], [number, number]];
};

export const usStates: UsState[] = [
  { code: "AL", name: "Alabama", bounds: [[-88.48, 30.22], [-84.89, 35.01]] },
  { code: "AK", name: "Alaska", bounds: [[-179.15, 51.21], [-129.98, 71.39]] },
  { code: "AZ", name: "Arizona", bounds: [[-114.82, 31.33], [-109.05, 37.0]] },
  { code: "AR", name: "Arkansas", bounds: [[-94.62, 33.0], [-89.64, 36.5]] },
  { code: "CA", name: "California", bounds: [[-124.48, 32.53], [-114.13, 42.01]] },
  { code: "CO", name: "Colorado", bounds: [[-109.06, 36.99], [-102.04, 41.0]] },
  { code: "CT", name: "Connecticut", bounds: [[-73.73, 40.98], [-71.79, 42.05]] },
  { code: "DE", name: "Delaware", bounds: [[-75.79, 38.45], [-75.05, 39.84]] },
  { code: "FL", name: "Florida", bounds: [[-87.64, 24.52], [-80.03, 31.0]] },
  { code: "GA", name: "Georgia", bounds: [[-85.61, 30.36], [-80.84, 35.0]] },
  { code: "HI", name: "Hawaii", bounds: [[-160.25, 18.91], [-154.81, 22.24]] },
  { code: "ID", name: "Idaho", bounds: [[-117.24, 42.0], [-111.04, 49.0]] },
  { code: "IL", name: "Illinois", bounds: [[-91.51, 36.97], [-87.5, 42.51]] },
  { code: "IN", name: "Indiana", bounds: [[-88.1, 37.77], [-84.78, 41.76]] },
  { code: "IA", name: "Iowa", bounds: [[-96.64, 40.37], [-90.14, 43.5]] },
  { code: "KS", name: "Kansas", bounds: [[-102.05, 36.99], [-94.59, 40.0]] },
  { code: "KY", name: "Kentucky", bounds: [[-89.57, 36.5], [-81.96, 39.15]] },
  { code: "LA", name: "Louisiana", bounds: [[-94.04, 28.93], [-88.82, 33.02]] },
  { code: "ME", name: "Maine", bounds: [[-71.08, 42.98], [-66.95, 47.46]] },
  { code: "MD", name: "Maryland", bounds: [[-79.49, 37.89], [-75.05, 39.72]] },
  { code: "MA", name: "Massachusetts", bounds: [[-73.51, 41.24], [-69.93, 42.89]] },
  { code: "MI", name: "Michigan", bounds: [[-90.42, 41.69], [-82.41, 48.31]] },
  { code: "MN", name: "Minnesota", bounds: [[-97.24, 43.5], [-89.49, 49.38]] },
  { code: "MS", name: "Mississippi", bounds: [[-91.66, 30.17], [-88.1, 35.01]] },
  { code: "MO", name: "Missouri", bounds: [[-95.77, 35.99], [-89.1, 40.61]] },
  { code: "MT", name: "Montana", bounds: [[-116.05, 44.36], [-104.04, 49.0]] },
  { code: "NE", name: "Nebraska", bounds: [[-104.05, 39.99], [-95.31, 43.0]] },
  { code: "NV", name: "Nevada", bounds: [[-120.01, 35.0], [-114.04, 42.0]] },
  { code: "NH", name: "New Hampshire", bounds: [[-72.56, 42.7], [-70.61, 45.31]] },
  { code: "NJ", name: "New Jersey", bounds: [[-75.56, 38.93], [-73.89, 41.36]] },
  { code: "NM", name: "New Mexico", bounds: [[-109.05, 31.33], [-103.0, 37.0]] },
  { code: "NY", name: "New York", bounds: [[-79.76, 40.49], [-71.86, 45.02]] },
  { code: "NC", name: "North Carolina", bounds: [[-84.32, 33.84], [-75.46, 36.59]] },
  { code: "ND", name: "North Dakota", bounds: [[-104.05, 45.94], [-96.55, 49.0]] },
  { code: "OH", name: "Ohio", bounds: [[-84.82, 38.4], [-80.52, 41.98]] },
  { code: "OK", name: "Oklahoma", bounds: [[-103.0, 33.62], [-94.43, 37.0]] },
  { code: "OR", name: "Oregon", bounds: [[-124.57, 41.99], [-116.46, 46.29]] },
  { code: "PA", name: "Pennsylvania", bounds: [[-80.52, 39.72], [-74.69, 42.27]] },
  { code: "RI", name: "Rhode Island", bounds: [[-71.89, 41.15], [-71.12, 42.02]] },
  { code: "SC", name: "South Carolina", bounds: [[-83.35, 32.03], [-78.54, 35.22]] },
  { code: "SD", name: "South Dakota", bounds: [[-104.06, 42.48], [-96.44, 45.95]] },
  { code: "TN", name: "Tennessee", bounds: [[-90.31, 34.98], [-81.65, 36.68]] },
  { code: "TX", name: "Texas", bounds: [[-106.65, 25.84], [-93.51, 36.5]] },
  { code: "UT", name: "Utah", bounds: [[-114.05, 36.99], [-109.04, 42.0]] },
  { code: "VT", name: "Vermont", bounds: [[-73.44, 42.73], [-71.47, 45.02]] },
  { code: "VA", name: "Virginia", bounds: [[-83.68, 36.54], [-75.24, 39.47]] },
  { code: "WA", name: "Washington", bounds: [[-124.79, 45.54], [-116.92, 49.0]] },
  { code: "WV", name: "West Virginia", bounds: [[-82.64, 37.2], [-77.72, 40.64]] },
  { code: "WI", name: "Wisconsin", bounds: [[-92.89, 42.49], [-86.25, 47.31]] },
  { code: "WY", name: "Wyoming", bounds: [[-111.06, 40.99], [-104.05, 45.01]] },
];

export function getUsState(value: string) {
  const normalized = value.trim().toUpperCase();
  return usStates.find((state) => state.code === normalized || state.name.toUpperCase() === normalized);
}
