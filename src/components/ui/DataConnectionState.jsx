import { Icon } from "./Icon";

const STATE_COPY = {
  loading: {
    icon: "rotate",
    title: "Menghubungkan ke Snowflake",
  },
  disconnected: {
    icon: "plug-circle-xmark",
    title: "Snowflake belum terhubung",
  },
  empty: {
    icon: "database",
    title: "Belum ada data untuk ditampilkan",
  },
};

export function DataConnectionState({ status, message, onRetry }) {
  const copy = STATE_COPY[status] || STATE_COPY.disconnected;

  return (
    <section
      className={`data-connection-state data-connection-state--${status}`}
      role="status"
    >
      <div className="data-connection-state__icon">
        <Icon name={copy.icon} />
      </div>
      <h2>{copy.title}</h2>
      <p>{message}</p>
      {onRetry && status !== "loading" && (
        <button
          className="button button--ghost button--icon"
          type="button"
          onClick={onRetry}
        >
          <Icon name="rotate" /> Coba lagi
        </button>
      )}
    </section>
  );
}
