import { type FormEvent, useState } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Container from "react-bootstrap/Container";
import { ServerRequest } from "../types/ServerRequest";

type RegisterType = "person" | "club";

function Register(){
    const [registerType, setRegisterType] = useState<RegisterType>('person');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [username, setUsername] = useState('');
    const [address, setAddress] = useState('');
    const [clubName, setClubName] = useState('');
    const [packageCount, setPackageCount] = useState('');
    const [password, setPassword] = useState('');
    const [cpassword, setCPassword] = useState('');
    const [error, setError] = useState('');

    async function Register(e: FormEvent<HTMLFormElement>){
        e.preventDefault();
        const res = new ServerRequest('users/register');
        const data = await (await res.post({
            registerType: registerType,
            firstName: firstName,
            lastName: lastName,
            username: registerType === "club" ? clubName : username,
            address: address,
            clubName: registerType === "club" ? clubName : undefined,
            packageCount: registerType === "club" ? Number(packageCount) : undefined,
            password: password,
            cpassword: cpassword
        })).json();

        if(data._id !== undefined){
            window.location.href="/login";
        }
        else{
            setFirstName("");
            setLastName("");
            setUsername("");
            setAddress("");
            setClubName("");
            setPackageCount("");
            setPassword("");
            setCPassword("");
            setError(data.error);
        }
    }

    return (
        <Container className="d-flex justify-content-center align-items-center py-4" style={{ minHeight: "100vh" }}>
            <Card className="shadow-sm p-4" style={{ width: "420px", borderRadius: "12px" }}>
              <h4 className="text-center mb-4">Registracija</h4>
              <Form onSubmit={Register}>
                <Form.Group className="mb-3">
                  <Form.Label>Tip racuna</Form.Label>
                  <div className="d-flex gap-3">
                    <Form.Check
                      type="radio"
                      id="register-person"
                      name="registerType"
                      label="Oseba"
                      checked={registerType === "person"}
                      onChange={() => setRegisterType("person")}
                    />
                    <Form.Check
                      type="radio"
                      id="register-club"
                      name="registerType"
                      label="Klub"
                      checked={registerType === "club"}
                      onChange={() => setRegisterType("club")}
                    />
                  </div>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Ime</Form.Label>
                  <Form.Control type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Vnesi ime" required/>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Priimek</Form.Label>
                  <Form.Control type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Vnesi priimek" required/>
                </Form.Group>

                {registerType === "person" && (
                  <Form.Group className="mb-3">
                    <Form.Label>Uporabnisko ime</Form.Label>
                    <Form.Control type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Vnesi uporabnisko ime" required/>
                  </Form.Group>
                )}

                {registerType === "club" && (
                  <Form.Group className="mb-3">
                    <Form.Label>Ime kluba</Form.Label>
                    <Form.Control type="text" value={clubName} onChange={(e) => setClubName(e.target.value)} placeholder="Vnesi ime kluba" required/>
                  </Form.Group>
                )}

                <Form.Group className="mb-3">
                  <Form.Label>{registerType === "club" ? "Naslov / lokacija" : "Naslov"}</Form.Label>
                  <Form.Control type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder={registerType === "club" ? "Vnesi naslov ali lokacijo" : "Vnesi naslov"} required/>
                </Form.Group>

                {registerType === "club" && (
                  <Form.Group className="mb-3">
                    <Form.Label>Stevilo paketnikov</Form.Label>
                    <Form.Control type="number" min="0" value={packageCount} onChange={(e) => setPackageCount(e.target.value)} placeholder="Vnesi stevilo paketnikov" required/>
                  </Form.Group>
                )}

                <Form.Group className="mb-3">
                  <Form.Label>Geslo</Form.Label>
                  <Form.Control type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Vnesi geslo" required/>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Ponovno geslo</Form.Label>
                  <Form.Control type="password" value={cpassword} onChange={(e) => setCPassword(e.target.value)} placeholder="Ponovi geslo" required/>
                </Form.Group>

                <Button type="submit" variant="primary" className="w-100">Register</Button>
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
