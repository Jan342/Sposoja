import { useContext, useEffect, useState } from "react";
import Racket from "./Racket";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import { ServerRequest } from "../types/ServerRequest";
import { UserContext } from "../contexts/userContext";
import ClubDetails from "./ClubDetails";
import { Navigate, useNavigate } from "react-router-dom";
import ConfirmPopUp from "./ConfirmDialog";
import ListGroup from "react-bootstrap/ListGroup";
import { Link } from "react-router-dom";
import Badge from "react-bootstrap/Badge";

type ClubData = {
    _id: string;
    firstname: string;
    lastname: string;
    username: string;
    clubName: string;
    address: string;
    packageCount: Number;
}

type RacketData = {
    _id: string;
    model: string;
    description?: string;
    rated?: number;
    path?: string;
    rented?: boolean;
    owner?: string;
};

function UserDashboard(){
    const userContext = useContext(UserContext);
    const [clubs, setClubs] = useState<ClubData[]>([]);
    const [rackets, setRackets] = useState<RacketData[]>([]);
    const [selectedClub, setSelectedClub] = useState<ClubData | null>(null);
    const [showPopup, setShowPopup] = useState(false);
    const [reload, setReload] = useState(false);
    const [message, setMessage] = useState<string>("");
    const [error, setError] = useState<string>("");
    const nav = useNavigate();

    const [rekreativniRackets, setRekreativniRackets] = useState<RacketData[]>([]);

    useEffect(function(){
        if(userContext.user?.role == 'rekreativec'){
            const loadClubs = async function(){
                const res = new ServerRequest(`clubs`);
                const data = await (await res.get()).json();
                setClubs(data || []);
            };
            loadClubs();
        }
        else if(userContext.user?.role == 'clan'){
            // Naloži loparje kluba (zgoraj)
            const loadClubRackets = async function(){
                const res = new ServerRequest(`clubs/clubRackets`);
                const data = await (await res.get()).json();
                const clubOnly = (data || []).filter((r: any) => r.audienceType === 'klub');
                setRackets(clubOnly);
            };
            loadClubRackets();

            // Naloži rekreativne loparje (spodaj)
            const loadRekreativni = async function(){
                const res = new ServerRequest(`rackets`);
                const data = await (await res.get()).json();
                const recreational = data.filter((r: any) => r.audienceType === 'rekreativec' && !r.rented);
                setRekreativniRackets(recreational);
            };
            loadRekreativni();
        }
    }, [userContext.user?.role, reload]);


    async function joinClub(club: ClubData){
        setSelectedClub(null)
        const res = new ServerRequest('clubs/joinClub');
        const data = await (await res.post({club_id: club._id})).json();
        if(data && userContext.user?.accountType === "person"){
            userContext.setUserContext({
                ...userContext.user,
                joinedClub: club._id,
                role: "clan"
            });
        }
    }

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

    if(userContext?.user?.role == 'clan'){
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
                    
                    <h4 className="fw-bold mb-3 text-black">Klubski loparji:</h4>
                    <Row>
                        {rackets.length > 0 ? rackets.map((racket: any) => (
                            <Col key={racket._id} xs={12} sm={6} md={4} className="mb-4">
                                <Racket racket={racket} onRentSuccess={refreshRackets} />
                            </Col>
                        )) : <Col><p className="text-muted">Trenutno ni na voljo klubskih loparjev.</p></Col>}
                    </Row>

                    <h4 className="fw-bold mt-5 mb-3 text-black">Rekreativni loparji:</h4>
                    <Row>
                        {rekreativniRackets.length > 0 ? rekreativniRackets.map((racket: any) => (
                            <Col key={racket._id} xs={12} sm={6} md={4} className="mb-4">
                                <Racket racket={racket} onRentSuccess={refreshRackets} />
                            </Col>
                        )) : <Col><p className="text-muted">Trenutno ni na voljo rekreativnih loparjev.</p></Col>}
                    </Row>
                </div>
            )}
        </Container>
        )
    }
    
    return(
        <>
        <Row>
            {clubs.map((club) => (
                <Col key={club._id} xs={12} md={6} className="mb-4">
                    <Card bg="dark" text="white" className="shadow-sm h-100">
                        <Card.Img
                            variant="top"
                            src={"../../public/racket.jpg"}
                            style={{height: "220px", objectFit: "cover"}}
                        />
                        <Card.Body>
                            <Card.Title>{club.clubName}</Card.Title>
                            <div className="d-flex gap-3">
                                <Button onClick={() => nav(`/clubs/${club._id}`)}>Podrobnosti</Button>
                                <Button onClick={() => setSelectedClub(club)}>Včlani se</Button>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            ))}
        </Row>

        <ConfirmPopUp
            show={selectedClub !== null}
            text="Ali se želite včlaniti?"
            onClose={() => setShowPopup(false)}
            onConfirm={() => joinClub(selectedClub as ClubData)}
        />
    </>
    );
}

export default UserDashboard;