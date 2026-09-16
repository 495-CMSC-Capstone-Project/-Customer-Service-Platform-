import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <section className="page">
      <h1>Page not found</h1>
      <p>That route is not part of the customer interface prototype.</p>
      <Link to="/" className="button button--secondary">
        Back home
      </Link>
    </section>
  );
}
