import "bootstrap/dist/css/bootstrap.min.css";
import 'bootstrap-icons/font/bootstrap-icons.css';

import API from "./API";
import dayjs from "dayjs";

import { useState, useEffect } from "react";
import { Navigate, Routes, Route, Outlet } from "react-router-dom";
import ThemeContext from "./ThemeContext";

import { Button, Container, Modal, Toast, ToastBody } from "react-bootstrap";

import NavHeader from "./components/NavHeader";
import LottoPicker from "./components/LottoPicker";
import { LoginForm } from "./components/AuthComponents";
import RulesComponent from "./components/RulesComponent";
import RankingTable from "./components/RankingTable";
import NotFoundComponent from "./components/NotFoundComponent";

function App() {

  // state for theme and feedback in the toast
  const [theme, setTheme] = useState("light");
  const [feedback, setFeedback] = useState('');

  // state for handling logged user
  const [user, setUser] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);

  // state for handling bet and draw
  const [showAlert, setShowAlert] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showModal, setShowModal] = useState(false);

  const [drawNumbers, setDrawNumbers] = useState([]);
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [earnedPoints, setEarnedPoints] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null); // in milliseconds

  const toggleTheme = () => {
    setTheme(currTheme => currTheme === "light" ? "dark" : "light");
  }

  const setFeedbackFromError = (err) => {
      let message = '';
      if (err.message) message = err.message;
      else message = "Unknown Error";
      setFeedback(message); // Assuming only one error message at a time
  };

  /* *** Side effect for checking if the user is already logged-in. Called only the first time the component is mounted *** */
  useEffect(() => {
      API.getUserInfo()
          .then(user => {
              setLoggedIn(true);
              setUser(user);  // here you have the user info, if already logged in
          }).catch(e => {
              if(loggedIn)
                setFeedbackFromError(e);
              setLoggedIn(false); 
              setUser(null);
          }); 
  }, []);

  /* This function handles the login process. It requires a username and a password inside a "credentials" object. */
  const handleLogin = async (credentials) => {
      const user = await API.logIn(credentials);
      setUser(user); 
      setLoggedIn(true);
      setFeedback("Ciao, " + user.name + ". Che bello riverderti!");
  };

  /* This function handles the logout process. */ 
  const handleLogout = async () => {
      await API.logOut();
      setLoggedIn(false); 
      setUser(null);
  };

  /* *** Side effect for recovering next extraction time from server *** */
  useEffect(() => {
    const getNextDrawTime = async () => {
        const nextDrawTime = await API.nextDrawTime();
        setTimeLeft(dayjs(nextDrawTime).diff(dayjs())); // Set time for the next draw
    }

    const handleTimerExpiration = async () => {
        try {
          // Recover last draw
          const lastDraw = await API.getLastDraw();
          const numbers = [lastDraw.number1, lastDraw.number2, lastDraw.number3, lastDraw.number4, lastDraw.number5];
          const lastDrawId = lastDraw.id;
          setDrawNumbers(numbers);

          // If a bet is placed, calculate earned points
          const points = await API.getEarnedPoints(user.id, lastDrawId);
          if(!points.error) {
              const updatedUserPoints = await API.getUpdateUserPoints(user.id);
              setUser((prevUser) => ({
                  ...prevUser,
                  points: updatedUserPoints
              }))
              setEarnedPoints(points);
              setShowModal(true);
          } else 
              setFeedback("Non hai effettuato alcuna puntata per questa estrazione.");
        } catch(err) {
            console.log("Errore generico nella gestione del timer in scadenza");
        }
    }

    if(loggedIn) getNextDrawTime();

    const interval = setInterval(() => {
        setTimeLeft(prev => {
            if (prev <= 1000) {    // Se il tempo sta scadendo, recupera il prossimo draw time
                if(loggedIn) {
                  handleTimerExpiration();
                  setSuccessMessage(null);
                  setShowAlert(false);
                  setButtonDisabled(false);
                  setSelectedNumbers([]);
                  getNextDrawTime();
                }
                return 0;  // Reset temporaneo del tempo fino alla risposta
            }
            return prev - 1000;  // Decrementa il tempo di 1 secondo
        });
    }, 1000);// aggiornamento front-end al cambiamento dello stato

    return () => clearInterval(interval);   // cleanup function
  }, [loggedIn]);

  return (
    <>
      <ThemeContext.Provider value={theme}>
        <Routes>
          <Route path="/" element={<>
            <NavHeader toggleTheme={toggleTheme} loggedIn={loggedIn} logout={handleLogout} user={user} setUser={setUser} />
            <Container fluid className="p-0">
              <Outlet />
            </Container>
            </>}>
              <Route index element={<RulesComponent />} />
              <Route path="/login" element={loggedIn ? <Navigate replace to='/' /> : <LoginForm login={handleLogin} />} />
              <Route path="/ranking" element={!loggedIn ? <Navigate replace to='/' /> : <RankingTable />} />
              <Route path="/addBet" element={!loggedIn ? <Navigate replace to='/' /> : <LottoPicker user={user} setUser={setUser} 
                setButtonDisabled={setButtonDisabled} setSelectedNumbers={setSelectedNumbers} setSuccessMessage={setSuccessMessage} 
                setShowAlert={setShowAlert} setErrorMessage={setErrorMessage} buttonDisabled={buttonDisabled} timeLeft={timeLeft}
                earnedPoints={earnedPoints} drawNumbers={drawNumbers} errorMessage={errorMessage} successMessage={successMessage} 
                showAlert={showAlert} selectedNumbers={selectedNumbers} />} />
              <Route path="*" element={<NotFoundComponent />} />
          </Route>
        </Routes> {/* close Routes */}
        {/* Toast top-end for feedback */}
        <Toast show={feedback !== ''} autohide onClose={() => setFeedback('')} delay={4000} 
          position="top-end" className="position-fixed top-0 end-0 m-5 bg-info text-white">
          <ToastBody>
              {feedback}
          </ToastBody>
        </Toast>
        {/* Modal for information message when a bet is placed and the draw takes place */}
        <Modal show={showModal} onHide={() => setShowModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Risultato dell'Estrazione</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>
                Numeri estratti: <span className="bold">{drawNumbers.join(" - ")}</span><br></br><br></br>
                {earnedPoints > 0 ? 
                `Complimenti! Hai indovinato ${earnedPoints / 10} ${earnedPoints / 10 === 1 ? "numero" : "numeri"} e hai guadagnato ${earnedPoints} punti. Continua così!
                    Buona fortuna per le prossime estrazioni.` : 
                `Non hai guadagnato punti questa volta, ma non ti scoraggiare! Ogni tentativo ti avvicina alla prossima grande vincita. Riprova e buona fortuna per la prossima estrazione!`}
            </p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowModal(false)}>
                Chiudi
            </Button>
          </Modal.Footer>
        </Modal>
      </ThemeContext.Provider>      
    </>
  )
}

export default App
