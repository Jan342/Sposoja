import { useContext, useEffect, useState } from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Badge from "react-bootstrap/Badge";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import Form from "react-bootstrap/Form";
import { ServerRequest } from "../types/ServerRequest";
import { UserContext } from "../contexts/userContext";
import UserDashboard from "./UserDashboard";
import Racket from "./Racket";
import type { LogEntry, Member, Package, RacketData } from "../types/other_types";

function Dashboard() {
    const userContext = useContext(UserContext);
    const isClub = userContext.user?.accountType === "club";
    const [rackets, setRackets] = useState<RacketData[]>([]);
    const [packages, setPackages] = useState<Package[]>([]);
    const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
    const [packageRackets, setPackageRackets] = useState<RacketData[]>([]);
    const [reload, setReload] = useState(false);

    const [members, setMembers] = useState<Member[]>([]);
    const [membersLoaded, setMembersLoaded] = useState(false);

    const [history, setHistory] = useState<LogEntry[]>([]);
    const [historyLoaded, setHistoryLoaded] = useState(false);
    const [historyFilter, setHistoryFilter] = useState("");

    const [assigningFor, setAssigningFor] = useState<string | null>(null);
    const [assignMsg, setAssignMsg] = useState("");    

    useEffect(function () {
        const loadDashboard = async function () {
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
            const recreationalRackets = data.filter((r: any) => r.audienceType === 'rekreativec');
            setRackets(recreationalRackets);
        }
        loadDashboard();
    }, [reload, isClub]);

    useEffect(function () {
        if (!selectedPackage) {
            setPackageRackets([]);
            return;
        }

        const loadPackageRackets = async function () {
            try {
                const res = new ServerRequest(`rackets/packages/${selectedPackage._id}/rackets`);
                const response = await res.get();
                const data = await response.json();
                setPackageRackets(data.rackets || []);
            } catch (err) {
                console.error("Napaka pri nalaganju loparjev v paketniku:", err);
                setPackageRackets([]);
            }
        };

        loadPackageRackets();
    }, [selectedPackage, reload]);

    async function loadMembers(force = false) {
        if (!force && membersLoaded) return;
        const res = await fetch("http://localhost:3001/clubs/members", { credentials: "include" });
        const data = await res.json();
        setMembers(data);
        setMembersLoaded(true);
    }

    async function loadHistory(pkgId?: string) {
        const url = pkgId
            ? `http://localhost:3001/clubs/history?packageId=${pkgId}`
            : "http://localhost:3001/clubs/history";
        const res = await fetch(url, { credentials: "include" });
        const data = await res.json();
        setHistory(data);
        setHistoryLoaded(true);
    }

    async function assignPackage(userId: string, packageId: string) {
        setAssignMsg("");
        const res = await fetch(`http://localhost:3001/clubs/members/${userId}/package`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ packageId })
        });
        const data = await res.json();
        if (res.ok) {
            setAssignMsg("Paketnik uspešno dodeljen!");
            setAssigningFor(null);
            setMembersLoaded(false);
            loadMembers(true);
        } else {
            setAssignMsg(data.error || "Napaka pri dodeljevanju.");
        }
    }

    async function removePackage(userId: string) {
        setAssignMsg("");
        const res = await fetch(`http://localhost:3001/clubs/members/${userId}/package`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ packageId: "" })
        });
        if (res.ok) {
            setAssignMsg("Dodelitev paketnika odstranjena.");
            setMembersLoaded(false);
            loadMembers(true);
        }
    }

    async function removeMember(userId: string) {
        if (!window.confirm("Ali res zelis odstraniti clana iz kluba?")) {
            return;
        }

        setAssignMsg("");
        const res = await fetch(`http://localhost:3001/clubs/members/${userId}`, {
            method: "DELETE",
            credentials: "include"
        });
        const data = await res.json();

        if (res.ok) {
            setAssignMsg("Clan odstranjen iz kluba.");
            setMembersLoaded(false);
            loadMembers(true);
        } else {
            setAssignMsg(data.error || "Napaka pri odstranjevanju clana.");
        }
    }

    const refreshRackets = () => {
        setReload(prev => !prev);
    };

    function formatDate(ts: string) {
        const d = new Date(ts);
        return d.toLocaleString('sl-SI', { dateStyle: 'short', timeStyle: 'short' });
    }

    const filteredHistory = historyFilter
        ? history.filter(h => h.package?._id === historyFilter)
        : history;

    if (isClub) {
        return (
            <Container className="py-4">
                <h2 className="mb-4">Nadzorna plošča kluba</h2>

                <Tabs defaultActiveKey="paketniki" className="mb-4" onSelect={(key) => {
                    if (key === "clani") loadMembers();
                    if (key === "zgodovina") loadHistory();
                }}>

                    <Tab eventKey="paketniki" title="📦 Paketniki">
                        <Row className="g-4 mt-1">
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
                                                <Racket
                                                    racket={racket}
                                                    onRentSuccess={refreshRackets}
                                                />
                                            </Col>
                                        ))}
                                    </Row>
                                )}
                            </Col>
                        </Row>
                    </Tab>

                    <Tab eventKey="clani" title="👥 Člani">
                        <div className="mt-3">
                            <h4 className="mb-3">Člani kluba</h4>
                            {assignMsg && (
                                <Alert variant="info" dismissible onClose={() => setAssignMsg("")}>
                                    {assignMsg}
                                </Alert>
                            )}
                            {members.length === 0 ? (
                                <Alert variant="secondary">Klub še nima članov.</Alert>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-dark table-hover align-middle">
                                        <thead>
                                            <tr>
                                                <th>Uporabnik</th>
                                                <th>Ime</th>
                                                <th>Dodeljen paketnik</th>
                                                <th>Dejanje</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {members.map(member => (
                                                <tr key={member._id}>
                                                    <td><code>{member.username}</code></td>
                                                    <td>{member.firstName} {member.lastName}</td>
                                                    <td>
                                                        {member.assignedPackage
                                                            ? <Badge bg="success">{member.assignedPackage.name}</Badge>
                                                            : <span className="text-muted">– ni dodeljen –</span>
                                                        }
                                                    </td>
                                                    <td>
                                                        {assigningFor === member._id ? (
                                                            <div className="d-flex gap-2 align-items-center flex-wrap">
                                                                <Form.Select
                                                                    size="sm"
                                                                    style={{ maxWidth: 180 }}
                                                                    defaultValue={member.assignedPackage?._id || ""}
                                                                    id={`pkg-select-${member._id}`}
                                                                >
                                                                    <option value="">– odstrani –</option>
                                                                    {packages.map(p => (
                                                                        <option key={p._id} value={p._id}>{p.name}</option>
                                                                    ))}
                                                                </Form.Select>
                                                                <Button size="sm" variant="success" onClick={() => {
                                                                    const sel = document.getElementById(`pkg-select-${member._id}`) as HTMLSelectElement;
                                                                    assignPackage(member._id, sel.value);
                                                                }}>Potrdi</Button>
                                                                <Button size="sm" variant="secondary" onClick={() => setAssigningFor(null)}>Prekliči</Button>
                                                            </div>
                                                        ) : (
                                                            <div className="d-flex gap-2">
                                                                <Button size="sm" variant="outline-primary" onClick={() => setAssigningFor(member._id)}>
                                                                    {member.assignedPackage ? "Spremeni" : "Dodeli"}
                                                                </Button>
                                                                {member.assignedPackage && (
                                                                    <Button size="sm" variant="outline-danger" onClick={() => removePackage(member._id)}>
                                                                        Odstrani
                                                                    </Button>
                                                                )}
                                                                <Button size="sm" variant="danger" onClick={() => removeMember(member._id)}>
                                                                    Vrzi ven
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </Tab>

                    <Tab eventKey="zgodovina" title="📋 Zgodovina">
                        <div className="mt-3">
                            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                                <h4 className="mb-0">Dnevnik odklepov paketnikov</h4>
                                <div className="d-flex gap-2 align-items-center">
                                    <Form.Select
                                        size="sm"
                                        style={{ maxWidth: 200 }}
                                        value={historyFilter}
                                        onChange={e => {
                                            setHistoryFilter(e.target.value);
                                            loadHistory(e.target.value || undefined);
                                        }}
                                    >
                                        <option value="">Vsi paketniki</option>
                                        {packages.map(p => (
                                            <option key={p._id} value={p._id}>{p.name}</option>
                                        ))}
                                    </Form.Select>
                                    <Button size="sm" variant="outline-secondary" onClick={() => loadHistory(historyFilter || undefined)}>
                                        ↻ Osveži
                                    </Button>
                                </div>
                            </div>

                            {!historyLoaded ? (
                                <Alert variant="secondary">Nalaganje...</Alert>
                            ) : filteredHistory.length === 0 ? (
                                <Alert variant="secondary">Ni zapisov v zgodovini.</Alert>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-dark table-hover align-middle">
                                        <thead>
                                            <tr>
                                                <th>Datum in čas</th>
                                                <th>Član</th>
                                                <th>Lopar</th>
                                                <th>Paketnik</th>
                                                <th>Akcija</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredHistory.map(entry => (
                                                <tr key={entry._id}>
                                                    <td><small>{formatDate(entry.timestamp)}</small></td>
                                                    <td>
                                                        {entry.user
                                                            ? <><strong>{entry.user.username}</strong><br /><small className="text-primary">{entry.user.firstName} {entry.user.lastName}</small></>
                                                            : <span className="text-muted">–</span>
                                                        }
                                                    </td>
                                                    <td>{entry.racket?.model || <span className="text-muted">–</span>}</td>
                                                    <td>
                                                        {entry.package
                                                            ? <><span>{entry.package.name}</span><br /><small className="text-primary">{entry.package.location}</small></>
                                                            : <span className="text-muted">–</span>
                                                        }
                                                    </td>
                                                    <td>
                                                        {entry.action === 'izposoja'
                                                            ? <Badge bg="warning" text="dark">🔓 Izposoja</Badge>
                                                            : <Badge bg="success">🔒 Vrnitev</Badge>
                                                        }
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </Tab>

                </Tabs>
            </Container>
        );
    }

    return (
        <Container className="py-4">
            <UserDashboard onRentSuccess={refreshRackets}/>

            {userContext.user?.role === 'rekreativec' && (
                <>
                    <hr className="my-5" />
                    <h3>Loparji za rekreativnost</h3>
                    <Row>
                        {rackets.map((racket: any) => (
                            <Col key={racket._id} xs={12} sm={6} md={4} className="mb-4">
                                <Racket
                                    racket={racket}
                                    isOccupied={!!racket.rented}
                                    onRentSuccess={refreshRackets}
                                />
                            </Col>
                        ))}
                    </Row>
                </>
            )}
        </Container>
    );
}

export default Dashboard;
