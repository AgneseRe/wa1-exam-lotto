import { Button, Container, Row, Col, Navbar, Stack } from "react-bootstrap";
import { Link } from "react-router-dom";
import { LogoutButton } from "./AuthComponents";

import "../stylesheets/NavHeader.css";

import { useContext } from "react";
import ThemeContext from "../ThemeContext";

function NavHeader(props) {

    const theme = useContext(ThemeContext);

    return (
        <Navbar data-bs-theme="dark">
            <Container fluid>
                <Row className="w-100 mx-1">
                    <Col className="col-2 d-flex align-items-center">
                        <Link to="/" className="navbar-brand">
                            <i className="bi bi-coin"></i>{' '}
                            <span>Lotto Istantaneo</span>
                        </Link>
                    </Col>
                    {props.loggedIn ?
                    <Col className="col-2 d-flex align-items-center">
                        <Link to="/addBet" className="me-5">Gioca adesso</Link>
                        <Link to="/ranking"><i className="bi bi-trophy"></i>{' '}Classifica</Link>
                    </Col> : <></>}
                    <Col className={`${props.loggedIn ? "col-8" : "col-10"} gap-1 d-flex align-items-center justify-content-end`}>
                        <Button variant="link" className="mx-5" onClick={props.toggleTheme}>
                            <i className={theme === "light" ? "bi bi-sun" : "bi bi-moon-stars"}></i>
                        </Button>
                        {props.loggedIn ? <>
                            <Stack direction="horizontal" className="me-3">
                                <Stack align="center">
                                    <span className="user-username">@{props.user.name}</span>
                                    <span className="user-points">{props.user.points} {props.user.points == 1 ? "punto" : "punti"}</span>
                                </Stack>
                            </Stack>
                            <LogoutButton logout={props.logout} />
                            </> : 
                        <Link to="/login" className="btn btn-outline-light">Login</Link>}
                    </Col>
                </Row>
            </Container>
        </Navbar>
    )
}

export default NavHeader;