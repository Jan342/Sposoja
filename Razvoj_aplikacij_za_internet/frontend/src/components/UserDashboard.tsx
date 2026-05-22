import { useContext, useEffect, useState } from "react";
import Racket from "./Racket";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";
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

type RacketData = {
    _id: string;
    model: string;
    description?: string;
    rated?: number;
    path?: string;
    rented?: boolean;
    owner?: string;
};

function UserDashboard(){
    const userContext = useContext(UserContext);
    const [clubs, setClubs] = useState<ClubData[]>([]);
    const [rackets, setRackets] = useState<RacketData[]>([]);
    const [selectedClub, setSelectedClub] = useState<ClubData | null>(null);
    const [showPopup, setShowPopup] = useState(false);
    const [reload, setReload] = useState(false);
    const nav = useNavigate();

    useEffect(function(){
        if(userContext.user.role == 'rekreativec'){
            const loadClubs = async function(){
                const res = new ServerRequest(`clubs`);
                const data = await (await res.get()).json();
                setClubs(data || []);
            };
            loadClubs();
        }
        
        else{
            /*const loadRackets = async function(){
                const res = new ServerRequest(`clubs/clubRackets`);
                const data = await (await res.get()).json();
                setRackets(data || []);
            };
            loadRackets();*/

            //Pridobi loparje glede na klub za clana :)
        }
    }, [userContext.user.role]);

    async function joinClub(club: ClubData){
        setSelectedClub(null)
        const res = new ServerRequest('clubs/joinClub');
        const data = await (await res.post({club_id: club._id})).json();
        if(data && userContext.user?.accountType === "user"){
            userContext.user.joinedClub = club._id;
            userContext.user.role = "clan";
        }
    }

    const refreshRackets = () => {
        setReload(prev => !prev);
    };

    if(userContext?.user?.joinedClub){
        return (
            <Container>
                <Row>
                    {rackets.map((racket: any) => (
                    <Col key={racket._id} xs={12} sm={6} md={4} className="mb-4">
                        <Racket racket={racket} onRentSuccess={refreshRackets}/>
                    </Col>
                    ))}
                </Row>
            </Container>
        )
    }
    
    return(
        <>
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
                                <Button onClick={() => setSelectedClub(club)}>Včlani se</Button>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            ))}
        </Row>

        <ConfirmPopUp
            show={selectedClub !== null}
            text="Ali se želite včlaniti?"
            onClose={() => setShowPopup(false)}
            onConfirm={() => joinClub(selectedClub)}
        />
    </>
    );
}

export default UserDashboard;
