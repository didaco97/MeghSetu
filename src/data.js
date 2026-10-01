export const PRESETS = [
  { name: "Pune", region: "Maharashtra", lat: 18.5204, lon: 73.8567 },
  { name: "Baramati", region: "Maharashtra", lat: 18.1517, lon: 74.577 },
  { name: "Nashik", region: "Maharashtra", lat: 19.9975, lon: 73.7898 },
  { name: "Ludhiana", region: "Punjab", lat: 30.901, lon: 75.8573 },
  { name: "Mysuru", region: "Karnataka", lat: 12.2958, lon: 76.6394 },
  { name: "Varanasi", region: "Uttar Pradesh", lat: 25.3176, lon: 82.9739 },
];
export const DEMO_IDS = [
  "downscaling",
  "satellite",
  "boundaries",
  "evidence",
  "alerts",
];
export const LOCKED = [
  {
    name: "ConvCNP downscaling",
    icon: "brain",
    tag: "MODEL",
    description:
      "Learn Panchayat-scale rainfall from issued forecasts, station context and terrain.",
    requirements:
      "Needs an issued-forecast archive, station observations, trained weights, geographical holdouts and calibrated area-level outputs.",
  },
  {
    name: "Satellite ingestion",
    icon: "satellite",
    tag: "GEOSPATIAL",
    description:
      "Bring satellite rainfall, terrain and land-cover features into the forecast pipeline.",
    requirements:
      "Needs authorised source adapters, issue-time latency checks, cloud geospatial jobs and versioned feature outputs. The moving landscape in this prototype is illustrative artwork.",
  },
  {
    name: "Panchayat boundaries",
    icon: "map",
    tag: "GEOGRAPHY",
    description:
      "Aggregate local estimates within verified administrative boundaries.",
    requirements:
      "Needs an authorised polygon dataset, LGD identifier mapping and complete area-support validation. Current maps show forecast query coordinates.",
  },
  {
    name: "Model evidence",
    icon: "chart",
    tag: "VALIDATION",
    description:
      "Inspect regional holdouts, reliability, uncertainty and model versions.",
    requirements:
      "Needs completed chronological and geographical evaluation. No accuracy scores or pilot outcomes are being claimed.",
  },
  {
    name: "Village alerts",
    icon: "bell",
    tag: "DELIVERY",
    description:
      "Share approved advisories through SMS and WhatsApp subscriptions.",
    requirements:
      "Needs opt-in contacts, approved message templates, a delivery integration and an officer approval workflow.",
  },
].map((feature, index) => ({ ...feature, id: DEMO_IDS[index] }));
export function weatherLabel(code) {
  if (code == null) return "Awaiting forecast";
  if (code === 0) return "Clear sky";
  if (code <= 3) return "Partly cloudy";
  if (code <= 48) return "Misty";
  if (code <= 67) return "Rain expected";
  if (code <= 77) return "Snow";
  if (code <= 82) return "Rain showers";
  return "Thunderstorms";
}
export const fmt = (value, digits = 0) =>
  value == null || !Number.isFinite(Number(value))
    ? "—"
    : Number(value).toFixed(digits);
export const day = (date) =>
  new Date(date + "T12:00:00").toLocaleDateString("en-IN", {
    weekday: "short",
  });
export const shortDate = (date) =>
  new Date(date + "T12:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
