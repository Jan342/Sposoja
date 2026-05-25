import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Container, Form, Button, Alert } from "react-bootstrap";

function EditRacket() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [racket, setRacket] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetch(`http://localhost:3001/rackets/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        })
        .then(res => res.json())
        .then(data => {
            console.log("PODATKI IZ STREŽNIKA:", data);
            setRacket(data);
            setLoading(false);
        })
        .catch(() => {
            setError("Napaka pri nalaganju.");
            setLoading(false);
        });
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch(`http://localhost:3001/rackets/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(racket),
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

    if (loading) return <Container className="py-4">Nalagam...</Container>;
    if (error) return <Container className="py-4"><Alert variant="danger">{error}</Alert></Container>;

    return (
        <Container className="py-4">
            <h2>Uredi lopar: {racket.model}</h2>
            <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                    <Form.Label>Model</Form.Label>
                    <Form.Control 
                        type="text" 
                        value={racket?.model || ""}
                        onChange={(e) => setRacket({...racket, model: e.target.value})} 
                    />
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>Opis</Form.Label>
                    <Form.Control 
                        as="textarea" 
                        rows={3} 
                        value={racket?.description || ""}
                        onChange={(e) => setRacket({...racket, description: e.target.value})} 
                    />
                </Form.Group>

                <Button variant="primary" type="submit">
                    Shrani spremembe
                </Button>
                <Button variant="secondary" className="ms-2" onClick={() => navigate(-1)}>
                    Prekliči
                </Button>
            </Form>
        </Container>
    );
}

export default EditRacket;