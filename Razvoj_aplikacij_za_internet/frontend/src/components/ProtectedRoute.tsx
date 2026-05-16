import { useContext, type JSX } from "react";
import { UserContext } from "../contexts/userContext";
import { Navigate } from "react-router-dom";

type ProtectedRouteProps = {
  children: JSX.Element;
};

function ProtectedRoute({
  children,
}: ProtectedRouteProps) {
  const userObj = useContext(UserContext);

  if (!userObj.user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute