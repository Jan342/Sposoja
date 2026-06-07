import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from "react"
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import { ServerRequest } from "../types/ServerRequest";
import type { Package } from "../types/other_types";

function RacketRent(){
    const [packages, setPackages] = useState<Package[]>([]);
    const [packageCount, setPackageCount] = useState(0);
    const [remaining, setRemaining] = useState(0);
    const [packageName, setPackageName] = useState('');
    const [packageLocation, setPackageLocation] = useState('');
    const [packageBoxId, setPackageBoxId] = useState('');
    const [packageRacketLimit, setPackageRacketLimit] = useState('');
    const [packageLimitInputs, setPackageLimitInputs] = useState<Record<string, string>>({});
    const [selectedPackage, setSelectedPackage] = useState('');
    const [model, setModel] = useState('');
    const [description, setDescription] = useState('');
    
    const [targetAudience, setTargetAudience] = useState('rekreativec'); 
    
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
            setPackageLimitInputs(data.packages.reduce((inputs: Record<string, string>, packageItem: Package) => {
                inputs[packageItem._id] = String(packageItem.racketLimit);
                return inputs;
            }, {}));

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
            location: packageLocation,
            boxId: packageBoxId,
            racketLimit: Number(packageRacketLimit)
        })).json();

        if (data._id) {
            setPackageName('');
            setPackageLocation('');
            setPackageBoxId('');
            setPackageRacketLimit('');
            setMessage('Paketnik je bil dodan.');
            await loadPackages();
        } else {
            setError(data.message || 'Paketnika ni bilo mogoce dodati.');
        }
    }

    async function updatePackageLimit(packageId: string) {
        setMessage('');
        setError('');

        const res = new ServerRequest(`rackets/packages/${packageId}/limit`);
        const data = await (await res.setBody({ racketLimit: Number(packageLimitInputs[packageId]) }).put()).json();

        if (data._id) {
            setMessage('Stevilo loparjev za paketnik je posodobljeno.');
            await loadPackages();
        } else {
            setError(data.message || 'Stevila loparjev ni bilo mogoce spremeniti.');
        }
    }
