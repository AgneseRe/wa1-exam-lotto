import { Alert, Button, Card, Col, Form, Row } from "react-bootstrap";

import "../stylesheets/LottoPicker.css";

import API from "../API";
import dayjs from "dayjs";
import { Bet } from "../../../server/models/BetDraw.mjs";
import { useContext, useEffect, useState } from "react";
import LineSeparator from "./utilities/LineSeparator";
import ThemeContext from "../ThemeContext";

function LottoPicker(props) {

    const theme = useContext(ThemeContext);

    const formatTimeInMinutesAndSeconds = (time) => {
        const seconds = Math.floor(time / 1000);
        const minutesLeft = Math.floor(seconds / 60);
        const secondsLeft = seconds - minutesLeft * 60;
        return `0${minutesLeft}:${secondsLeft < 10 ? '0' : ''}${secondsLeft}`;
    }

    const handleToggleNumber = (number) => {
        if(!props.buttonDisabled) {   // if no bet is placed yet
            props.setSelectedNumbers(oldNumbers => {
                if(oldNumbers.includes(number)) {
                    props.setShowAlert(false);
                    return oldNumbers.filter(num => num !== number)
                }
                else {
                    if(oldNumbers.length < 3) {
                        props.setShowAlert(false);
                        return [...oldNumbers, number]
                    }
                    else {
                        props.setShowAlert(true);
                        props.setErrorMessage("Puoi selezionare al massimo 3 numeri");
                        return oldNumbers;
                    }
                }
            })
        }
    }

    const handleSubmit = (event) => {
        event.preventDefault();
        if(props.selectedNumbers.length === 0)
            props.setErrorMessage("Devi puntare su almeno un numero");
        else if (props.user.points < props.selectedNumbers.length*5)
            props.setErrorMessage("Punti non sufficienti a coprire l'intera puntata");
        else {
            props.setErrorMessage("");
            const bet = new Bet(props.user.id, null, dayjs().toISOString(), props.selectedNumbers[0], props.selectedNumbers[1], props.selectedNumbers[2], null);
            /* *** Place bet *** */
            API.addBet(bet).then(() => {
                /* If it is possible to place a bet, update points */
                const pointsToDeduct = props.selectedNumbers.length * 5;
                API.updatePoints(props.user.id, pointsToDeduct)
                    .then(() => {
                        props.setUser((prevUser) => ({
                            ...prevUser,
                            points: prevUser.points - pointsToDeduct
                        }))
                        props.setButtonDisabled(true);
                        props.setSuccessMessage(`Puntata effettuata con successo. Numeri puntati: ${props.selectedNumbers}. Attendi la prossima estrazione.`);
                    })
                    .catch((err) => {
                        props.setErrorMessage(`Errore durante l'aggiornamento dei punti. Riprovare.`);
                    });
            })
            .catch((err) => {
                props.setErrorMessage("Errore durante l'invio della puntata. Riprovare.");
            });
        }
        props.setShowAlert(true);
    }

    return (
        <div className={theme}>
            <Row className="pt-3 w-100 justify-content-center">
        
                <Col md={4} className="mx-5">
                    <Card className="lotto-card">
                        <Card.Title>
                            <Row>
                                <Col className="d-flex align-items-center justify-content-center" as="h5">SCEGLI DA 1 A 3 NUMERI</Col>
                            </Row>
                        </Card.Title>
                        <Card.Body>
                            <Form onSubmit={handleSubmit}>
                                <Alert variant={`${props.errorMessage ? "danger" : "success"}`} show={props.showAlert} onClose={() => props.setShowAlert(false)} dismissible>
                                    {props.errorMessage ? props.errorMessage : props.successMessage}
                                </Alert>
                                <div className="lotto-grid">
                                {Array.from({ length: 90}, ( _, i ) => i + 1).map(number => (
                                    <div key={number} className={`number ${props.selectedNumbers.includes(number) ? "selected" : ""}`} 
                                    onClick={() => handleToggleNumber(number)}>{number}</div>
                                ))}
                                </div>
                                <Button type="submit" variant="success bet-button" className="mt-3" disabled={props.buttonDisabled}>
                                    Effettua una puntata
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={6} className="">
                    <Row className="row-estrazione">
                        <LineSeparator><span>PROSSIMA ESTRAZIONE</span></LineSeparator>
                        <p className="countdown-timer">{formatTimeInMinutesAndSeconds(props.timeLeft)}</p>
                    </Row>
                    <Row className="row-regole">
                        <p>Seleziona da 1 a 3 numeri, effettua la puntata e attendi l'estrazione. Potrai guadagnare da 0 a 30 punti, a seconda di quanti
                        numeri sono stati giocati e di quanti numeri sono stati indovinati. Se hai cliccato erroneamente su un numero, ti basterà fare
                        nuovamente click per deselezionarlo. Puoi effettuare <span className="bold">una singola puntata per ogni estrazione</span> e 
                        solo se hai sufficienti punti a disposizione per coprirne l'intero costo.</p> 
                    </Row>
                    <Row className="row-punti">
                        <Col>
                            <i className="bi bi-check-circle"></i>
                            <p>Punti a disposizione</p>
                            <span className="punti">{props.user.points} {props.user.points == 1 ? "punto" : "punti"}</span>
                        </Col>
                    </Row>
                    <Row className="row-punti">
                        <Col className="ml-5">
                            <i className="bi bi-currency-dollar"></i>
                            <p>Costo puntata</p>
                            <span className="punti">{props.selectedNumbers.length*5} punti</span>
                        </Col>
                    </Row>
                    <Row className="row-punti">
                        <Col>
                            <i className="bi bi-graph-up"></i>
                            <p>Vincita potenziale</p>
                            <span className="punti">{props.selectedNumbers.length*10} punti</span>
                        </Col>
                    </Row>
                </Col>
            </Row>
        </div>
        )
}

export default LottoPicker;