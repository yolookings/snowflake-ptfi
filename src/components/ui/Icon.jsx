export function Icon({ name, type = "fas", className = "", title }) {
  return (
    <i
      className={`${type} fa-${name} ${className}`.trim()}
      aria-hidden={title ? undefined : "true"}
      title={title}
    />
  );
}
