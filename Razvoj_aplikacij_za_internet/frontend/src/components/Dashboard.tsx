import { useEffect, useState } from "react";
import Racket from "./Racket";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

function Dashboard(){
    const [rackets, setRackets] = useState([]);
    const [reload, setReload] = useState(false);
    useEffect(function(){
        const getRackets = async function(){
            const res = await fetch("http://localhost:3001/rackets");
            const data = await res.json();
            setRackets(data);
        }
        getRackets();
    }, [reload]);

    const refreshRackets = () => {
        setReload(prev => !prev);
    };

    return(
        <Container>
            <Row>
                {rackets.map((racket: any) => (
                <Col key={racket._id} xs={12} sm={6} md={4} className="mb-4">
                    <Racket racket={racket} onRentSuccess={refreshRackets}/>
                </Col>
                ))}
            </Row>
        </Container>
    );
}

export default Dashboard;