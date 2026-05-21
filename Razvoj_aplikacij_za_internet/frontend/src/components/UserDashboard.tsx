import { useContext, useEffect, useState } from "react";
import Racket from "./Racket";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import { ServerRequest } from "../types/ServerRequest";
import { UserContext } from "../contexts/userContext";
import ClubDetails from "./ClubDetails";
import { Navigate, useNavigate } from "react-router-dom";
import ConfirmPopUp from "./ConfirmDialog";

type ClubData = {
    _id: string;
    firstname: string;
    lastname: string;
    username: string;
    clubName: string;
    address: string;
    packageCount: Number;
}

function UserDashboard(){
    const userContext = useContext(UserContext);
    const [clubs, setClubs] = useState<ClubData[]>([]);
    const [selectedClub, setSelectedClub] = useState<ClubData | null>(null);
    const [showPopup, setShowPopup] = useState(false);
    const [joinedClub, setJoinClub] = useState(false);
    const nav = useNavigate();
    /*const isClub = userContext.user?.accountType === "club";
    const [rackets, setRackets] = useState<RacketData[]>([]);
    const [packages, setPackages] = useState<Package[]>([]);
    const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
    const [packageRackets, setPackageRackets] = useState<RacketData[]>([]);
    const [reload, setReload] = useState(false);*/

    useEffect(function(){
        const loadClubs = async function(){
            const res = new ServerRequest(`clubs`);
            const data = await (await res.get()).json();
            setClubs(data || []);
        };

        loadClubs();
    }, []);

    async function joinClub(club: ClubData){
        setShowPopup(false);
        const res = new ServerRequest('clubs/joinClub');
        const data = await (await res.post({club_id: club._id})).json();
        console.log(data);
    }

    /*const refreshRackets = () => {
        setReload(prev => !prev);
    };*/

    return(
        <Row>
            {clubs.map((club) => (
                <Col key={club._id} xs={12} md={6} className="mb-4">
                    <Card bg="dark" text="white" className="shadow-sm h-100">
                        <Card.Img
                            variant="top"
                            src={"../../public/racket.jpg"}
                            style={{height: "220px", objectFit: "cover"}}
                        />
                        <Card.Body>
                            <Card.Title>{club.clubName}</Card.Title>
                            <div className="d-flex gap-3">
                                <Button onClick={() => nav(`/clubs/${club._id}`)}>Podrobnosti</Button>
                                <Button onClick={() => setShowPopup(true)}>Včlani se</Button>
                            </div>
                        </Card.Body>
                    </Card>

                    <ConfirmPopUp
                        show={showPopup}
                        text="Ali se res želiš včlaniti?"
                        onClose={() => setShowPopup(false)}
                        onConfirm={() => joinClub(club)}
                    />
                </Col>
            ))}
        </Row>
    );
}

export default UserDashboard;
