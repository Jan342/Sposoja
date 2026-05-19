import { useContext, type JSX } from "react";
import { UserContext } from "../contexts/userContext";
import { Navigate } from "react-router-dom";

type ProtectedRouteProps = {
  children: JSX.Element;
  role: "user" | "club";
};

function ProtectedRoute({
  children,
  role
}: ProtectedRouteProps) {
  const userObj = useContext(UserContext);

  if (!userObj.user) {
    return <Navigate to="/login" replace />;
  }

  if (role && userObj.user.accountType !== role) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute