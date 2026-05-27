import { Link } from "react-router-dom";
import { UserContext } from "../contexts/userContext";
import { Navbar, Nav, NavDropdown } from "react-bootstrap";
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
        <Nav className="align-items-center">

          <UserContext.Consumer>
            {value => {
              const user = value && value.user ? (value.user as any) : null;

              if (user) {
                const userInitial = user.username ? user.username.charAt(0).toUpperCase() : "U";

                const dropdownTitle = (
                  <div className="d-inline-flex align-items-center align-middle">
                    {user.profileImage ? (
                      <img
                        src={user.profileImage}
                        alt="Profil"
                        style={{
                          width: "35px",
                          height: "35px",
                          borderRadius: "50%",
                          objectFit: "cover",
                          border: "2px solid #0d6efd"
                        }}
                      />
                    ) : (
                      <div
                        className="d-flex align-items-center justify-content-center fw-bold text-white shadow-sm"
                        style={{
                          width: "35px",
                          height: "35px",
                          borderRadius: "50%",
                          background: "linear-gradient(135deg, #0d6efd 0%, #0a4da2 100%)",
                          fontSize: "1rem"
                        }}
                      >
                        {userInitial}
                      </div>
                    )}
                    <span className="ms-2 text-dark d-none d-sm-inline">{user.username}</span>
                  </div>
                );
                return (
                  <>
                    <Nav.Link as={Link} to="/dashboard">
                      Nadzorna plošča
                    </Nav.Link>
                    
                    {user.accountType === "club" && (
                      <Nav.Link as={Link} to="/rent">
                        Dodaj lopar
                      </Nav.Link>
                    )}

                    {}
                    <NavDropdown 
                      title={dropdownTitle} 
                      id="user-profile-dropdown" 
                      align="end"
                      className="ms-2 custom-avatar-dropdown"
                    >
                      <NavDropdown.Item as={Link} to="/profile">
                        👤 Moj profil
                      </NavDropdown.Item>
                      <NavDropdown.Divider />
                      <NavDropdown.Item as={Link} to="/logout" className="text-danger">
                        🚪 Odjava
                      </NavDropdown.Item>
                    </NavDropdown>
                  </>
                );
              } else {
                return (
                  <>
                    <Nav.Link as={Link} to="/login">
                      Prijava
                    </Nav.Link>
                    <Nav.Link as={Link} to="/register">
                      Registracija
                    </Nav.Link>
                  </>
                );
              }
            }}
          </UserContext.Consumer>
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  );
}
export default Header;