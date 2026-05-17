import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import { useNavigate } from "react-router-dom";
function Racket(props: any){
    const navigate = useNavigate();

    const handleDelete = async () => {
        if (window.confirm(`Ali res želiš izbrisati lopar ${props.racket.model}?`)) {
            try {
                const response = await fetch(`http://localhost:3001/rackets/${props.racket._id}`, {
                    method: 'DELETE',
                    credentials: 'include',
                });

                if (response.ok) {
                    alert("Lopar uspešno izbrisan!");
                    if (props.onDelete) {
                        props.onDelete(props.racket._id);
                    } else {
                        window.location.reload();
                    }
                } else {
                    alert("Napaka pri brisanju loparja.");
                }
            } catch (error) {
                console.error("Napaka:", error);
                alert("Prišlo je do napake pri povezavi z zaledjem.");
            }
        }
    };
    return(
        <Card bg="dark" text="white" className="shadow-sm" style={{width: "400px",borderRadius: "12px",overflow: "hidden",}}>
            <Card.Img variant="top" src={"http://localhost:3001/" + props.racket.path} style={{height: "250px",objectFit: "cover",}}/>
            <Card.Body>
                <Card.Title className="fw-bold">
                {props.racket.model}
                </Card.Title>

                <Card.Text>
                {props.racket.description}
                </Card.Text>

                <div className="d-flex gap-2 mt-3">
          
                    <Button variant="outline-light" size="sm" onClick={() => navigate(`/racket/${props.racket._id}`)}>
                        Detajli
                    </Button>

                    <Button variant="primary" size="sm" onClick={() => navigate(`/rent/${props.racket._id}`)}>
                        Izposoja
                    </Button>
                <Button variant="danger" size="sm" onClick={handleDelete}>
                    Izbriši
                </Button>
                </div>
            </Card.Body>
        </Card>
    )
};

export default Racket