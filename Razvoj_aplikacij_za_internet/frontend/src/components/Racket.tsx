import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import { useNavigate } from "react-router-dom";
import { ServerRequest } from "../types/ServerRequest";
import { useContext } from "react";
import { UserContext } from "../contexts/userContext";
import { usePopup } from "../contexts/popupContext";
import Badge from "react-bootstrap/Badge";

function Racket(props: any) {
    const navigate = useNavigate();
    const context = useContext(UserContext);
    const getPopUp = usePopup();

    const user = context?.user as any;
    const isClub = user && (user.role === "klub" || user.isClubMember);

    const handleDelete = async () => {
        //if (window.confirm(`Ali res želiš izbrisati lopar ${props.racket.model}?`)) {
        try {
            const response = await fetch(`http://localhost:3001/rackets/${props.racket._id}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (response.ok) {
                getPopUp.confirm({ text: "Lopar uspešno izbrisan!", showCancel: false })
                window.location.reload();
            } else {
                getPopUp.confirm({ text: "Napaka pri brisanju loparja.", showCancel: false })
            }
        } catch (error) {
            console.error("Napaka:", error);
        }
        //}
    };

    async function handleRent() {
        if (props.racket.rented) {
            //alert("Ta lopar je že zaseden!");
            getPopUp.confirm({ text: "Ta lopar je že zaseden!", showCancel: false })
            return;
        }

        const res = new ServerRequest("rackets/rentRacket");
        const responseObj = await res.post({ racket: props.racket._id });
        const data = await responseObj.json();

        if (responseObj.status === 200) {
            if (context && context.setUserContext && data.user) {
                context.setUserContext(data.user);
            }
            if (props.onRentSuccess) {
                props.onRentSuccess();
            }
            //alert("Lopar uspešno izposojen!");
            getPopUp.confirm({ text: "Lopar uspešno izposojen!", showCancel: false })
        } else {
            //alert(data.error || data.message || "Prišlo je do napake pri izposoji.");
            getPopUp.confirm({ text: data.error || data.message || "Prišlo je do napake pri izposoji.", showCancel: false })
        }
    }

    return (
        <Card bg="dark" text="white" className="shadow-sm w-100 h-100 d-flex flex-column" style={{ borderRadius: "12px", overflow: "hidden" }}>
            <Card.Img variant="top" src={"http://localhost:3001/" + props.racket.path} style={{ height: "250px", objectFit: "cover" }} />
            <Card.Body className="d-flex flex-column justify-content-between">
                <div>
                    <Card.Title className="fw-bold text-capitalize">{props.racket.model}</Card.Title>
                    <Card.Text className="text-white-50">{props.racket.description}</Card.Text>
                </div>

                <div className="d-flex gap-2 mt-4 justify-content-start">

                    {/* OWNER */}
                    {props.racket.owner === user?._id ? (
                        <>
                            <Button
                                variant="outline-light"
                                size="sm"
                                onClick={() => navigate(`/racket/edit/${props.racket._id}`)}
                            >
                                Uredi podatke
                            </Button>

                            <Button
                                variant="danger"
                                size="sm"
                                //onClick={handleDelete}
                                onClick={() => getPopUp.confirm({ text: `Ali res želiš izbrisati lopar ${props.racket.model}?`, showCancel: true, onConfirm: handleDelete })}
                            >
                                Izbriši
                            </Button>
                        </>
                    ) : (
                        user?.role === 'clan' ? (
                            <Badge bg="secondary" className="p-2">Samo za ogled</Badge>
                        ) : (
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() => getPopUp.confirm({ text: "Ali želite izposoditi ta lopar?", showCancel: true, onConfirm: handleRent })}
                                disabled={props.racket.rented}
                            >
                                {props.racket.rented ? "Zasedeno" : "Izposoja"}
                            </Button>
                        )
                    )}

                </div>
            </Card.Body>
        </Card>
    );
}

export default Racket;