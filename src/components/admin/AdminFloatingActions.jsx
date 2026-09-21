export default function AdminFloatingActions({ children, status }) {
  return (
    <div className="nb-admin-actions" aria-label="Səhifə əməliyyatları">
      {status ? <span className="nb-admin-actions__status">{status}</span> : null}
      <div className="nb-admin-actions__buttons">{children}</div>
    </div>
  );
}
