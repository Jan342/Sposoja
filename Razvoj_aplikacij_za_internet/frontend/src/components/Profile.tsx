import { type FormEvent, useContext, useEffect, useState, type ChangeEvent } from "react";
import { UserContext } from "../contexts/userContext";
import { Alert, Button, Card, Container, Form } from "react-bootstrap";

function Profile() {
    const context = useContext(UserContext);
    const user = context && context.user ? (context.user as any) : null;    
    
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPasswordForm, setShowPasswordForm] = useState(false);

    const [imageBase64, setImageBase64] = useState<string | null>(null);
    const [packageCount, setPackageCount] = useState("");
    const [currentPackageCount, setCurrentPackageCount] = useState(0);
    const [showClubSettings, setShowClubSettings] = useState(false);

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(function() {
        if (!user || user.accountType !== "club") {
            return;
        }

        const loadClubSettings = async function() {
            const res = await fetch("http://localhost:3001/users/clubSettings", {
                method: "GET",
                credentials: "include"
            });
            const data = await res.json();

            if (res.ok) {
                setPackageCount(String(data.packageCount));
                setCurrentPackageCount(data.currentPackageCount);
            }
        };

        loadClubSettings();
    }, [user]);

    function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();
            
            reader.onloadend = () => {
                setImageBase64(reader.result as string);
            };
            
            reader.readAsDataURL(file);
        }
    }

    async function uploadImage() {
        if (!imageBase64) {
            setError("Prosimo, najprej izberi sliko.");
            return;
        }

        setMessage("");
        setError("");

        try {
            console.log("Pošiljam zahtevek na backend...");
            const res = await fetch("http://localhost:3001/users/uploadProfileImage", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image: imageBase64 })
            });

            console.log("Status koda iz backenda:", res.status); 

            if (res.status === 404) {
                setError("Napaka 404: Strežnik pravi, da ta URL ne obstaja. Preveri backend poti (routes).");
                return;
            }

            const data = await res.json();

            if (res.ok) {
                        setMessage("Profilna slika uspešno posodobljena!");
                        setImageBase64(null);
                        
                        if (context && context.setUserContext) {
            context.setUserContext({
                ...user,
                ...data
            });
        } else if (context && (context as any).setUser) {
            (context as any).setUser({
                ...user,
                ...data
            });
        }       
            } else {
                setError(data.error || "Nalaganje slike ni uspelo.");
            }
        } catch (err) {
            console.error("Uf, fetch se je sesul:", err);
            setError("Prišlo je do napake pri povezavi s strežnikom.");
        }
    }

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

    async function updateClubSettings(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setMessage("");
        setError("");

        const res = await fetch("http://localhost:3001/users/clubSettings", {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ packageCount: Number(packageCount) })
        });

        const data = await res.json();

        if (res.ok) {
            setMessage("Stevilo dovoljenih paketnikov je posodobljeno.");
            setShowClubSettings(false);

            if (context && context.setUserContext) {
                context.setUserContext(data);
            }
        } else {
            setError(data.error || "Stevila paketnikov ni bilo mogoce spremeniti.");
        }
    }

    async function leaveClub() {
        if (!window.confirm("Ali res zelis izstopiti iz kluba?")) {
            return;
        }

        setMessage("");
        setError("");

        const res = await fetch("http://localhost:3001/clubs/leaveClub", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" }
        });
        const data = await res.json();

        if (res.ok) {
            setMessage("Izstopil si iz kluba.");
            if (context && context.setUserContext) {
                context.setUserContext(data);
            }
        } else {
            setError(data.error || "Izstop iz kluba ni uspel.");
        }
    }

    const userInitial = user && user.username 
        ? user.username.charAt(0).toUpperCase() 
        : "U";

    return (
        <Container className="mt-5" style={{ maxWidth: "600px" }}>
            <Card bg="dark" text="white" className="p-4 shadow text-start">
                <h2 className="text-center text-md-start">Moj Profil</h2>
                <hr />
                {user ? (
                    <div>
                        {}
                        <div className="text-center mb-4 p-4 bg-secondary bg-opacity-10 rounded shadow-sm d-flex flex-column align-items-center">
                            {user.profileImage ? (
                                <img 
                                    src={user.profileImage} 
                                    style={{ 
                                        width: "120px", 
                                        height: "120px", 
                                        borderRadius: "50%", 
                                        objectFit: "cover", 
                                        border: "4px solid #0d6efd",
                                        boxShadow: "0px 4px 10px rgba(13, 110, 253, 0.3)"
                                    }} 
                                    alt="Profilna slika" 
                                />
                            ) : (
                                <div 
                                    className="d-flex align-items-center justify-content-center fw-bold shadow"
                                    style={{ 
                                        width: "120px", 
                                        height: "120px", 
                                        borderRadius: "50%", 
                                        fontSize: "3rem",
                                        background: "linear-gradient(135deg, #0d6efd 0%, #0a4da2 100%)",
                                        color: "#ffffff",
                                        letterSpacing: "1px"
                                    }}
                                >
                                    {userInitial}
                                </div>
                            )}

                            {}
                            <Form.Group className="mt-3 w-100" style={{ maxWidth: "280px" }}>
                                <Form.Control 
                                    type="file" 
                                    size="sm" 
                                    onChange={handleFileChange} 
                                    accept="image/*"
                                    className="bg-dark text-white border-secondary"
                                />
                                {imageBase64 && (
                                    <Button 
                                        onClick={uploadImage} 
                                        className="mt-2 w-100 fw-bold shadow-sm" 
                                        variant="success" 
                                        size="sm"
                                    >
                                        Potrdi posodobitev slike
                                    </Button>
                                )}
                            </Form.Group>
                        </div>
                        {}

                        <p><strong>Uporabnik:</strong> {user.username || "Prijavljen"}</p>
                        <p>
                            <strong>Status računa:</strong>{" "}
                            {user.accountType === "club" ? (
                                <span className="text-warning fw-bold">Klub</span>
                            ) : user.role === "clan" ? (
                                <span className="text-warning fw-bold">Član kluba</span>
                            ) : (
                                <span className="text-info fw-bold">nisi član kluba</span>
                            )}
                        </p>

                        {user.accountType !== "club" && user.rented && (
                            <Alert variant="info" className="mt-3 shadow-sm border-0 bg-info bg-opacity-25 text-black">
                                <strong>Trenutno imaš izposojen lopar!</strong><br />
                                ID izposojenega loparja: <code className="text-black">{user.rented}</code><br />
                                <small className="text-muted">Obišči omarico za prevzem.</small>
                            </Alert>
                        )}

                        {user.accountType !== "club" && user.role === "clan" && (
                            <Button
                                type="button"
                                variant="outline-danger"
                                className="mt-3"
                                onClick={leaveClub}
                            >
                                Izstopi iz kluba
                            </Button>
                        )}


                        {user.accountType === "club" && (
                            <div className="p-3 border border-secondary rounded mt-4 bg-dark bg-opacity-50">
                                <div className="d-flex justify-content-between align-items-center gap-3">
                                    <div>
                                        <h4 className="mb-1">Nastavitve kluba</h4>
                                        <div>
                                            Paketniki: {currentPackageCount} / {packageCount || 0}
                                        </div>
                                    </div>
                                    {!showClubSettings && (
                                        <Button
                                            type="button"
                                            variant="outline-light"
                                            onClick={() => setShowClubSettings(true)}
                                        >
                                            Spremeni
                                        </Button>
                                    )}
                                </div>

                                {showClubSettings && (
                                    <Form onSubmit={updateClubSettings} className="mt-3">
                                        <Form.Group className="mb-3">
                                            <Form.Label>Število dovoljenih paketnikov</Form.Label>
                                            <Form.Control
                                                type="number"
                                                min={currentPackageCount}
                                                value={packageCount}
                                                onChange={(e) => setPackageCount(e.target.value)}
                                                required
                                                className="bg-dark text-white border-secondary"
                                            />
                                            <Form.Text className="text-light opacity-75">
                                                Ne more biti manjše od trenutnega števila paketnikov.
                                            </Form.Text>
                                        </Form.Group>

                                        <div className="d-flex gap-2 justify-content-end">
                                            <Button type="button" variant="secondary" onClick={() => setShowClubSettings(false)}>
                                                Prekliči
                                            </Button>
                                            <Button type="submit" variant="primary">
                                                Shrani
                                            </Button>
                                        </div>
                                    </Form>
                                )}
                            </div>
                        )}
                        
                        {!showPasswordForm && (
                            <Button
                                type="button"
                                variant="outline-light"
                                className="mt-3 w-100 w-md-auto"
                                onClick={() => {
                                    setMessage("");
                                    setError("");
                                    setShowPasswordForm(true);
                                }}
                            >
                                Spremeni geslo
                            </Button>
                        )}

                        {showPasswordForm && (
                            <div className="p-3 border border-secondary rounded mt-4 bg-dark bg-opacity-50">
                                <h4 className="mb-3">Spremeni geslo</h4>
                                <Form onSubmit={changePassword}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Staro geslo</Form.Label>
                                        <Form.Control
                                            type="password"
                                            value={oldPassword}
                                            onChange={(e) => setOldPassword(e.target.value)}
                                            required
                                            className="bg-dark text-white border-secondary"
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Novo geslo</Form.Label>
                                        <Form.Control
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required
                                            className="bg-dark text-white border-secondary"
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Ponovi novo geslo</Form.Label>
                                        <Form.Control
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                            className="bg-dark text-white border-secondary"
                                        />
                                    </Form.Group>

                                    <div className="d-flex gap-2 justify-content-end">
                                        <Button type="button" variant="secondary" onClick={hidePasswordForm}>
                                            Prekliči
                                        </Button>
                                        <Button type="submit" variant="primary">
                                            Shrani geslo
                                        </Button>
                                    </div>
                                </Form>
                            </div>
                        )}

                        {message && <Alert variant="success" className="mt-3 border-0 shadow-sm">{message}</Alert>}
                        {error && <Alert variant="danger" className="mt-3 border-0 shadow-sm">{error}</Alert>}
                    </div>
                ) : (
                    <div className="text-center p-4">
                        <p className="text-muted">Za ogled profila se moraš prijaviti.</p>
                    </div>
                )}
            </Card>
        </Container>
    );
}

export default Profile;
