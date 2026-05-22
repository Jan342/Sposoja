import { useContext, useEffect, useState } from "react";
import Racket from "./Racket";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import ListGroup from "react-bootstrap/ListGroup";
import { ServerRequest } from "../types/ServerRequest";
import { UserContext } from "../contexts/userContext";
import UserDashboard from "./UserDashboard";
import { Link } from "react-router-dom";
import Badge from "react-bootstrap/Badge";

type Package = {
    _id: string;
    name: string;
    location: string;
    racketLimit: number;
    racketTotal: number;
};

type RacketData = {
    _id: string;
    model: string;
    description?: string;
    rated?: number;
    path?: string;
    rented?: boolean;
    owner?: string;
};

function Dashboard(){
    const userContext = useContext(UserContext);
    const isClub = userContext.user?.accountType === "club";
    const [rackets, setRackets] = useState<RacketData[]>([]);
    const [packages, setPackages] = useState<Package[]>([]);
    const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
    const [packageRackets, setPackageRackets] = useState<RacketData[]>([]);
    const [reload, setReload] = useState(false);
    const [message, setMessage] = useState<string>("");
    const [error, setError] = useState<string>("");

    useEffect(function(){
        const loadDashboard = async function(){
            if (isClub) {
                const res = new ServerRequest('rackets/packages');
                const data = await (await res.get()).json();
                setPackages(data.packages || []);

                if (data.packages && data.packages.length > 0) {
                    setSelectedPackage(data.packages[0]);
                }

                return;
            }

            const res = new ServerRequest('rackets')
            const data = await (await res.get()).json();
            setRackets(data);
        }
        loadDashboard();
    }, [reload, isClub]);

    useEffect(function(){
        if (!selectedPackage) {
            setPackageRackets([]);
            return;
        }

        const loadPackageRackets = async function(){
            const res = new ServerRequest(`rackets/packages/${selectedPackage._id}/rackets`);
            const data = await (await res.get()).json();
            setPackageRackets(data.rackets || []);
        };

        loadPackageRackets();
    }, [selectedPackage]);

    const refreshRackets = () => {
        setReload(prev => !prev);
    };
    const user = userContext.user as any;
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
            const contextAsAny = userContext as any;
            if (res.ok) {
                setMessage("Lopar je bil uspešno vrnjen!");
            if (contextAsAny?.setUserContext) contextAsAny.setUserContext(data);
            else if (contextAsAny?.setUser) contextAsAny.setUser(data);
             refreshRackets();
            } else {
                setError(data.error || "Vračanje loparja ni uspelo.");
            }
        } catch (err) {
            console.error(err);
            setError("Napaka pri povezavi s strežnikom.");
        }
    }
    if (isClub) {
        return(
            <Container className="py-4">
                <h2 className="mb-4">Nadzorna plošča kluba</h2>
                <Row className="g-4">
                    <Col lg={4}>
                        <h4>Paketniki</h4>
                        {packages.length === 0 ? (
                            <Alert variant="info">Klub še nima dodanih paketnikov.</Alert>
                        ) : (
                            packages.map((packageItem) => (
                                <Card
                                    key={packageItem._id}
                                    className="mb-3 shadow-sm"
                                    border={selectedPackage?._id === packageItem._id ? "primary" : undefined}
                                >
                                    <Card.Body>
                                        <Card.Title>{packageItem.name}</Card.Title>
                                        <Card.Text>
                                            {packageItem.location}<br />
                                            Loparji: {packageItem.racketTotal} / {packageItem.racketLimit}
                                        </Card.Text>
                                        <Button
                                            type="button"
                                            variant={selectedPackage?._id === packageItem._id ? "primary" : "outline-primary"}
                                            onClick={() => setSelectedPackage(packageItem)}
                                        >
                                            Prikaži loparje
                                        </Button>
                                    </Card.Body>
                                </Card>
                            ))
                        )}
                    </Col>

                    <Col lg={8}>
                        <h4>
                            {selectedPackage ? `Loparji v paketniku: ${selectedPackage.name}` : "Loparji"}
                        </h4>

                        {!selectedPackage ? (
                            <Alert variant="secondary">Izberi paketnik za prikaz loparjev.</Alert>
                        ) : packageRackets.length === 0 ? (
                            <Alert variant="secondary">Ta paketnik še nima dodanih loparjev.</Alert>
                        ) : (
                            <Row>
                                {packageRackets.map((racket) => (
                                    <Col key={racket._id} xs={12} md={6} className="mb-4">
                                        <Card bg="dark" text="white" className="shadow-sm h-100">
                                            {racket.path && (
                                                <Card.Img
                                                    variant="top"
                                                    src={"http://localhost:3001/" + racket.path}
                                                    style={{height: "220px", objectFit: "cover"}}
                                                />
                                            )}
                                            <Card.Body>
                                                <Card.Title>{racket.model}</Card.Title>
                                                <Card.Text>
                                                    <strong>Opis:</strong> {racket.description || "Ni opisa"}<br />
                                                    <strong>Ocena:</strong> {racket.rated ?? 0}<br />
                                                    <strong>Status:</strong> {racket.rented ? "Izposojen" : "Na voljo"}<br />
                                                    <strong>Lastnik:</strong> {racket.owner || "klub"}
                                                </Card.Text>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        )}
                    </Col>
                </Row>
            </Container>
            
        );
    }
    return (
        <Container className="mt-5" style={{ maxWidth: "1000px" }}>
            <div className="mb-4 text-start d-flex justify-content-between align-items-center">
                <div>
                    <h1 className="fw-bold m-0">Loparji za isposojo</h1>
                    <p className="text-muted m-0">Uporabnik: {user?.username || "Igralec"}</p>
                </div>
                <Badge bg={user?.rented ? "warning" : "success"} className="p-2 fs-6">
                    {user?.rented ? "⚠️ Status: Lopar izposojen" : "✅ Status: Prosto"}
                </Badge>
            </div>

            {user && user.rented ? (
                <Row className="g-4 text-start">
                    <Col xs={12} md={7}>
                        <Card bg="dark" text="white" className="border-0 shadow-lg p-4 h-100 bg-gradient">
                            <Card.Body className="d-flex flex-column justify-content-between">
                                <div>
                                    <div className="d-flex align-items-center mb-4">
                                        <div className="bg-warning bg-opacity-10 p-3 rounded-circle me-3">
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
                    <Col xs={12} md={5}>
                        <Card bg="dark" text="white" className="border-0 shadow h-100 p-3">
                            <Card.Body>
                                <Card.Title className="fw-bold mb-3">📌 Pravila omarice</Card.Title>
                                <ListGroup variant="flush" className="bg-transparent text-white">
                                    <ListGroup.Item className="bg-transparent text-white border-secondary px-0 py-2">• Hkrati imaš lahko izposojen le <strong>1 lopar</strong>.</ListGroup.Item>
                                    <ListGroup.Item className="bg-transparent text-white border-secondary px-0 py-2">• Lopar po zaključeni igri vrni.</ListGroup.Item>
                                    <ListGroup.Item className="bg-transparent text-white border-secondary px-0 py-2">• V primeru poškodbe obvesti skrbnika.</ListGroup.Item>
                                </ListGroup>
                                <div className="mt-4 p-3 rounded text-center" style={{ background: "linear-gradient(135deg, #2c3e50, #0d6efd)" }}>
                                    <h5 className="fw-bold mb-1">Potrebuješ igrišče?</h5>
                                    <Link to="/reservations" className="btn btn-light btn-sm fw-bold w-100">📅 Rezervacija igrišča</Link>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            ) : (
                <div className="text-start">
                    <div className="bg-dark p-4 rounded mb-4 border border-secondary border-opacity-25 shadow-sm">
                        <h3 className="fw-bold mb-2 text-white">Trenutno nimaš izposojenega nobenega loparja 🎒</h3>
                    </div>
                    <h4 className="fw-bold mb-3 text-white">Razpoložljivi loparji:</h4>
                    <Row>
                        {rackets.map((racket: any) => (
                            <Col key={racket._id} xs={12} sm={6} md={4} className="mb-4">
                                <Racket racket={racket} onRentSuccess={() => window.location.reload()} />
                            </Col>
                        ))}
                    </Row>
                </div>
            )}
        </Container>
    );*/

    return(
       <UserDashboard/>
    );
}
export default Dashboard;