async function addRacket(e: FormEvent<HTMLFormElement>){
    e.preventDefault();
    setMessage('');
    setError('');

    if (!file) { setError('Izberi sliko loparja.'); return; }

    const formData = new FormData();

    formData.append('packageId', selectedPackage);
    formData.append('name', model);
    formData.append('description', description);
    formData.append('image', file);
    formData.append('audienceType', targetAudience);

    const res = await fetch('http://localhost:3001/rackets/addRacket', {
        method: 'POST',
        credentials: 'include',
        body: formData 
    });
    
    const data = await res.json();
    if(data._id){
        setModel(''); setDescription(''); setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setMessage('Lopar je bil uspešno dodan.');
        await loadPackages();
    } else {
        setError(data.message || 'Napaka pri dodajanju.');
    }
}

    const selectedPackageData = packages.find((packageItem) => packageItem._id === selectedPackage);
    const selectedPackageFull = selectedPackageData
        ? selectedPackageData.racketTotal >= selectedPackageData.racketLimit
        : false;

    return(
        <Container className="py-4">
            <Row className="g-4">
                <Col lg={5}>
                    <Card className="p-4 shadow-sm border-0 bg-dark text-white">
                        <h4>Paketniki 📦</h4>
                        <p className="text-white-50">
                            Dodani paketniki: {packages.length} / {packageCount}
                        </p>

                        {packages.map((packageItem) => (
                            <div key={packageItem._id} className="border border-secondary rounded p-3 mb-2 bg-secondary bg-opacity-10">
                                <strong className="text-primary">{packageItem.name}</strong>
                                <div className="small text-white-50">{packageItem.location}</div>
                                <div className="mt-1">
                                    Loparji: <span className="fw-bold">{packageItem.racketTotal} / {packageItem.racketLimit}</span>
                                </div>
                                <div className="d-flex gap-2 mt-2">
                                    <Form.Control
                                        type="number"
                                        className="bg-dark text-white border-secondary"
                                        min={packageItem.racketTotal}
                                        value={packageLimitInputs[packageItem._id] ?? String(packageItem.racketLimit)}
                                        onChange={(e) => setPackageLimitInputs({
                                            ...packageLimitInputs,
                                            [packageItem._id]: e.target.value
                                        })}
                                    />
                                    <Button
                                        type="button"
                                        variant="primary"
                                        size="sm"
                                        onClick={() => updatePackageLimit(packageItem._id)}
                                    >
                                        Shrani
                                    </Button>
                                </div>
                            </div>
                        ))}

                        {remaining > 0 ? (
                            <Form onSubmit={addPackage} className="mt-3 pt-3 border-top border-secondary">
                                <h5>Dodaj nov paketnik</h5>
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

                                <Form.Group className="mb-3">
                                    <Form.Label>Direct4Me ID (boxId)</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Vnesi stevilko paketnika (npr. 1265)"
                                        value={packageBoxId}
                                        onChange={(e) => setPackageBoxId(e.target.value)}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Stevilo loparjev v paketniku</Form.Label>
                                    <Form.Control
                                        type="number"
                                        min="0"
                                        placeholder="Vnesi stevilo loparjev"
                                        value={packageRacketLimit}
                                        onChange={(e) => setPackageRacketLimit(e.target.value)}
                                        required
                                    />
                                </Form.Group>

                                <Button variant="success" type="submit" className="w-100 fw-bold">
                                    ➕ Dodaj paketnik
                                </Button>
                            </Form>
                        ) : (
                            <Alert variant="info" className="mt-3 bg-opacity-20 text-white border-info bg-info">
                                Dodal si vse paketnike, ki si jih navedel pri registraciji.
                            </Alert>
                        )}
                    </Card>
                </Col>

                <Col lg={7}>
                    <Card className="p-4 shadow-sm border-0 bg-dark text-white">
                        <h4>Dodaj lopar v paketnik 🎾</h4>
                        <Form onSubmit={addRacket} className="mt-3">
                            <Form.Group className="mb-3">
                                <Form.Label>Paketnik</Form.Label>
                                <Form.Select
                                    className="bg-dark text-white border-secondary"
                                    value={selectedPackage}
                                    onChange={(e) => setSelectedPackage(e.target.value)}
                                    required
                                >
                                    <option value="">Izberi paketnik</option>
                                    {packages.map((packageItem) => (
                                        <option key={packageItem._id} value={packageItem._id} className="bg-dark text-white">
                                            {packageItem.name} - {packageItem.location}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Model loparja</Form.Label>
                                <Form.Control
                                    type="text"
                                    className="bg-dark text-white border-secondary"
                                    placeholder="Npr. Wilson Blade, Babolat Pure Drive..."
                                    value={model}
                                    onChange={(e) => setModel(e.target.value)}
                                    required
                                />
                            </Form.Group>

                            <Form.Group className="mb-3 p-3 border border-secondary rounded bg-secondary bg-opacity-10">
                                <Form.Label className="fw-bold text-warning mb-2 d-block">Namen uporabe opreme</Form.Label>
                                <div className="d-flex gap-4">
                                    <Form.Check
                                        type="radio"
                                        id="target-rekreativec"
                                        label="👥 Za rekreativce"
                                        name="targetAudience"
                                        value="rekreativec"
                                        checked={targetAudience === 'rekreativec'}
                                        onChange={(e) => setTargetAudience(e.target.value)}
                                        className="fw-semibold"
                                    />
                                    <Form.Check
                                        type="radio"
                                        id="target-klub"
                                        label="🏢 Za člane kluba"
                                        name="targetAudience"
                                        value="klub"
                                        checked={targetAudience === 'klub'}
                                        onChange={(e) => setTargetAudience(e.target.value)}
                                        className="fw-semibold"
                                    />
                                </div>
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Opis loparja</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    className="bg-dark text-white border-secondary"
                                    placeholder="Vnesi specifikacije, težavo, težo, oprijem..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Izberi sliko loparja</Form.Label>
                                <Form.Control
                                    type="file"
                                    className="bg-dark text-white border-secondary"
                                    ref={fileInputRef}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setFile(e.target.files?.[0] ?? null)}
                                    required
                                />
                            </Form.Group>

                            <Button 
                                variant="primary" 
                                type="submit" 
                                className="w-100 fw-bold py-2 shadow-sm" 
                                disabled={packages.length === 0 || selectedPackageFull}
                            >
                                🚀 Dodaj lopar v sistem
                            </Button>

                            {selectedPackageFull && (
                                <Alert variant="warning" className="mt-3 text-dark">
                                    Izbrani paketnik je ze poln. Povecaj stevilo loparjev za ta paketnik.
                                </Alert>
                            )}
                        </Form>
                    </Card>
                </Col>
            </Row>

            {message && <Alert variant="success" className="mt-3 shadow-sm border-0">{message}</Alert>}
            {error && <Alert variant="danger" className="mt-3 shadow-sm border-0">{error}</Alert>}
        </Container>
    )
}
export default RacketRent;