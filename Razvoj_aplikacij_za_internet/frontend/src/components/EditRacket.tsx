import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { Container, Form, Button, Alert, Card, Spinner } from "react-bootstrap";
import { ServerRequest } from "../types/ServerRequest";

function EditRacket() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [racket, setRacket] = useState<any>(null);
    const [packages, setPackages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const racketRes = await fetch(`http://localhost:3001/rackets/${id}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include'
                });
                const racketData = await racketRes.json();

                if (!racketRes.ok) throw new Error(racketData.message || "Napaka pri nalaganju loparja");
                setRacket(racketData);

                const pkgReq = new ServerRequest('rackets/packages');
                const pkgRes = await pkgReq.get();
                if (pkgRes.ok) {
                    const pkgData = await pkgRes.json();
                    setPackages(pkgData.packages || []);
                }

                setLoading(false);
            } catch (err: any) {
                setError(err.message || "Napaka pri nalaganju podatkov.");
                setLoading(false);
            }
        };

        loadData();
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append("model", racket.model);
            formData.append("description", racket.description || "");

            if (racket.package) {
                formData.append("package", racket.package);
            }

            if (fileInputRef.current?.files && fileInputRef.current.files.length > 0) {
                formData.append("image", fileInputRef.current.files[0]);
            }

            const response = await fetch(`http://localhost:3001/rackets/${id}`, {
                method: 'PUT',
                body: formData,
                credentials: 'include'
            });

            if (response.ok) {
                alert("Lopar uspešno posodobljen!");
                navigate("/dashboard");
            } else {
                const data = await response.json();
                setError(data.message || "Napaka pri shranjevanju.");
            }
        } catch (err) {
            setError("Prišlo je do napake pri povezavi s strežnikom.");
        }
    };

    if (loading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" />
                <p className="mt-3">Nalaganje podatkov...</p>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="py-5">
                <Alert variant="danger">
                    <h5>Napaka</h5>
                    {error}
                </Alert>
                <Button onClick={() => navigate(-1)}>Nazaj</Button>
            </Container>
        );
    }

    return (
        <Container className="py-5" style={{ maxWidth: "700px" }}>
            <Card className="shadow-sm">
                <Card.Header as="h4" className="bg-light text-dark">
                    Uredi lopar: {racket.model}
                </Card.Header>
                <Card.Body>
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-bold">Model</Form.Label>
                            <Form.Control
                                type="text"
                                value={racket?.model || ""}
                                onChange={(e) => setRacket({ ...racket, model: e.target.value })}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label className="fw-bold">Opis</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={racket?.description || ""}
                                onChange={(e) => setRacket({ ...racket, description: e.target.value })}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label className="fw-bold">Paketnik</Form.Label>
                            <Form.Select
                                value={racket?.package || ""}
                                onChange={(e) => setRacket({ ...racket, package: e.target.value })}
                            >
                                <option value="">Ne dodeli paketnika</option>
                                {packages.map((pkg: any) => (
                                    <option key={pkg._id} value={pkg._id}>
                                        {pkg.name} ({pkg.location})
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-4">
                            <Form.Label className="fw-bold">Slika (če želiš zamenjati)</Form.Label>
                            <div className="mb-2">
                                <img src={`http://localhost:3001${racket.path}`} alt="Trenutna slika" style={{ height: "100px", objectFit: "cover", borderRadius: "5px" }} />
                            </div>
                            <Form.Control
                                type="file"
                                accept="image/*"
                                ref={fileInputRef}
                            />
                        </Form.Group>

                        <div className="d-flex justify-content-end gap-2">
                            <Button variant="secondary" onClick={() => navigate(-1)}>
                                Prekliči
                            </Button>
                            <Button variant="primary" type="submit">
                                Shrani spremembe
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
}

export default EditRacket;