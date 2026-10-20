import { MINERAL_OPTIONS, PERIOD_OPTIONS, PIT_OPTIONS, SHIFT_OPTIONS } from "../../data/dashboard";
import { Icon } from "./Icon";

function FilterSelect({ label, value, options, onChange }) {
  return (
    <label className="filter-field">
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => {
          const optionValue = typeof option === "string" ? option : option.value;
          const optionLabel = typeof option === "string" ? option : option.label;
          return (
            <option
              value={optionValue}
              key={optionValue}
            >
              {optionLabel}
            </option>
          );
        })}
      </select>
    </label>
  );
}

export function FilterBar({ filters, onChange, onReset, onRefresh, syncTime }) {
  return (
    <section
      className="filter-bar card-surface"
      aria-label="Filter operasi"
    >
      <div className="filter-bar__identity">
        <span className="filter-bar__icon">
          <Icon name="sliders" />
        </span>
        <div>
          <strong>Filter tampilan</strong>
          <span>Berlaku untuk semua modul</span>
        </div>
      </div>
      <div className="filter-bar__fields">
        <FilterSelect
          label="Periode"
          value={filters.period}
          options={PERIOD_OPTIONS}
          onChange={(value) => onChange("period", value)}
        />
        <FilterSelect
          label="Mineral"
          value={filters.mineral}
          options={MINERAL_OPTIONS}
          onChange={(value) => onChange("mineral", value)}
        />
        <FilterSelect
          label="Pit / area"
          value={filters.pit}
          options={PIT_OPTIONS}
          onChange={(value) => onChange("pit", value)}
        />
        <FilterSelect
          label="Shift"
          value={filters.shift}
          options={SHIFT_OPTIONS}
          onChange={(value) => onChange("shift", value)}
        />
      </div>
      <div className="filter-bar__actions">
        <button
          className="button button--ghost"
          type="button"
          onClick={onReset}
        >
          Reset
        </button>
        <button
          className="button button--primary button--icon"
          type="button"
          onClick={onRefresh}
        >
          <Icon name="rotate" />
          Refresh
        </button>
        <span className="filter-bar__sync">Synced {syncTime}</span>
      </div>
    </section>
  );
}
