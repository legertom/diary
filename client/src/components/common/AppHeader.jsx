import './AppHeader.css';

const AppHeader = ({ title, children }) => {
  return (
    <header className="app-header">
      <h1>{title}</h1>
      {children && <div className="user-info">{children}</div>}
    </header>
  );
};

export default AppHeader;

