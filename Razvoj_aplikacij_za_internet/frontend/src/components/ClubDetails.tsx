import { useEffect, useState } from "react";
import { Alert, Button, Card, Col, Container, Row, Spinner } from "react-bootstrap";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ServerRequest } from "../types/ServerRequest";
import type { ClubData } from "../types/other_types";

type ClubDetailsState = {
    club?: ClubData;
};

function ClubDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const stateClub = (location.state as ClubDetailsState | null)?.club;

    const [club, setClub] = useState<ClubData | null>(stateClub || null);
    const [loading, setLoading] = useState(!stateClub);
    const [error, setError] = useState("");

    useEffect(() => {
        if (stateClub || !id) {
            setLoading(false);
            return;
        }

        async function loadClub() {
            try {
                const response = await new ServerRequest("clubs").get();
                const data = await response.json();
                const foundClub = Array.isArray(data)
                    ? data.find((item: ClubData) => item._id === id)
                    : null;

                if (!foundClub) {
                    setError("Klub ni bil najden.");
                    return;
                }

                setClub(foundClub);
            } catch (err) {
                setError("Napaka pri nalaganju kluba.");
            } finally {
                setLoading(false);
            }
        }

        loadClub();
    }, [id, stateClub]);

    if (loading) {
        return (
            <Container className="py-5 text-center">
                <Spinner />
            </Container>
        );
    }

    if (error || !club) {
        return (
            <Container className="py-5" style={{ maxWidth: "900px" }}>
                <Button variant="outline-secondary" className="mb-4" onClick={() => navigate(-1)}>
                    Nazaj
                </Button>
                <Alert variant="danger">{error || "Klub ni bil najden."}</Alert>
            </Container>
        );
    }

    return (
        <Container className="py-5" style={{ maxWidth: "1000px" }}>
            <Button variant="outline-secondary" className="mb-4" onClick={() => navigate(-1)}>
                Nazaj
            </Button>

            <Row className="g-4 text-start">
                <Col md={6}>
                    <Card className="h-100 border-0 shadow-sm">
                        <Card.Body className="p-4">
                            <h4 className="fw-bold mb-3">Osnovni podatki</h4>
                            <p className="mb-2">
                                <span className="text-muted d-block">Uporabnisko ime</span>
                                <strong>{club.username}</strong>
                            </p>
                            <p className="mb-2">
                                <span className="text-muted d-block">Lokacija</span>
                                <strong>{club.address || "Ni vpisana"}</strong>
                            </p>
                            <p className="mb-0">
                                <span className="text-muted d-block">Paketniki</span>
                                <strong>{String(club.packageCount ?? 0)}</strong>
                            </p>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={6}>
                    <Card className="h-100 border-0 shadow-sm">
                        <Card.Body className="p-4">
                            <h4 className="fw-bold mb-3">Izposoja</h4>
                            <p className="text-muted">
                                Po vclanitvi lahko uporabnik dostopa do klubskih paketnikov in opreme,
                                ki jo klub ponuja svojim clanom.
                            </p>
                            <Button variant="primary" onClick={() => navigate("/dashboard")}>
                                Nazaj na seznam klubov
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default ClubDetails;
