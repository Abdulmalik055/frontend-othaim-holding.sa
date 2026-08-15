export function PublicUnavailable({ title, message }: { title: string; message: string }) {
  return (
    <main id="main-content" className="ogc-public-error" aria-labelledby="public-unavailable-title">
      <div>
        <h1 id="public-unavailable-title">{title}</h1>
        <p>{message}</p>
      </div>
    </main>
  );
}
