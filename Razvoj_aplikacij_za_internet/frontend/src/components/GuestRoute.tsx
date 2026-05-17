import { Navigate } from "react-router-dom";
import { UserContext } from "../contexts/userContext";
import { useContext, type JSX } from "react";

type GuestRouteProps = {
  children: JSX.Element;
};


function GuestRoute({ children }: GuestRouteProps) {
  const userObj = useContext(UserContext);

  if (userObj.user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default GuestRoute