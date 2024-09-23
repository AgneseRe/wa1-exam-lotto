/* *** Importing modules *** */
import cors from 'cors';
import dayjs from 'dayjs';
import morgan from 'morgan';
import express, { request, response } from 'express';
import session from 'express-session';
import passport from 'passport';
import LocalStrategy from 'passport-local';

import UserDao from './dao/userDao.mjs';
import { addBet, addDraw, assignDrawToBet, getRankingList, getAllInterestedBets, getCurrentBet, getLastDraw, updateEarnedPointsBet, getEarnedPoints } from './dao/lottoDao.mjs';

/* *** Init express *** */
const app = new express();
const port = 3001;

/* *** Add logger and json middlewares *** */
app.use(morgan('dev'));   // combined, common, dev, short, tiny
app.use(express.json());

/* *** Set up and enable CORS *** */
const corsOptions = {
  origin: 'http://localhost:5173',
  optionsSuccessStatus: 200,
  credentials: true
};
app.use(cors(corsOptions));

/* *** Passport: setup Local Strategy *** */
const userDao = new UserDao();
passport.use(new LocalStrategy(async function verify(username, password, callback) {
  const user = await userDao.getUserByCredentials(username, password);
  if(!user)
    return callback(null, false, { message: "Incorrect username or password." });
  else
    return callback(null, user); // user info in the session (all fields returned by userDao.getUserByCredentials(), i.e, id, name, email, points)
}))

/* *** Serializing in the session the user object given from LocalStrategy(verify) *** */
passport.serializeUser(function (user, callback) {  // this user is id + name + email + points
  callback(null, user);
});

/* *** Starting from the data in the session, we extract the current (logged-in) user *** */
passport.deserializeUser(function (user, callback) {  // this user is id + name + email + points
  return callback(null, user);
});

