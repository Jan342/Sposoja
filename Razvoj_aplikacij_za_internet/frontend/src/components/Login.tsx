import { useContext,useState } from "react";
import { UserContext } from "../contexts/userContext";
import { Link } from "react-router-dom";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Container from "react-bootstrap/Container";

function Login(){
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const userContext = useContext(UserContext); 

    async function Login(e){
        e.preventDefault();
        const res = await fetch("http://localhost:3001/users/login", {
            method: "POST",
            credentials: "include",
            headers: { 'Content-Type': 'application/json'},
            body: JSON.stringify({
                username: username,
                password: password
            })
        });
        const data = await res.json();
        if(data._id !== undefined){
            userContext.setUserContext(data);
            window.location.href="/dashboard";
        } else {
            setUsername("");
            setPassword("");
            setError("Invalid username or password");
        }
    }

    return (
        <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
              <Card className="shadow-sm p-4" style={{ width: "350px", borderRadius: "12px" }}>
                <h4 className="text-center mb-4">Prijava</h4>
                <Form onSubmit={Login}>
                  <Form.Group className="mb-3">
                    <Form.Label>Uporabniško ime</Form.Label>
                    <Form.Control type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Vnesi uporabniško ime" required/>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Geslo</Form.Label>
                    <Form.Control type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Vnesi geslo" required />
                  </Form.Group>

                  <Button type="submit" variant="primary" className="w-100">
                    Login
                  </Button>
                </Form>

                <div className="text-center mt-3">
                  <small>
                    Nimaš računa?{" "}
                    <Link to="/register">Registracija</Link>
                  </small>
                </div>

                {error && (
                  <div className="text-danger text-center mt-3">
                    {error}
                  </div>
                )}
              </Card>
        </Container>
  );
}
export default Login