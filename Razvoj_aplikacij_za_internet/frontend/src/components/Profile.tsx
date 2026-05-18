import { useContext } from "react";
import { UserContext } from "../contexts/userContext";
import { Container, Card } from "react-bootstrap";

function Profile() {
    const context = useContext(UserContext);
    const user = context ? context.user : null;

    return (
        <Container className="mt-5" style={{ maxWidth: "600px" }}>
            <Card bg="dark" text="white" className="p-4 shadow">
                <h2>Moj Profil</h2>
                <hr />
                {user ? (
                    <div>
                        {}
                        <p><strong>Uporabnik:</strong> {user.username || "Prijavljen"}</p>
                    </div>
                ) : (
                    <p>Za ogled profila se moraš prijaviti.</p>
                )}
            </Card>
        </Container>
    );
}

export default Profile;