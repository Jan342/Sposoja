import { useContext } from "react";
import { Link } from "react-router-dom";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import { UserContext } from "../contexts/userContext";

function Home() {
    const userContext = useContext(UserContext);
    const isLoggedIn = !!userContext?.user;

    return (
        <div className="home-wrapper" style={{
            background: "linear-gradient(135deg, #0f2027, #203a43, #2c5364)",
            minHeight: "100vh",
            color: "white",
            paddingTop: "60px",
            paddingBottom: "60px"
        }}>
            <Container className="text-center py-5">
                <div className="py-5">
                    <h1 className="display-3 fw-bold mb-4" style={{
                        background: "-webkit-linear-gradient(45deg, #00d2ff, #3a7bd5)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent"
                    }}>
                        Teniška Oprema Na Dosegu Roke
                    </h1>
                    <p className="lead mb-5 px-md-5" style={{ color: "#d1d5db", maxWidth: "800px", margin: "0 auto" }}>
                        Digitalizirana rezervacija pametnih paketnikov za hiter in enostaven dostop do klubske opreme.
                        Pridruži se svojemu klubu, rezerviraj opremo v nekaj klikih ali registriraj klub in poenostavi upravljanje opreme.
                    </p>

                    <div className="d-flex justify-content-center gap-3 flex-wrap">
                        {isLoggedIn ? (
                            <Link to="/dashboard">
                                <Button variant="primary" size="lg" className="px-5 py-3 fw-bold shadow-lg" style={{ borderRadius: "30px", background: "linear-gradient(45deg, #00d2ff, #3a7bd5)", border: "none" }}>
                                    Nadzorna plošča
                                </Button>
                            </Link>
                        ) : (
                            <>
                                <Link to="/register">
                                    <Button variant="primary" size="lg" className="px-5 py-3 fw-bold shadow-lg" style={{ borderRadius: "30px", background: "linear-gradient(45deg, #00d2ff, #3a7bd5)", border: "none" }}>
                                        Začni zdaj
                                    </Button>
                                </Link>
                                <Link to="/login">
                                    <Button variant="outline-light" size="lg" className="px-5 py-3 fw-bold" style={{ borderRadius: "30px" }}>
                                        Prijava
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </Container>

            <Container className="py-5 mt-4">
                <Row className="g-4 text-center">
                    <Col md={4}>
                        <Card className="h-100 border-0 p-4 shadow-lg" style={{
                            background: "rgba(255, 255, 255, 0.05)",
                            backdropFilter: "blur(10px)",
                            borderRadius: "20px"
                        }}>
                            <div className="mb-4 d-inline-flex justify-content-center align-items-center" style={{
                                width: "80px", height: "80px", borderRadius: "50%", background: "rgba(0, 210, 255, 0.1)", color: "#00d2ff", fontSize: "2rem"
                            }}>
                                📦
                            </div>
                            <h3 className="h4 fw-bold">Pametni Paketniki</h3>
                            <p className="text-white-50">
                                Popolnoma digitaliziran dostop. Rezerviraj in prevzemi svoj lopar na določeni lokaciji v nekaj sekundah brez stika.
                            </p>
                        </Card>
                    </Col>

                    <Col md={4}>
                        <Card className="h-100 border-0 p-4 shadow-lg" style={{
                            background: "rgba(255, 255, 255, 0.05)",
                            backdropFilter: "blur(10px)",
                            borderRadius: "20px"
                        }}>
                            <div className="mb-4 d-inline-flex justify-content-center align-items-center" style={{
                                width: "80px", height: "80px", borderRadius: "50%", background: "rgba(255, 193, 7, 0.1)", color: "#ffc107", fontSize: "2rem"
                            }}>
                                🎾
                            </div>
                            <h3 className="h4 fw-bold">Vrhunska Oprema</h3>
                            <p className="text-white-50">
                                Izbiraš lahko med rekreativnimi in profesionalnimi loparji glede na tvoje potrebe. Vedno vzdrževani in pripravljeni za igro.
                            </p>
                        </Card>
                    </Col>

                    <Col md={4}>
                        <Card className="h-100 border-0 p-4 shadow-lg" style={{
                            background: "rgba(255, 255, 255, 0.05)",
                            backdropFilter: "blur(10px)",
                            borderRadius: "20px"
                        }}>
                            <div className="mb-4 d-inline-flex justify-content-center align-items-center" style={{
                                width: "80px", height: "80px", borderRadius: "50%", background: "rgba(40, 167, 69, 0.1)", color: "#28a745", fontSize: "2rem"
                            }}>
                                🏢
                            </div>
                            <h3 className="h4 fw-bold">Za Klube</h3>
                            <p className="text-white-50">
                                Posebno orodje za upravitelje klubov. Dodeljuj paketnike članom, spremljaj zgodovino izposoj in enostavno upravljaj z inventarjem.
                            </p>
                        </Card>
                    </Col>
                </Row>
            </Container>

            <Container className="py-5 my-5 text-center">
                <div className="p-5 shadow-lg" style={{
                    background: "rgba(0, 0, 0, 0.3)",
                    borderRadius: "30px",
                    border: "1px solid rgba(255,255,255,0.1)"
                }}>
                    <h2 className="display-6 fw-bold mb-3">Si pripravljen na igro?</h2>
                    <p className="lead text-white-50 mb-4 mx-auto" style={{ maxWidth: "600px" }}>
                        Pridruži se stotinam igralcev in začni z uporabo našega sistema še danes.
                        Brez nepotrebne papirologije in klicanja.
                    </p>
                    {isLoggedIn ? (
                        <Link to="/dashboard">
                            <Button variant="warning" size="lg" className="px-5 py-3 fw-bold shadow">Moja nadzorna plošča</Button>
                        </Link>
                    ) : (
                        <Link to="/register">
                            <Button variant="success" size="lg" className="px-5 py-3 fw-bold shadow">Ustvari brezplačen račun</Button>
                        </Link>
                    )}
                </div>
            </Container>

        </div>
    );
}

export default Home;
