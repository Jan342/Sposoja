import { type ChangeEvent, type FormEvent, useState } from "react"
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";

function RacketRent(){
    const [model, setModel] = useState('');
    const [description, setDescription] = useState('');
    const[file, setFile] = useState<File | null>(null);

    async function onSubmit(e: FormEvent<HTMLFormElement>){
        e.preventDefault();
        if (!file) {
            return;
        }
        const formData = new FormData();
        formData.append('name', model);
        formData.append('image', file);
        formData.append('description', description);
        const res = await fetch('http://localhost:3001/rackets/addRacket', {
            method: 'POST',
            credentials: 'include',
            body: formData
        });
        const data = await res.json();
        if(data != null){
            window.location.href="/dashboard";
        }
    }


    return(
        <Form onSubmit={onSubmit} className="p-4 bg-light rounded shadow-sm">
            <Form.Group className="mb-3">
                <Form.Label>Ime modela</Form.Label>
                <Form.Control
                type="text"
                placeholder="Vnesi ime modela"
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
                onChange={(e: ChangeEvent<HTMLInputElement>) => setFile(e.target.files?.[0] ?? null)}
                />
            </Form.Group>

            <Button variant="primary" type="submit" className="w-100">
                Dodaj lopar za izposojo
            </Button>
        </Form>
    )
}
export default RacketRent
