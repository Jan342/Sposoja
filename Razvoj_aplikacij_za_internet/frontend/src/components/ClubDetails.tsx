import { Badge, Button, Card, Col, Container, Row } from "react-bootstrap";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import type { ClubData } from "../types/other_types";

type ClubDetailsState = {
    club?: ClubData;
};

function ClubDetails() {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();
    const club = (location.state as ClubDetailsState | null)?.club;

    if (!club) {
        return (
            <Container className="py-5" style={{ maxWidth: "900px" }}>
                <Button variant="outline-secondary" className="mb-4" onClick={() => navigate(-1)}>
                    Nazaj
                </Button>

                <Card className="border-0 shadow-sm">
                    <Card.Body className="p-4 p-md-5 text-start">
                        <Badge bg="secondary" className="mb-3">Klub</Badge>
                        <h1 className="fw-bold mb-3">Podrobnosti kluba</h1>
                        <p className="text-muted mb-0">
                            Podatki za klub niso bili preneseni. Vrni se na seznam klubov in ponovno odpri podrobnosti.
                        </p>
                        {id && (
                            <p className="text-muted mt-3 mb-0">
                                ID kluba: <code>{id}</code>
                            </p>
                        )}
                    </Card.Body>
                </Card>
            </Container>
        );
    }

    const ownerName = [club.firstname, club.lastname].filter(Boolean).join(" ");

    return (
        <Container className="py-5" style={{ maxWidth: "1000px" }}>
            <Button variant="outline-secondary" className="mb-4" onClick={() => navigate(-1)}>
                Nazaj
            </Button>

            <Card bg="dark" text="white" className="border-0 shadow-lg overflow-hidden">
                <Card.Body className="p-4 p-md-5 text-start">
                    <Row className="align-items-center g-4">
                        <Col md={8}>
                            <Badge bg="primary" className="mb-3">Tennis klub</Badge>
                            <h1 className="fw-bold mb-2">{club.clubName}</h1>
                            <p className="text-white-50 fs-5 mb-0">
                                {club.address || "Lokacija kluba ni vpisana."}
                            </p>
                        </Col>

                        <Col md={4}>
                            <div className="bg-white bg-opacity-10 rounded p-4 h-100">
                                <p className="text-white-50 mb-1">Stevilo paketnikov</p>
                                <div className="display-5 fw-bold">{String(club.packageCount ?? 0)}</div>
                            </div>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            <Row className="g-4 mt-1 text-start">
                <Col md={6}>
                    <Card className="h-100 border-0 shadow-sm">
                        <Card.Body className="p-4">
                            <h4 className="fw-bold mb-3">Osnovni podatki</h4>
                            <div className="mb-3">
                                <div className="text-muted small">Uporabnisko ime</div>
                                <div className="fw-semibold">{club.username}</div>
                            </div>
                            <div className="mb-3">
                                <div className="text-muted small">Kontaktna oseba</div>
                                <div className="fw-semibold">{ownerName || "Ni vpisano"}</div>
                            </div>
                            <div>
                                <div className="text-muted small">ID kluba</div>
                                <code>{club._id}</code>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={6}>
                    <Card className="h-100 border-0 shadow-sm">
                        <Card.Body className="p-4">
                            <h4 className="fw-bold mb-3">Izposoja</h4>
                            <p className="text-muted">
                                V tem klubu se lahko vclanis in nato uporabljas klubske loparje ter paketnike,
                                ki jih klub dodeli svojim clanom.
                            </p>
                            <div className="d-flex gap-2 flex-wrap">
                                <Button variant="primary" onClick={() => navigate("/dashboard")}>
                                    Nazaj na klube
                                </Button>
                                <Button variant="outline-secondary" onClick={() => navigate("/profile")}>
                                    Moj profil
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default ClubDetails;
