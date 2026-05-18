import { Link } from "react-router-dom";
import { UserContext } from "../contexts/userContext";
import { Navbar, Nav } from "react-bootstrap";
import logo from "../assets/logo.svg";

function Header() {
  return (
    <Navbar bg="light" expand="lg">
      <Navbar.Brand as={Link} to="/">
        <img
          src={logo}
          width="45"
          height="45"
          className="d-inline-block align-top me-2 ms-4"
          alt="Logo"
        />{" "}
        Domov
      </Navbar.Brand>

      <Navbar.Toggle />
      <Navbar.Collapse className="justify-content-end">
        <Nav>

          <UserContext.Consumer>
            {value =>
              value.user ? (
                <>
                  <Nav.Link as={Link} to="/dashboard">
                    Nadzorna plošča
                  </Nav.Link>
                  <Nav.Link as={Link} to="/rent">
                    Dodaj lopar
                  </Nav.Link>
                  <Nav.Link as={Link} to="/profile">
                    Profil
                  </Nav.Link>
                  <Nav.Link as={Link} to="/logout">
                    Odjava
                  </Nav.Link>
                </>
              ) : (
                <>
                  <Nav.Link as={Link} to="/login">
                    Prijava
                  </Nav.Link>
                  <Nav.Link as={Link} to="/register">
                    Registracija
                  </Nav.Link>
                </>
              )
            }
          </UserContext.Consumer>

        </Nav>
      </Navbar.Collapse>
    </Navbar>
  );
}

export default Header;