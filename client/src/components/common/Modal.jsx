import './Modal.css';

const Modal = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;

  return (
    <div className="modal" onClick={(e) => e.target.className === 'modal' && onClose()}>
      <div className="modal-content">
        {title && (
          <div className="modal-header">
            <h2>{title}</h2>
          </div>
        )}
        <button className="modal-close" onClick={onClose}>×</button>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;

