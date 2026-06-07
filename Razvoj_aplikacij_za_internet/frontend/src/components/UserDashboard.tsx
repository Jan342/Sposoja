import { useContext, useEffect, useState } from "react";
import Racket from "./Racket";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import Alert from "react-bootstrap/Alert";
import Badge from "react-bootstrap/Badge";
import ListGroup from "react-bootstrap/ListGroup";
import { ServerRequest } from "../types/ServerRequest";
import { UserContext } from "../contexts/userContext";
import { useNavigate } from "react-router-dom";
import { usePopup } from "../contexts/popupContext";
import type { ClubData, Package, RacketData } from "../types/other_types";

function UserDashboard(props) {
    const userContext = useContext(UserContext);
    const [clubs, setClubs] = useState<ClubData[]>([]);
    const [reload, setReload] = useState(false);
    const [message, setMessage] = useState<string>("");
    const [error, setError] = useState<string>("");
    const getPopup = usePopup();
    const nav = useNavigate();

    const [packages, setPackages] = useState<Package[]>([]);
    const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
    const [packageRackets, setPackageRackets] = useState<RacketData[]>([]);
    const [packagesLoading, setPackagesLoading] = useState(false);
    const [racketsLoading, setRacketsLoading] = useState(false);

    const [rekreativniRackets, setRekreativniRackets] = useState<RacketData[]>([]);

    useEffect(function () {
        if (userContext.user?.role === 'rekreativec') {
            const loadClubs = async () => {
                const res = new ServerRequest(`clubs`);
                const data = await (await res.get()).json();
                setClubs(data || []);
            };
            loadClubs();
        } else if (userContext.user?.role === 'clan') {
            const loadPackages = async () => {
                setPackagesLoading(true);
                try {
                    const res = new ServerRequest(`clubs/memberPackages`);
                    const data = await (await res.get()).json();
                    setPackages(data.packages || []);
                } catch (err) {
                    console.error("Napaka pri nalaganju paketnikov:", err);
                } finally {
                    setPackagesLoading(false);
                }
            };
            loadPackages();
        }
    }, [userContext.user?.role, reload]);

    useEffect(function () {
        if (!selectedPackage) {
            setPackageRackets([]);
            return;
        }
        const loadRackets = async () => {
            setRacketsLoading(true);
            try {
                const res = new ServerRequest(`clubs/memberPackages/${selectedPackage._id}/rackets`);
                const data = await (await res.get()).json();
                setPackageRackets(data.rackets || []);
            } catch (err) {
                console.error("Napaka pri nalaganju loparjev:", err);
                setPackageRackets([]);
            } finally {
                setRacketsLoading(false);
            }
        };
        loadRackets();
    }, [selectedPackage, reload]);

    const refreshRackets = () => setReload(prev => !prev);

    const user = userContext.user as any;

    async function handleRentPackage(pkg: Package) {
        setMessage(""); setError("");
        try {
            const res = new ServerRequest("clubs/rentPackage");
            const responseObj = await res.post({ packageId: pkg._id });
            const data = await responseObj.json();
            const ctx = userContext as any;
            if (responseObj.status === 200) {
                setMessage("Paketnik uspešno izposojen!");
                if (ctx?.setUserContext) ctx.setUserContext(data);
                else if (ctx?.setUser) ctx.setUser(data);
                refreshRackets();
                props.onRentSuccess?.();
            } else {
                setError(data.error || "Izposoja paketnika ni uspela.");
            }
        } catch (err) {
            setError("Napaka pri povezavi s strežnikom.");
        }
    }

    async function handleReturnRacket() {
        setMessage(""); setError("");
        try {
            const res = await fetch("http://localhost:3001/users/returnRacket", {
                method: "POST", credentials: "include",
                headers: { "Content-Type": "application/json" }
            });
            const data = await res.json();
            const ctx = userContext as any;
            if (res.ok) {
                setMessage("Vrnjeno uspešno!");
                if (ctx?.setUserContext) ctx.setUserContext(data);
                else if (ctx?.setUser) ctx.setUser(data);
                refreshRackets();
                props.onRentSuccess?.();
            } else {
                setError(data.error || "Vračanje ni uspelo.");
            }
        } catch (err) {
            setError("Napaka pri povezavi s strežnikom.");
        }
    }

    if (userContext?.user?.role === 'clan') {
        const rentedPackageObj = user?.rentedPackage;
        if (rentedPackageObj) {
            return (
                <Container className="mt-5" style={{ maxWidth: "1000px" }}>
                    <div className="mb-4 text-start d-flex justify-content-between align-items-center">
                        <div>
                            <h1 className="fw-bold m-0">Moja izposoja</h1>
                        </div>
                    </div>

                    {message && <Alert variant="success">{message}</Alert>}
                    {error && <Alert variant="danger">{error}</Alert>}

                    <Row className="g-4 text-start">
                        <Col xs={12} md={7}>
                            <Card bg="dark" text="white" className="border-0 shadow-lg p-4 h-100">
                                <Card.Body className="d-flex flex-column justify-content-between">
                                    <div>
                                        <div className="d-flex align-items-center mb-4">
                                            <div className="bg-warning bg-opacity-10 p-3 rounded-circle me-3">
                                                <span style={{ fontSize: "2rem" }}>📦</span>
                                            </div>
                                            <div>
                                                <Card.Subtitle className="text-warning text-uppercase fw-bold mb-1" style={{ letterSpacing: "1px", fontSize: "0.85rem" }}>
                                                    Tvoj aktivni paketnik
                                                </Card.Subtitle>
                                                <Card.Title as="h3" className="fw-bold m-0 text-white">
                                                    {typeof rentedPackageObj === "object" ? rentedPackageObj.name : "Izposojeni paketnik"}
                                                </Card.Title>
                                            </div>
                                        </div>
                                        <hr className="border-secondary my-3" />
                                        <div className="bg-secondary bg-opacity-10 p-3 rounded mb-4">
                                            <p className="mb-2"><strong>Tip opreme:</strong> Pametni paketnik</p>
                                            <p className="mb-2"><strong>Lokacija:</strong> {typeof rentedPackageObj === "object" ? rentedPackageObj.location : "Klub"}</p>
                                            <p className="mb-0 text-white-50">
                                                <small>ID: </small>
                                                <code className="text-warning bg-dark px-2 py-1 rounded">
                                                    {typeof rentedPackageObj === "object" ? rentedPackageObj._id : rentedPackageObj}
                                                </code>
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="danger" size="lg" className="w-100 fw-bold shadow mt-auto"
                                        onClick={() => getPopup.confirm({
                                            text: "Ali res želiš vrniti ta paketnik?",
                                            showCancel: true, onConfirm: handleReturnRacket
                                        })}
                                    >
                                        ↩ Vrni paketnik iz rezervacije
                                    </Button>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xs={12} md={5}>
                            <Card bg="dark" text="white" className="border-0 shadow h-100 p-3">
                                <Card.Body>
                                    <Card.Title className="fw-bold mb-3">📌 Pravila paketnika</Card.Title>
                                    <ListGroup variant="flush" className="bg-transparent text-white">
                                        <ListGroup.Item className="bg-transparent text-white border-secondary px-0 py-2">• Hkrati imaš lahko rezerviran le <strong>1 paketnik</strong>.</ListGroup.Item>
                                        <ListGroup.Item className="bg-transparent text-white border-secondary px-0 py-2">• Ob izposoji in vračilu preveri zasedenost.</ListGroup.Item>
                                        <ListGroup.Item className="bg-transparent text-white border-secondary px-0 py-2">• Izdelke pravočasno vrni v paketnik!</ListGroup.Item>
                                        <ListGroup.Item className="bg-transparent text-white border-secondary px-0 py-2">• Srečno igro!</ListGroup.Item>
                                    </ListGroup>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            );
        }

        return (
            <Container className="mt-5" style={{ maxWidth: "1100px" }}>
                <div className="mb-2 text-start d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div>
                        <h1 className="fw-bold m-0">
                            {selectedPackage ? (
                                <>
                                    <span
                                        className="text-primary"
                                        style={{ cursor: "pointer" }}
                                        onClick={() => setSelectedPackage(null)}
                                    >
                                        Paketniki
                                    </span>
                                    {" / "}
                                    {selectedPackage.name}
                                </>
                            ) : "Paketniki za izposojo"}
                        </h1>
                    </div>
                </div>

                {message && <Alert variant="success">{message}</Alert>}
                {error && <Alert variant="danger">{error}</Alert>}

                {!selectedPackage && (
                    <div className="mt-4">
                        {packagesLoading ? (
                            <Alert variant="secondary">Nalagam paketnike...</Alert>
                        ) : packages.length === 0 ? (
                            <Alert variant="info">Klub trenutno nima dodanih paketnikov.</Alert>
                        ) : (
                            <>
                                <p className="text-muted mb-4">Pregled paketnikov. Lahko si izposodiš paketnik ali pa pogledaš loparje v njem.</p>
                                <Row className="g-4">
                                    {packages.map((pkg) => {
                                        const isRented = !!pkg.rentedBy;
                                        return (
                                            <Col key={pkg._id} xs={12} sm={6} md={4}>
                                                <Card
                                                    bg="dark" text="white"
                                                    className="shadow h-100"
                                                    style={{
                                                        borderRadius: "14px",
                                                        transition: "transform 0.15s, box-shadow 0.15s",
                                                        border: "1px solid rgba(255,255,255,0.08)"
                                                    }}
                                                >
                                                    <Card.Body className="p-4 d-flex flex-column justify-content-between">
                                                        <div>
                                                            <div style={{ fontSize: "2.8rem" }} className="mb-3">📦</div>
                                                            <Card.Title className="fw-bold fs-5">{pkg.name}</Card.Title>
                                                            <Card.Text className="text-white-50 mb-3">
                                                                📍 {pkg.location}
                                                            </Card.Text>
                                                            <div className="d-flex gap-2 flex-wrap mb-3">
                                                                <Badge bg="secondary">
                                                                    🎾 {pkg.racketTotal} / {pkg.racketLimit} loparjev
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                        <div className="d-flex flex-column gap-2 mt-3">
                                                            <Button
                                                                variant={isRented ? "danger" : "primary"}
                                                                className="w-100"
                                                                size="sm"
                                                                disabled={isRented}
                                                                onClick={() => getPopup.confirm({
                                                                    text: `Ali si želite izposoditi paketnik "${pkg.name}"?`,
                                                                    showCancel: true,
                                                                    onConfirm: () => handleRentPackage(pkg)
                                                                })}
                                                            >
                                                                {isRented ? "🔒 Že izposojen" : "🔑 Izposodi paketnik"}
                                                            </Button>
                                                            <Button
                                                                variant="outline-light"
                                                                className="w-100"
                                                                size="sm"
                                                                onClick={() => setSelectedPackage(pkg)}
                                                            >
                                                                👁️ Poglej loparje
                                                            </Button>
                                                        </div>
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                        );
                                    })}
                                </Row>
                            </>
                        )}
                    </div>
                )}

                {selectedPackage && (
                    <div className="mt-4">
                        <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
                            <div>
                                <h4 className="fw-bold m-0">Loparji v paketniku: <span className="text-primary">{selectedPackage.name}</span></h4>
                                <small className="text-muted">📍 {selectedPackage.location}</small>
                            </div>
                            <Button variant="outline-secondary" size="sm" onClick={() => setSelectedPackage(null)}>
                                ← Nazaj na paketnike
                            </Button>
                        </div>

                        {racketsLoading ? (
                            <Alert variant="secondary">Nalagam loparje...</Alert>
                        ) : packageRackets.length === 0 ? (
                            <Alert variant="secondary">Ta paketnik trenutno nima loparjev.</Alert>
                        ) : (
                            <Row className="g-4">
                                {packageRackets.map((racket: any) => (
                                    <Col key={racket._id} xs={12} sm={6} md={4}>
                                        <Racket racket={racket} onRentSuccess={refreshRackets} />
                                    </Col>
                                ))}
                            </Row>
                        )}
                    </div>
                )}
            </Container>
        );
    }

    if (userContext?.user?.role === 'rekreativec' && user?.rented) {
        return (
            <Container className="mt-5" style={{ maxWidth: "1000px" }}>
                <div className="mb-4 text-start d-flex justify-content-between align-items-center">
                    <div>
                        <h1 className="fw-bold m-0">Moja izposoja</h1>
                        <p className="text-muted m-0">Uporabnik: {user?.username || "Rekreativec"}</p>
                    </div>
                </div>
                {message && <Alert variant="success">{message}</Alert>}
                {error && <Alert variant="danger">{error}</Alert>}
                <Row className="g-4 text-start">
                    <Col xs={12} md={7}>
                        <Card bg="dark" text="white" className="border-0 shadow-lg p-4 h-100">
                            <Card.Body className="d-flex flex-column justify-content-between">
                                <div>
                                    <div className="d-flex align-items-center mb-4">
                                        <div className="bg-warning bg-opacity-10 p-3 rounded-circle me-3">
                                            <span style={{ fontSize: "2rem" }}>🎾</span>
                                        </div>
                                        <div>
                                            <Card.Subtitle className="text-warning text-uppercase fw-bold mb-1" style={{ letterSpacing: "1px", fontSize: "0.85rem" }}>Tvoja aktivna izposoja</Card.Subtitle>
                                            <Card.Title as="h3" className="fw-bold m-0 text-white">
                                                {typeof user.rented === "object" ? user.rented.name : "Izposojeni lopar"}
                                            </Card.Title>
                                        </div>
                                    </div>
                                    <hr className="border-secondary my-3" />
                                    <div className="bg-secondary bg-opacity-10 p-3 rounded mb-4">
                                        <p className="mb-2"><strong>Tip opreme:</strong> Teniški lopar</p>
                                        <p className="mb-2"><strong>Čas izposoje:</strong> Danes (Aktivno)</p>
                                        <p className="mb-0 text-white-50">
                                            <small>ID: </small>
                                            <code className="text-warning bg-dark px-2 py-1 rounded">
                                                {typeof user.rented === "object" ? user.rented._id : user.rented}
                                            </code>
                                        </p>
                                    </div>
                                </div>
                                <Button variant="danger" size="lg" className="w-100 fw-bold shadow mt-auto" onClick={handleReturnRacket}>
                                    ↩ Vrni lopar v omarico
                                </Button>
                            </Card.Body>
                        </Card>
                    </Col>
                    {/* Tega vec ne rabimo? */}
                    <Col xs={12} md={5}>
                        <Card bg="dark" text="white" className="border-0 shadow h-100 p-3">
                            <Card.Body>
                                <Card.Title className="fw-bold mb-3">📌 Pravila omarice</Card.Title>
                                <ListGroup variant="flush" className="bg-transparent text-white">
                                    <ListGroup.Item className="bg-transparent text-white border-secondary px-0 py-2">• Hkrati imaš lahko izposojen le <strong>1 lopar</strong>.</ListGroup.Item>
                                    <ListGroup.Item className="bg-transparent text-white border-secondary px-0 py-2">• Lopar po zaključeni igri vrni.</ListGroup.Item>
                                    <ListGroup.Item className="bg-transparent text-white border-secondary px-0 py-2">• V primeru poškodbe obvesti skrbnika.</ListGroup.Item>
                                    <ListGroup.Item className="bg-transparent text-white border-secondary px-0 py-2">• Srečno igro!</ListGroup.Item>
                                </ListGroup>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        );
    }

    return (
        <Row>
            {clubs.map((club) => (
                <Col key={club._id} xs={12} md={6} className="mb-4">
                    <Card bg="dark" text="white" className="shadow-sm h-100">
                        <Card.Img variant="top" src={"../../public/racket.jpg"} style={{ height: "220px", objectFit: "cover" }} />
                        <Card.Body>
                            <Card.Title>{club.clubName}</Card.Title>
                            <div className="d-flex gap-3">
                                <Button onClick={() => nav(`/clubs/${club._id}`, { state: { club } })}>Podrobnosti</Button>
                                <Button onClick={() => getPopup.confirm({text: "Ali se želite včlaniti?",showCancel: true, onConfirm: () => joinClub(club)})}>Včlani se</Button>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            ))}
        </Row>
    );

    async function joinClub(club: ClubData) {
        const res = new ServerRequest('clubs/joinClub');
        const data = await (await res.post({ club_id: club._id })).json();
        if (data && userContext.user?.accountType === "person") {
            userContext.setUserContext({ ...userContext.user, joinedClub: club._id, role: "clan" });
        }
    }
}

export default UserDashboard;
