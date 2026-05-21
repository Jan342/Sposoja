import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from "react"
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import { ServerRequest } from "../types/ServerRequest";

type Package = {
    _id: string;
    name: string;
    location: string;
};

function RacketRent(){
    const [packages, setPackages] = useState<Package[]>([]);
    const [packageCount, setPackageCount] = useState(0);
    const [remaining, setRemaining] = useState(0);
    const [packageName, setPackageName] = useState('');
    const [packageLocation, setPackageLocation] = useState('');
    const [selectedPackage, setSelectedPackage] = useState('');
    const [model, setModel] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    async function loadPackages() {
        const res = new ServerRequest('rackets/packages');
        const data = await (await res.get()).json();

        if (data.packages) {
            setPackages(data.packages);
            setPackageCount(data.packageCount);
            setRemaining(data.remaining);

            if (!selectedPackage && data.packages.length > 0) {
                setSelectedPackage(data.packages[0]._id);
            }
        }
    }

    useEffect(function(){
        loadPackages();
    }, []);

    async function addPackage(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setMessage('');
        setError('');

        const res = new ServerRequest('rackets/packages');
        const data = await (await res.post({
            name: packageName,
            location: packageLocation
        })).json();

        if (data._id) {
            setPackageName('');
            setPackageLocation('');
            setMessage('Paketnik je bil dodan.');
            await loadPackages();
        } else {
            setError(data.message || 'Paketnika ni bilo mogoce dodati.');
        }
    }

    async function addRacket(e: FormEvent<HTMLFormElement>){
        e.preventDefault();
        setMessage('');
        setError('');

        if (!file) {
            setError('Izberi sliko loparja.');
            return;
        }

        if (!selectedPackage) {
            setError('Najprej izberi paketnik.');
            return;
        }

        const formData = new FormData();
        formData.append('packageId', selectedPackage);
        formData.append('name', model);
        formData.append('image', file);
        formData.append('description', description);

        const res = await fetch('http://localhost:3001/rackets/addRacket', {
            method: 'POST',
            credentials: 'include',
            body: formData
        });
        const data = await res.json();

        if(data._id){
            setModel('');
            setDescription('');
            setFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            setMessage('Lopar je bil dodan v paketnik.');
        } else {
            setError(data.message || 'Loparja ni bilo mogoce dodati.');
        }
    }

    return(
        <Container className="py-4">
            <Row className="g-4">
                <Col lg={5}>
                    <Card className="p-4 shadow-sm">
                        <h4>Paketniki</h4>
                        <p className="mb-3">
                            Dodani paketniki: {packages.length} / {packageCount}
                        </p>

                        {packages.map((packageItem) => (
                            <div key={packageItem._id} className="border rounded p-2 mb-2">
                                <strong>{packageItem.name}</strong>
                                <div>{packageItem.location}</div>
                            </div>
                        ))}

                        {remaining > 0 ? (
                            <Form onSubmit={addPackage} className="mt-3">
                                <Form.Group className="mb-3">
                                    <Form.Label>Ime paketnika</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Vnesi ime paketnika"
                                        value={packageName}
                                        onChange={(e) => setPackageName(e.target.value)}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Lokacija paketnika</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Vnesi lokacijo"
                                        value={packageLocation}
                                        onChange={(e) => setPackageLocation(e.target.value)}
                                        required
                                    />
                                </Form.Group>

                                <Button variant="primary" type="submit" className="w-100">
                                    Dodaj paketnik
                                </Button>
                            </Form>
                        ) : (
                            <Alert variant="info" className="mt-3">
                                Dodal si vse paketnike, ki si jih navedel pri registraciji.
                            </Alert>
                        )}
                    </Card>
                </Col>

                <Col lg={7}>
                    <Card className="p-4 shadow-sm">
                        <h4>Dodaj lopar v paketnik</h4>
                        <Form onSubmit={addRacket}>
                            <Form.Group className="mb-3">
                                <Form.Label>Paketnik</Form.Label>
                                <Form.Select
                                    value={selectedPackage}
                                    onChange={(e) => setSelectedPackage(e.target.value)}
                                    required
                                >
                                    <option value="">Izberi paketnik</option>
                                    {packages.map((packageItem) => (
                                        <option key={packageItem._id} value={packageItem._id}>
                                            {packageItem.name} - {packageItem.location}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Model loparja</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Vnesi model loparja"
                                    value={model}
                                    onChange={(e) => setModel(e.target.value)}
                                    required
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Opis loparja</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    placeholder="Vnesi opis modela"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Izberi sliko loparja</Form.Label>
                                <Form.Control
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setFile(e.target.files?.[0] ?? null)}
                                    required
                                />
                            </Form.Group>

                            <Button variant="primary" type="submit" className="w-100" disabled={packages.length === 0}>
                                Dodaj lopar
                            </Button>
                        </Form>
                    </Card>
                </Col>
            </Row>

            {message && <Alert variant="success" className="mt-3">{message}</Alert>}
            {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
        </Container>
    )
}
export default RacketRent
