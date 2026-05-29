import { Modal, Button } from "react-bootstrap";

function ConfirmPopUp({ show, onClose, onConfirm, text, showCancel = true }) {
    return (
        <Modal show={show} onHide={onClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>Potrditev</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                {text}
            </Modal.Body>

            <Modal.Footer>
                {showCancel && (
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                )}

                <Button variant="primary" onClick={onConfirm}>
                    OK
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default ConfirmPopUp;