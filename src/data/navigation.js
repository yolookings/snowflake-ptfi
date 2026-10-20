export const NAVIGATION = [
  { key: "overview", label: "Overview", icon: "table-cells-large" },
  {
    key: "operations",
    label: "Operations",
    icon: "industry",
    children: [
      {
        key: "production",
        label: "Production Detail",
        icon: "chart-column",
        group: "Operational views",
      },
      { key: "fleet", label: "Fleet & Equipment", icon: "truck-front", group: "Operational views" },
      { key: "logistics", label: "Logistics Control Tower", icon: "ship", group: "Supply chain" },
    ],
  },
  { key: "sql-lab", label: "Data Lab", icon: "database" },
];

export const MODULE_META = {
  overview: {
    label: "Executive Overview",
    kicker: "Overview",
    title: "Operations & Logistics Dashboard",
  },
  production: {
    label: "Production Detail",
    kicker: "Production",
    title: "Production Detail",
  },
  fleet: {
    label: "Fleet & Equipment",
    kicker: "Fleet",
    title: "Fleet & Equipment",
  },
  logistics: {
    label: "Logistics Control Tower",
    kicker: "Logistics",
    title: "Logistics Control Tower",
  },
  "sql-lab": {
    label: "Snowflake SQL Lab",
    kicker: "SQL Lab",
    title: "Snowflake SQL Lab",
  },
};
