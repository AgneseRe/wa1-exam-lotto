import { Alert, Button, Card, Form, Row, Col } from "react-bootstrap";
import LineSeparator from "./utilities/LineSeparator";
import "../stylesheets/AuthComponents.css";
import { useContext, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import ThemeContext from "../ThemeContext";

function LoginForm(props) {

    // state
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [show, setShow] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // theme context
    const theme = useContext(ThemeContext);

    const navigate = useNavigate();

    const handleSubmit = (event) => {
        event.preventDefault();

        const credentials = { username, password };
        props.login(credentials)
        .then ( () => navigate( "/addBet" ) )
        .catch( (err) => {
            if(err.message === "Unauthorized")
                setErrorMessage("Invalid username and/or password");
            else
                setErrorMessage(err.message);
            setShow(true);
        });
    }

    return (
        <div className={theme}>
            <Row className="pt-3">
                <Col md={4} className="mx-auto">
                    <Card className="login-card">
                        <Card.Title>
                            <h3>Login</h3>
                            <p>Effettua il login per giocare al lotto istantaneo</p>
                        </Card.Title>
                        <Card.Body className="pt-0">
                            <Form onSubmit={handleSubmit}>
                            <Alert dismissible show={show} onClose={() => setShow(false)} variant="danger"> {errorMessage} </Alert>
                                <Form.Group className="mb-3" controlId="formBasicEmail">    {/* instead of id and for. Web accessibility */}
                                    <Form.Label>Email address<span className="mandatory">*</span></Form.Label>
                                    <Form.Control type="email" placeholder="Enter email" value={username} 
                                        onChange={event => setUsername(event.target.value)} required={true} />
                                </Form.Group>
                                <Form.Group className="mb-3" controlId="formBasicPassword">
                                    <Form.Label>Password<span className="mandatory">*</span></Form.Label>
                                    <Form.Control type="password" placeholder="Password" value={password} 
                                        onChange={event => setPassword(event.target.value)} required={true} />
                                </Form.Group>
                                <Button type="submit" variant="success" className="mt-3 login-button">Login</Button>{' '}
                                <LineSeparator>or</LineSeparator>
                                <Link className={`btn ${theme === "light" ? "btn-outline-secondary" : "btn-secondary"} guest-button`} to={"/"}>Continua come ospite</Link>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    )
}

function LogoutButton(props) {
    return(
      <Button variant='outline-light' onClick={props.logout}>Logout</Button>
    )
  }

export { LoginForm, LogoutButton };