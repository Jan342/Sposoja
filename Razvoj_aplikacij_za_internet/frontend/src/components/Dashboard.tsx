import { useContext, useEffect, useState } from "react";
import Racket from "./Racket";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import { ServerRequest } from "../types/ServerRequest";
import { UserContext } from "../contexts/userContext";
import UserDashboard from "./UserDashboard";

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

    /*return(
        <Container>
            <Row>
                {rackets.map((racket: any) => (
                <Col key={racket._id} xs={12} sm={6} md={4} className="mb-4">
                    <Racket racket={racket} onRentSuccess={refreshRackets}/>
                </Col>
                ))}
            </Row>
        </Container>
    );*/

    return(
       <UserDashboard/>
    );
}

export default Dashboard;
