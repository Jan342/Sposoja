import { useEffect, useContext } from 'react';
import { UserContext } from '../contexts/userContext';
import { Navigate, useNavigate } from 'react-router-dom';

function Logout(){
    const userContext = useContext(UserContext); 
    const navigate = useNavigate();
    useEffect(function(){
        const logout = async function(){
            userContext.setUserContext(null);
            await fetch("http://localhost:3001/users/logout");

            navigate("/");
        }
        logout();
    }, []);

    return (
        null
    );
}

export default Logout;
