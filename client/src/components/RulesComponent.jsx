import { Accordion, Button, Col, Row, Table } from "react-bootstrap";

import "../stylesheets/RulesComponent.css";
import { useContext } from "react";
import ThemeContext from "../ThemeContext";

function RulesComponent() {

    const theme = useContext(ThemeContext);

    return (
        <div className={theme}>
            <Row className="mb-2 pt-4">
                <Col className="col-10 mx-auto">
                    <span className="h2">Conto alla Rovescia per la Vittoria: Ogni 2 Minuti è il Tuo Momento!</span>
                    <p>Apprendi le regole, gioca la combinazione fortunata e preparati a vincere. La tua avventura nel mondo del Lotto Istantaneo ha inizio da qui.</p>
                </Col>
            </Row>

            <Row className="mb-2">
                <Col className="col-10 mx-auto">
                    <Accordion defaultActiveKey={["0"]} alwaysOpen flush>
                        <Accordion.Item eventKey="0">
                            <Accordion.Header><i className="bi bi-card-list me-2"></i> Regole del gioco</Accordion.Header>
                            <Accordion.Body>Il gioco consiste nell'<span className="bold">estrazione periodica</span> di cinque numeri casuali compresi tra l'1 e 
                                il 90 e nella possibilità da parte dei giocatori di puntare su uno o più numeri (per un massimo di tre numeri) per tentare la sorte.
                                <span className="bold"> Ogni 2 minuti</span> ha luogo una nuova estrazione. Nell'attesa dell'estrazione, ogni giocatore può effettuare
                                una singola puntata.<br></br> É classificato come giocatore un qualsiasi utente che ha effettuato il login. Gli utenti non loggati non 
                                hanno la possibilità di giocare.<br></br>
                                <span className="bold">Effettua il login per effettuare la puntata e partecipare alla prossima estrazione.</span>
                            </Accordion.Body>
                        </Accordion.Item>
                        <Accordion.Item eventKey="1">
                            <Accordion.Header><i className="bi bi-cash-stack me-2"></i> Come funzionano le puntate</Accordion.Header>
                            <Accordion.Body>Le puntate si effettuano con i punti a disposizione di ciascun giocatore. Puntare su un singolo numero costa 5 punti, 
                                su due numeri 10 punti, su tre numeri 15 punti. Un giocatore può effettuare una puntata solo se ha sufficienti punti a disposizione 
                                per coprire il costo di quella puntata.</Accordion.Body>
                        </Accordion.Item>
                        <Accordion.Item eventKey="2">
                            <Accordion.Header><i className="bi bi-wallet me-2"></i> Gestione del budget</Accordion.Header>
                            <Accordion.Body>Ogni giocatore ha un budget iniziale di <span className="bold">100 punti</span>. Il budget si può incrementare solo 
                            vincendo al gioco. Una volta azzerato non si può più giocare. </Accordion.Body>
                        </Accordion.Item>
                        <Accordion.Item eventKey="3">
                            <Accordion.Header><i className="bi bi-trophy me-2"></i> Esiti e vincite</Accordion.Header>
                            <Accordion.Body>A ogni estrazione possono verificarsi tre casistiche:
                                <ul>
                                    <li>Il giocatore indovina tutti i numeri su cui ha puntato. Il giocatore vince il doppio dei punti che ha utilizzato per la puntata.</li>
                                    <li>Il giocatore non indovina alcun numero. Il giocatore non vince alcun punto.</li>
                                    <li>Il giocatore indovina solamente alcuni numeri (non tutti). Il giocatore vince un numero di punti proporzionale ai numeri indovinati 
                                        nella puntata. Il numero di punti vinti dal giocatore viene calcolato secondo la seguente formula: k/n*2*punti_usati_puntata, con k 
                                        il numero di numeri indovinati e n il numero di numeri giocati (2 oppure 3).</li>
                                </ul>
                            </Accordion.Body>
                        </Accordion.Item>
                    </Accordion>
                </Col>
            </Row>
            
            <Row className="mt-4 mb-2">
                <Col className="col-10 mx-auto">
                    <span className="h2">Tabella dei punteggi</span>
                    <p>La tabella sottostante riassume i possibili punteggi ottenibili. Tutte le possibili combinazioni di numeri puntati e numeri indovinati sono qui mostrati. </p>
                    <Table striped className="mt-2">
                        <thead>
                            <tr>
                                <th>Numeri puntati</th>
                                <th>Numeri indovinati</th>
                                <th>Punti guadagnati</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>1</td>
                                <td>1</td>
                                <td>10 punti</td>
                            </tr>
                            <tr>
                                <td>2</td>
                                <td>1</td>
                                <td>10 punti</td>
                            </tr>
                            <tr>
                                <td>2</td>
                                <td>2</td>
                                <td>20 punti</td>
                            </tr>
                            <tr>
                                <td>3</td>
                                <td>1</td>
                                <td>10 punti</td>
                            </tr>
                            <tr>
                                <td>3</td>
                                <td>2</td>
                                <td>20 punti</td>
                            </tr>
                            <tr>
                                <td>3</td>
                                <td>3</td>
                                <td>30 punti</td>
                            </tr>
                            <tr>
                                <td>1, 2 oppure 3</td>
                                <td>0</td>
                                <td>0 punti</td>
                            </tr>
                        </tbody>
                    </Table>
                </Col>
            </Row>
        </div>
    )
}

export default RulesComponent;