/* *** Express session *** */
app.use(session({
  secret: "This is the secret information of Agnese Re used to initialize the session!",
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.authenticate('session'));

/* *** Defining authentication verification middleware *** */
const isLoggedIn = (req, res, next) => {
  if(req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({error: 'Not authorized'});
}

/* *** Authentication APIs *** */

// POST /api/sessions - route for performing login
app.post("/api/sessions", function(req, res, next) {
  passport.authenticate('local', (err, user, info) => {
    if(err)
      return next(err);
    if(!user)
      return res.status(401).json({ error: info });
    // success, perform the login and extablish a login session
    req.login(user, (err) => {
      if (err)
        return next(err);

    // req.user contains the authenticated user, we send all the user info back
    // this is coming from userDao.getUserByCredentials() in LocalStratecy Verify Function
      return res.json(req.user);
    });   
  })(req, res, next);
})

// GET /api/sessions/current - checks whether the user is logged in or not
app.get('/api/sessions/current', (req, res) => {
  if(req.isAuthenticated()) {
    res.status(200).json(req.user);}
  else
    res.status(401).json({error: 'Not authenticated'});
});

// DELETE /api/session/current - for loggin out the current user
app.delete('/api/sessions/current', (req, res) => {
  req.logout(() => {
    res.end();
  });
});

/* *** User APIs *** */

// PUT /api/updatePoints/:userId
app.put('/api/updatePoints/:userId', isLoggedIn, async (request, response) => {
  try {
    const userId = request.params.userId;
    const { pointsToDeductOrAdd } = request.body;

    const result = await userDao.updatePoints(userId, pointsToDeductOrAdd);
    if (result.error) // Not available user
      response.status(404).json({ error: `User with id ${userId} not found` });
    else {
      // Checks that the user whose points must be updated corresponds to the logged in user
      if(Number(userId) !== request.user.id)  // request.user.id is a number
        response.status(403).json({error: "You are not authorized to update points of another user"});
      else
        response.status(200).json({ message: `Points updated for user ${userId}`, changes: result });
    }
  } catch(err) {
      response.status(500).json({ error: 'Internal server error' });
  }
})

// GET /api/points/:userId
app.get('/api/points/:userId', isLoggedIn, async (request, response) => {
  try {
    const userId = request.params.userId;
    const points = await userDao.getUpdateUserPoints(userId);
    if(!points.error)
      response.status(200).json(points);
    else // User not found
      response.status(404).json({ error: `User with id ${userId} not found` });
  } catch(err) {
      response.status(500).json({error: 'Error in retrieving user points'});
  }
})

/* *** Ranking API *** */

// GET /api/rankingList
app.get('/api/rankingList', isLoggedIn, async (request, response) => {
  try {
    const rankingList = await getRankingList();
    response.status(200).json(rankingList);
  } catch(err) {
      response.status(500).end()
  }
})

/* *** Draw APIs and useful functions *** */

let nextDrawTime = dayjs().add(2, 'minute'); // for the first time
let drawId = null;

/**
 * Calculates the earned points based on the draw and the bet.
 * 
 * The function compares the numbers drawn (`draw`) with the numbers selected in a bet (`bet`). It calculates 
 * the points earned based on the number of matched numbers and the total number of non-null bet numbers.
 * 
 * @param {Object} draw - An object representing the draw result.
 * @param {Object} bet - An object representing the bet.
 * 
 * @returns {number} The number of earned points based on the bet and the draw.
 */
function calculateEarnedPoints(draw, bet) {
  let earnedPoints = 0;

  const drawNumbers = [draw.number1, draw.number2, draw.number3, draw.number4, draw.number5];
  const betNumbers = [bet.number1, bet.number2, bet.number3];

  // Counting bet numbers (1, 2 or 3)
  const nonNullNumbers = betNumbers.filter(number => number !== null && number !== undefined);
  // Check how many numbers are in common between the draw and the bet
  const matchedNumbers = betNumbers.filter(number => drawNumbers.includes(number));

  if(matchedNumbers.length === nonNullNumbers.length) // all number guessed
    earnedPoints = nonNullNumbers.length * 5 * 2;  // points spent on the bet multiply by 2
  else {
    earnedPoints = matchedNumbers.length / nonNullNumbers.length * 2 * (nonNullNumbers.length * 5);
  }

  return earnedPoints;
}

/**
 * Generates an array of 5 unique random numbers between 1 and 90.
 * 
 * The function creates an array containing exactly 5 unique random integers. 
 * Each number is between 1 and 90 (inclusive). It ensures that no duplicate 
 * numbers are included in the array.
 * 
 * @returns {number[]} An array of 5 unique random numbers ranging from 1 to 90.
 */
function generateRandomNumbers() {
  let numbers = [];

  while(numbers.length < 5) {
    let randomNumber = Math.floor(Math.random() * 90) + 1;  /* Math.random() * (max - min + 1) + min */
    if(!numbers.includes(randomNumber))
      numbers.push(randomNumber);
  }

  return numbers;   // return [67, 1, 78, 2, 4] a fine di debug
}

async function generateDraw() {
  const numbers = generateRandomNumbers();
  const timeDraw = dayjs(); // time of draw
  nextDrawTime = timeDraw.add(2, 'minute'); // time of the next draw

  const draw = { 
    timestamp: timeDraw.toISOString(), 
    number1: numbers[0], 
    number2: numbers[1], 
    number3: numbers[2], 
    number4: numbers[3], 
    number5: numbers[4] 
  }
  try {
    drawId = await addDraw(draw);
    console.log(`New draw saved with ID: ${drawId}`); // only for debug in VSCode console
    await assignDrawToBet(drawId, draw);
    const bets = await getAllInterestedBets(drawId);  // tutte le puntate di questa estrazione
    for (const bet of bets) {
      const points = calculateEarnedPoints(draw, bet);
      await userDao.updatePoints(bet.userId, -points);  // Aggiorna i punti dell'utente (attenzione al -)
      await updateEarnedPointsBet(bet, points); // Setta il numero di punti guadagnati in quella puntata
    }  
  } catch(error) {
      console.log("Error saving the draw");
  }
}

// generateRandomNumbers();
setInterval(() => generateDraw(), 120000); /* The first execution happens after delay milliseconds. */

// GET /api/nextDrawTime
app.get('/api/nextDrawTime', isLoggedIn, (request, response) => {
  response.json({time: nextDrawTime});
})

// GET /api/lastDraw
app.get('/api/lastDraw', isLoggedIn, async (request, response) => {
  try {
    const result = await getLastDraw();
    if(!result.error)
      response.status(200).json(result);
    else
      response.status(404).json({error: "Nessun estrazione ancora generata. Attendere la prima"});
  } catch(err) {
      response.status(500).json("Internal Server Error");
  }
})

/* *** Bet APIs *** */
// GET /api/currentBet/:userId
app.get('/api/currentBet/:userId', isLoggedIn, async (request, response) => {
  try {
    const userId = request.params.userId; // it is a string

    // Checks that the user getting the bet corresponds to the logged in user
    if(Number(userId) !== request.user.id)  // request.user.id is a number
      response.status(403).json({error: "You are not authorized to get the current bet of another user"});
    else {
      const result = await getCurrentBet(userId, nextDrawTime);
      response.json(result);
    }
  } catch(error) {
      response.status(503).json(`Error in recover current bet for User with id ${userId}`);
  }
})

// POST /api/submitBet
app.post('/api/submitBet', isLoggedIn, async (request, response) => {
  try {
    const bet = request.body;

    // Checks that the user placing the bet corresponds to the logged in user
    if(bet.userId !== request.user.id)
      return response.status(403).json({error: "You are not authorized to place this bet"});
    
    // Checks if the user has already placed a bet in this draw
    // Resolves with a Bet or with an object with error property (no already placed)
    const currentBet = await getCurrentBet(bet.userId, nextDrawTime);
    if(!currentBet.error)
      return response.status(403).json({error: "You have already placed a bet in this draw. Wait for the next"});

    // Checks if the user has a sufficient number of points to place a bet
    const nonNullCount = [bet.number1, bet.number2, bet.number3].filter(number => number !== null).length;
    if(request.user.points < nonNullCount * 5)
      return response.status(403).json({error: "You don't have enough points to place the bet"});

    // All is ok
    const id = await addBet(bet);
    response.status(201).end(); // response.status(201).location(id).end() url new resource
  } catch(error) {
      response.status(503).json({error: "Impossible to place bet"})
  }
})

// GET /api/earnedPoints/:userId/:drawId
app.get('/api/earnedPoints/:userId/:drawId', isLoggedIn, async (request, response) => {
  try {
    const userId = request.params.userId;
    const drawId = request.params.drawId;
    const result = await getEarnedPoints(userId, drawId);
    response.status(200).json(result);
  } catch(error) {
      response.status(503).json("Impossible to get points of this bet")
  }
})

/* *** Activate the server *** */
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});