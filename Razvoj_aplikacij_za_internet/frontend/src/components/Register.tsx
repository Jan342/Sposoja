import { useState } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Container from "react-bootstrap/Container";
import { ServerRequest } from "../types/ServerRequest";

function Register(){
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [cpassword, setCPassword] = useState('');
    const[error, setError] = useState('');

    async function Register(e){
        e.preventDefault();
        const res = new ServerRequest('users/register');
        const data = await (await res.post({username: username, password:password, cpassword: cpassword})).json();
        if(data._id !== undefined){
            window.location.href="/login";
        }
        else{
            setUsername("");
            setPassword("");
            setCPassword("");
            setError(data.error);
        }
    }

    return (
        <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
            <Card className="shadow-sm p-4" style={{ width: "350px", borderRadius: "12px" }}>
              <h4 className="text-center mb-4">Registracija</h4>
              <Form onSubmit={Register}>
                <Form.Group className="mb-3">
                  <Form.Label>Uporabniško ime</Form.Label>
                  <Form.Control type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Vnesi uporabniško ime" required/>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Geslo</Form.Label>
                  <Form.Control type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Vnesi geslo"required/>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Ponovno geslo</Form.Label>
                  <Form.Control type="password" value={cpassword} onChange={(e) => setCPassword(e.target.value)} placeholder="Ponovi geslo" required/>
                </Form.Group>

                <Button type="submit" variant="primary" className="w-100"> Register</Button>
              </Form>

              {error && (
                <div className="text-danger text-center mt-3">
                  {error}
                </div>
              )}
            </Card>
        </Container>
    );
}
export default Register