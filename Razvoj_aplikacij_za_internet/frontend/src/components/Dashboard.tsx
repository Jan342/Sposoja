import { useContext, useState, useEffect } from "react";
import { UserContext } from "../contexts/userContext";
import { Container, Card, Button, Alert, Row, Col, Badge, ListGroup } from "react-bootstrap";
import { Link } from "react-router-dom";
import Racket from "./Racket"; 

function Dashboard() {
    const context = useContext(UserContext);
    const user = context && context.user ? (context.user as any) : null;

    const [rackets, setRackets] = useState<any[]>([]);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    async function refreshRackets(updatedUser?: any) {
        if (updatedUser) {
            if (context && context.setUserContext) {
                context.setUserContext(updatedUser);
            } else if (context && (context as any).setUser) {
                (context as any).setUser(updatedUser);
            }
            return;
        }

        try {
            const res = await fetch("http://localhost:3001/rackets", {
                credentials: "include"
            });
            
            if (res.ok) {
                const data = await res.json();
                console.log("Podatki iz backenda:", data);

                let availableRackets = data.filter((r: any) => r.rented === false || r.rented === undefined);

                if (user && (user.role === "club" || user.isClubMember)) {
                    setRackets(availableRackets);
                } else {
                    const publicRackets = availableRackets.filter((r: any) => !r.isClubOnly);
                    setRackets(publicRackets);
                }
            } else {
                console.error("Backend je vrnil status napake:", res.status);
            }
        } catch (err) {
            console.error("Frontend ne more doseči backenda:", err);
        }
    }

    useEffect(() => {
        if (user && !user.rented) {
            refreshRackets();
        }
    }, [user]);

    async function handleReturnRacket() {
        if (!window.confirm("Ali res želiš vrniti ta lopar nazaj v omarico?")) return;

        setMessage("");
        setError("");

        try {
            const res = await fetch("http://localhost:3001/users/returnRacket", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" }
            });
            const data = await res.json();

            if (res.ok) {
                setMessage("Lopar je bil uspešno vrnjen!");
                if (context && context.setUserContext) {
                    context.setUserContext(data);
                } else if (context && (context as any).setUser) {
                    (context as any).setUser(data);
                }
            } else {
                setError(data.error || "Vračanje loparja ni uspelo.");
            }
        } catch (err) {
            console.error(err);
            setError("Napaka pri povezavi s strežnikom.");
        }
    }

    return (
        <Container className="mt-5" style={{ maxWidth: "1000px" }}>
            <div className="mb-4 text-start d-flex justify-content-between align-items-center">
                <div>
                    <h1 className="fw-bold m-0">Teniški kotiček</h1>
                    <p className="text-muted m-0">Uporabnik: {user?.username || "Igralec"}</p>
                </div>
                <Badge bg={user?.rented ? "warning" : "success"} className="p-2 fs-6">
                    {user?.rented ? "⚠️ Status: Lopar izposojen" : "✅ Status: Prosto"}
                </Badge>
            </div>

            {message && <Alert variant="success" dismissible onClose={() => setMessage("")}>{message}</Alert>}
            {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}

            {user && user.rented ? (
                <Row className="g-4 text-start match-heights">
                    <Col xs={12} md={7}>
                        <Card bg="dark" text="white" className="border-0 shadow-lg h-100 bg-gradient">
                            <Card.Body className="d-flex flex-column">
                                <div className="flex-grow-1">
                                    <div className="d-flex align-items-center mb-4">
                                        <div className="bg-warning bg-opacity-10 p-3 rounded-circle me-3 flex-shrink-0">
                                            <span style={{ fontSize: "2rem" }}>🎾</span>
                                        </div>
                                        <div>
                                            <Card.Subtitle className="text-warning text-uppercase fw-bold mb-1" style={{ letterSpacing: "1px", fontSize: "0.85rem" }}>
                                                Tvoja aktivna izposoja
                                            </Card.Subtitle>
                                            <Card.Title as="h3" className="fw-bold m-0 text-white">
                                                {typeof user.rented === "object" ? user.rented.name : "Izposojeni lopar"}
                                            </Card.Title>
                                        </div>
                                    </div>
                                    <hr className="border-secondary my-3" />
                                    <div className="bg-secondary bg-opacity-10 p-3 rounded mb-4">
                                        <p className="mb-2"><strong>Tip opreme:</strong> Teniški lopar</p>
                                        <p className="mb-2"><strong>Čas izposoje:</strong> Danes (Aktivno)</p>
                                        <p className="mb-0 text-white-50 text-break">
                                            <small>ID: </small>
                                            <code className="text-warning bg-dark px-2 py-1 rounded d-inline-block text-break">
                                                {typeof user.rented === "object" ? user.rented._id : user.rented}
                                            </code>
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-auto pt-2">
                                    <Button 
                                        variant="danger" 
                                        size="lg" 
                                        className="w-100 fw-bold shadow" 
                                        onClick={handleReturnRacket}
                                    >
                                        ↩ Vrni lopar v omarico
                                    </Button>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col xs={12} md={5}>
                        <Card bg="dark" text="white" className="border-0 shadow h-100 p-2">
                            <Card.Body className="d-flex flex-column justify-content-between">
                                <div>
                                    <Card.Title className="fw-bold mb-3">Pravila omarice</Card.Title>
                                    <ListGroup variant="flush" className="bg-transparent text-white mb-3">
                                        <ListGroup.Item className="bg-transparent text-white border-secondary px-0 py-2">
                                            • Hkrati imaš lahko izposojen le <strong>1 lopar</strong>.
                                        </ListGroup.Item>
                                        <ListGroup.Item className="bg-transparent text-white border-secondary px-0 py-2">
                                            • Lopar po zaključeni igri vrni, da ga lahko uporabljajo drugi.
                                        </ListGroup.Item>
                                        <ListGroup.Item className="bg-transparent text-white border-secondary px-0 py-2">
                                            • V primeru poškodbe opreme obvesti skrbnika kluba.
                                        </ListGroup.Item>
                                    </ListGroup>
                                </div>
                                <div className="mt-auto p-3 rounded text-center" style={{ background: "linear-gradient(135deg, #2c3e50, #0d6efd)" }}>
                                    <h5 className="fw-bold mb-1">Potrebuješ igrišče?</h5>
                                    <p className="small text-white-50 mb-3">Preveri proste termine in rezerviraj svojo uro.</p>
                                    <Link to="/reservations" className="btn btn-light btn-sm fw-bold w-100">
                                        📅 Rezervacija igrišča
                                    </Link>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            ) : (
                <div className="text-start">
                    <div className="bg-dark p-4 rounded mb-4 border border-secondary border-opacity-25 shadow-sm">
                        <h3 className="fw-bold mb-2 text-white">Trenutno nimaš izposojenega nobenega loparja!</h3>
                        <p className="text-white-50 m-0">Izberi si enega izmed spodnjih razpoložljivih loparjev in začni z igro.</p>
                    </div>
                    <h4 className="fw-bold mb-3 text-white">Razpoložljivi loparji v omarici:</h4>
                    {rackets.length === 0 ? (
                        <Alert variant="secondary" className="text-center border-0 text-white-50 bg-dark">
                            Trenutno so vsi loparji izposojeni. Poskusi kasneje!
                        </Alert>
                    ) : (
                        <Row className="g-4">
                            {rackets.map((racket: any) => (
                                <Col key={racket._id} xs={12} sm={6} md={4} className="d-flex align-items-stretch">
                                    <Racket racket={racket} onRentSuccess={refreshRackets}/>
                                </Col>
                            ))}
                        </Row>
                    )}
                </div>
            )}
        </Container>
    );
}

export default Dashboard;