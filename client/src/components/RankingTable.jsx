import { Col, Row, Table } from "react-bootstrap";

import "../stylesheets/RankingTable.css"

import API from "../API";

import { useState, useEffect, useContext } from "react";
import ThemeContext from "../ThemeContext";

function RankingTable(props) {

    const theme = useContext(ThemeContext);

    const [rankingList, setRankingList] = useState([]); // Stato per salvare la classifica
    const [loading, setLoading] = useState(true); // Stato per gestire il caricamento

    // Effettua la chiamata API quando il componente viene montato
    useEffect(() => {
        const getRankingList = async () => {
            try {
                const ranking = await API.getRankingList();
                setRankingList(ranking); // Salva la classifica nello stato
                setLoading(false); // Imposta il caricamento a false una volta completato
            } catch (error) {
                console.error("Errore nel recuperare la classifica:", error);
                setLoading(false); // Imposta il caricamento a false anche in caso di errore
            }
        }
        getRankingList();
    }, []);

    return(
        <div className={theme}>
            <Row className="pt-4">
                <Col md={6} className="mx-auto text-center ranking-title">
                    <i className="bi bi-trophy-fill"></i> Top 3 giocatori <i className="bi bi-trophy-fill"></i>
                </Col>
            </Row>
            <Row className="pt-4">
                <Col md={6} className="mx-auto">
                    {loading ? (
                        <p>Caricamento in corso...</p> // Mostra un messaggio di caricamento
                    ) : (
                        <Table striped>
                            <thead>
                                <tr>
                                    <th>Posizione</th>
                                    <th>Giocatore</th>
                                    <th>Punti</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rankingList.map((user, index) => 
                                    <RankingRow key={index} user={user} position={index + 1} />)}
                            </tbody>
                        </Table>
                    )}
                </Col>
            </Row>
        </div>
    )
}

function RankingRow(props) {
    let awardClass = "";
    if(props.position === 1)
        awardClass = "gold";
    else if(props.position === 2)
        awardClass = "silver";
    else
        awardClass = "bronze";

    return(<>
        <tr>
            <td>{props.position}</td>
            <td>{props.user.name}</td>
            <td>{props.user.points} <i className={`bi bi-award ${awardClass}`}></i></td>
        </tr>
    </>)
}

export default RankingTable;