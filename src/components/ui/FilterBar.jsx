import { DEFAULT_FILTERS, PERIOD_OPTIONS, getFilterOptions } from "../../data/dashboard";
import { Icon } from "./Icon";

function Slicer({ label, value, options, onChange }) {
  const active = value !== DEFAULT_FILTERS[label.key];
  return (
    <label className={`slicer ${active ? "slicer--active" : ""}`}>
      <span>{label.text}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option
            value={option}
            key={option}
          >
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export function FilterBar({ data, filters, onChange, onReset, syncTime }) {
  const options = getFilterOptions(data);
  const dirty = Object.keys(DEFAULT_FILTERS).some((key) => filters[key] !== DEFAULT_FILTERS[key]);

  return (
    <section
      className="slicer-bar"
      aria-label="Filter laporan"
    >
      <div className="slicer-bar__group">
        <span className="slicer-bar__title">
          <Icon name="filter" /> Slicer
        </span>
        <div
          className="segmented"
          role="group"
          aria-label="Periode"
        >
          {PERIOD_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={filters.period === option.value ? "is-active" : ""}
              onClick={() => onChange("period", option.value)}
            >
              {option.value} hari
            </button>
          ))}
        </div>
        <Slicer
          label={{ key: "mineral", text: "Mineral" }}
          value={filters.mineral}
          options={options.mineral}
          onChange={(value) => onChange("mineral", value)}
        />
        <Slicer
          label={{ key: "pit", text: "Pit" }}
          value={filters.pit}
          options={options.pit}
          onChange={(value) => onChange("pit", value)}
        />
        <Slicer
          label={{ key: "shift", text: "Shift" }}
          value={filters.shift}
          options={options.shift}
          onChange={(value) => onChange("shift", value)}
        />
      </div>
      <div className="slicer-bar__group">
        {dirty && (
          <button
            className="button button--link"
            type="button"
            onClick={onReset}
          >
            <Icon name="eraser" /> Hapus filter
          </button>
        )}
        <span className="slicer-bar__sync">Sync {syncTime}</span>
      </div>
    </section>
  );
}
