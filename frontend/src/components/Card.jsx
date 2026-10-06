// carte blanche avec un titre
function Card({ title, subtitle, children }) {
  return (
    <div className="card">
      <h1>{title}</h1>
      {subtitle && <p className="card-sub">{subtitle}</p>}
      {children}
    </div>
  );
}

export default Card;
