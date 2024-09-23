import db from "./db.mjs"
import dayjs from "dayjs";
import { Bet, Draw } from "../models/BetDraw.mjs";

/* *** Add new Draw *** */
/* Number range constraint in db INTEGER CHECK("number" BETWEEN 1 AND 90) */
export const addDraw = (draw) => {
    return new Promise((resolve, reject) => {
        let sql = "INSERT INTO Draw(timestamp, number1, number2, number3, number4, number5) VALUES(?, ?, ?, ?, ?, ?)";
        db.run(sql, [draw.timestamp, draw.number1, draw.number2, draw.number3, draw.number4, draw.number5], function (err) {
            if (err)
                reject(err);
            else
                resolve(this.lastID);
        })
    })
}

/* *** Get last draw *** */
export const getLastDraw = () => {
    return new Promise((resolve, reject) => {
        let sql = "SELECT * FROM Draw ORDER BY id DESC LIMIT 1";
        db.get(sql, [], (err, row) => {
            if (err)
                reject(err);
            else if (row === undefined)
                resolve({error: "Nessun estrazione ancora generata. Attendere la prima."}) 
            else {
                const lastDraw = new Draw(row.id, row.timestamp, row.number1, 
                    row.number2, row.number3, row.number4, row.number5);
                resolve(lastDraw);
            }
        })
    })
}

/* *** Get three players with the highest score *** */
export const getRankingList = () => {
    return new Promise((resolve, reject) => {
        let sql = "SELECT * FROM User ORDER BY points DESC LIMIT 3";
        db.all(sql, [], (err, rows) => {
            if(err)
                reject(err);
            else {
                const topUsers = rows.map(row => ({name: row.name, points: row.points}));
                resolve(topUsers);
            }
        })
    })
}

/* *** Add new bet *** */
/* Check that the user placing the bet is registered (further dao level control - if(bet.userId !== request.user.id) in index.mjs). 
    Number range constraint in db INTEGER CHECK("number" BETWEEN 1 AND 90). Bet on at least one number constraint in db 
    INTEGER NOT NULL CHECK("number1" BETWEEN 1 AND 90). Reject in case of db error */
export const addBet = (bet) => {
    return new Promise((resolve, reject) => {
        let sql = "SELECT * FROM User WHERE id = ?";
        db.get(sql, [bet.userId], (err, row) => {
            if (err)
                reject(err);
            else if (row === undefined)
                resolve({error: "User not available. Only registered users can place a bet"});
            else {  
                // Available user
                let sql = "INSERT INTO Bet(userId, timestamp, number1, number2, number3, earnedPoints) VALUES(?, ?, ?, ?, ?, ?)";
                db.run(sql, [bet.userId, bet.timestamp, bet.number1, bet.number2, bet.number3, bet.earnedPoints], function (err) {
                    if (err)
                        reject(err);
                    else
                        resolve(this.lastID);
                })
            }
        })
    })
}

/* *** Get current bet *** */
/* Returns, if it exists, the current bet of a certain user */
export const getCurrentBet = (userId, nextDrawTime) => {
    return new Promise((resolve, reject) => {
        let sql = "SELECT * FROM User WHERE id = ?";
        db.get(sql, [userId], (err, row) => {
            if (err) 
                reject(err);
            else if (row === undefined)
                resolve({error: "User not available. An unregistered user can not place a bet"});
            else {
                let sql = "SELECT * FROM Bet WHERE userId = ? AND timestamp > ? AND timestamp <= ?";
                const timestampMinusTwo = dayjs(nextDrawTime).subtract(2, 'minute').toISOString();
                db.get(sql, [userId, timestampMinusTwo, nextDrawTime], (err, row) => {
                    if (err)
                        reject(err);
                    else if (row === undefined)
                        resolve({error: `No bets placed yet for this draw by User with ID ${userId}`});
                    else {
                        const currentBet = new Bet(userId, row.drawId, row.timestamp, 
                            row.number1, row.number2, row.number3, row.earnedPoints);
                        resolve(currentBet);
                    }         
                })
            }
        })
    })
}

/* *** Update bet (assign it to its draw) *** */
/* At the time of draw. The timestamp is the time in which the draw takes place */
export const assignDrawToBet = (drawId, draw) => {
    return new Promise((resolve, reject) => {
        let sql = "UPDATE Bet SET drawId = ? WHERE timestamp < ? AND timestamp > ?";
        const timestampMinusTwo = dayjs(draw.timestamp).subtract(2, 'minute').toISOString();
        db.run(sql, [drawId, draw.timestamp, timestampMinusTwo], function (err) {
            if (err)
                reject(err);
            else
                resolve(this.changes);
        })
    })
} 

/* *** Calculate (update) earned points *** */
export const updateEarnedPointsBet = (bet, points) => {
    return new Promise((resolve, reject) => {
        let sql = "UPDATE Bet SET earnedPoints = ? WHERE userId = ? AND drawId = ?";
        db.run(sql, [points, bet.userId, bet.drawId], function (err) {
            if (err)
                reject(err);
            else
                resolve(this.changes);
        })
    })
}

/* *** Get earned points *** */
export const getEarnedPoints = (userId, drawId) => {
    return new Promise((resolve, reject) => {
        let sql = "SELECT earnedPoints FROM Bet WHERE userId = ? AND drawId = ?";
        db.get(sql, [userId, drawId], (err, row) => {
            if (err)
                reject(err);
            else if (row === undefined) {
                resolve({ error: `Nessuna puntata effettuata per questa estrazione dallo User con id ${userId}`});
            }
            else
                resolve(row.earnedPoints);
        })
    })
}

/* *** Get all the bets for the current draw *** */
export const getAllInterestedBets = (drawId) => {
    return new Promise((resolve, reject) => {
        let sql = "SELECT * FROM Bet WHERE drawId = ?";
        db.all(sql, [drawId], (err, rows) => {
        if (err)
            reject(err);
        else {
            const bets = rows.map((row) => new Bet(row.userId, drawId, 
                row.timestamp, row.number1, row.number2, row.number3,
                row.earnedPoints
            ));
            resolve(bets);
           }
       })
    })
}