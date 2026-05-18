import { type FormEvent, useContext, useState } from "react";
import { UserContext } from "../contexts/userContext";
import { Alert, Button, Card, Container, Form } from "react-bootstrap";

function Profile() {
    const context = useContext(UserContext);
    const user = context ? context.user : null;
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [showPasswordForm, setShowPasswordForm] = useState(false);

    async function changePassword(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setMessage("");
        setError("");

        const res = await fetch("http://localhost:3001/users/changePassword", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                oldPassword: oldPassword,
                newPassword: newPassword,
                confirmPassword: confirmPassword
            })
        });

        const data = await res.json();

        if (res.ok) {
            setOldPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setMessage(data.message);
            setShowPasswordForm(false);
        } else {
            setError(data.error || "Gesla ni bilo mogoce spremeniti.");
        }
    }

    function hidePasswordForm() {
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setError("");
        setShowPasswordForm(false);
    }

    return (
        <Container className="mt-5" style={{ maxWidth: "600px" }}>
            <Card bg="dark" text="white" className="p-4 shadow">
                <h2>Moj Profil</h2>
                <hr />
                {user ? (
                    <div>
                        <p><strong>Uporabnik:</strong> {user.username || "Prijavljen"}</p>

                        {!showPasswordForm && (
                            <Button
                                type="button"
                                variant="primary"
                                className="mt-3"
                                onClick={() => {
                                    setMessage("");
                                    setShowPasswordForm(true);
                                }}
                            >
                                Spremeni geslo
                            </Button>
                        )}

                        {showPasswordForm && (
                            <>
                                <h4 className="mt-4">Spremeni geslo</h4>
                                <Form onSubmit={changePassword}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Staro geslo</Form.Label>
                                        <Form.Control
                                            type="password"
                                            value={oldPassword}
                                            onChange={(e) => setOldPassword(e.target.value)}
                                            required
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Novo geslo</Form.Label>
                                        <Form.Control
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Ponovi novo geslo</Form.Label>
                                        <Form.Control
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                        />
                                    </Form.Group>

                                    <div className="d-flex gap-2">
                                        <Button type="submit" variant="primary">
                                            Shrani geslo
                                        </Button>
                                        <Button type="button" variant="secondary" onClick={hidePasswordForm}>
                                            Preklici
                                        </Button>
                                    </div>
                                </Form>
                            </>
                        )}

                        {message && <Alert variant="success" className="mt-3">{message}</Alert>}
                        {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
                    </div>
                ) : (
                    <p>Za ogled profila se moras prijaviti.</p>
                )}
            </Card>
        </Container>
    );
}

export default Profile;
