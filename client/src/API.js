const SERVER_URL = 'http://localhost:3001/api';

/**
 * This function wants username and password inside a "credentials" object.
 * It executes the log-in.
 */
const logIn = async (credentials) => {
    return await fetch(SERVER_URL + '/sessions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',  // this parameter specifies that authentication cookie must be forwared. It is included in all the authenticated APIs.
        body: JSON.stringify(credentials),
    }).then(handleInvalidResponse)
    .then(response => response.json());
};

/**
 * This function is used to verify if the user is still logged-in.
 * It returns a JSON object with the user info.
 */
const getUserInfo = async () => {
    return await fetch(SERVER_URL + '/sessions/current', {
        credentials: 'include'
    }).then(handleInvalidResponse)
    .then(response => response.json());
};

/**
 * This function destroy the current user's session (executing the log-out).
*/
const logOut = async() => {
    return await fetch(SERVER_URL + '/sessions/current', {
        method: 'DELETE',
        credentials: 'include'
    }).then(handleInvalidResponse);
}

function handleInvalidResponse(response) {
    if (!response.ok) { throw Error(response.statusText) }
    let type = response.headers.get('Content-Type');
    if (type !== null && type.indexOf('application/json') === -1){
        throw new TypeError(`Expected JSON, got ${type}`)
    }
    return response;
}

/* *** Update points (add or subtract) *** */
const updatePoints = async (userId, pointsToDeductOrAdd) => {
    try {
        const response = await fetch(SERVER_URL + `/updatePoints/${userId}`, {
            method: "PUT",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ pointsToDeductOrAdd })
        });
        
        if (response.ok) {  // 2xx family 
            const result = await response.json();
            return result;
        } else {
            // application error (403 Forbidden or 404 Not Found)
            throw new Error('Failed to update points');
        }
    } catch (error) {
        // network connection error
        console.log(error);
        throw error;
    }
};

/* *** Get user points *** */
const getUpdateUserPoints = async (userId) => {
    try {
        const response = await fetch(SERVER_URL + `/points/${userId}`, {
            method: 'GET',
            credentials: 'include'
        });

        if (response.ok) {
            const result = await response.json();
            return result;
        } else {
            // application error (response.status === 404 when user Not Found)
            throw new Error('Failed to get points');
        }
    } catch (error) {
        console.log(error);
        throw error;
    }
}


/* *** Get Ranking List (only logged-in user) *** */
const getRankingList = async () => {
    try {
        const response = await fetch(SERVER_URL + '/rankingList', {
            method: "GET",
            credentials: "include"
        });
        if(response.ok) {
            const rankingList = await response.json();
            return rankingList;
        }
        else
            throw new Error('Error in retrieving ranking list');
    } catch (error) {
        console.log(error);
        throw error;
    }
}

/* *** Add new bet *** */
const addBet = async (bet) => {
    try {
        const response = await fetch(`${SERVER_URL}/submitBet`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'}, 
            body: JSON.stringify({userId: bet.userId, timestamp: bet.timestamp, number1: bet.number1, 
                number2: bet.number2, number3: bet.number3, earnedPoints: bet.earnedPoints}),
            credentials: 'include'
        });
    
        if(!response.ok) {  // 2xx family (bet added)
            const errMessage = await response.json();
            throw errMessage;
        }
        else    // 403 error code (not enough points, already current bet)
            return null;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

/* *** Get current bet *** */
const getCurrentBet = async (userId) => {
    try {
        const response = await fetch(`${SERVER_URL}/currentBet/${userId}`, {
            method: 'GET',
            credentials: 'include'
        })

        if(!response.ok) {
            const errMessage = await response.json();
            throw errMessage;
        } else {
            const bet = await response.json(); 
            return bet;
        }
    } catch (error) {
        console.log(error);
        throw error;
    }
}

/* *** Get next draw time *** */
const nextDrawTime = async () => {
    try {
        const response = await fetch(`${SERVER_URL}/nextDrawTime`, {
            method: 'GET',
            credentials: 'include'
        });
        if(response.ok) {
            const result = await response.json(); 
            return result.time;
        } else
            throw new Error('Error obtaining next draw time');
    } catch (error) {
        console.log(error);
        throw error;
    }
}

/* *** Get last draw *** */
const getLastDraw = async () => {
    try {
        const response = await fetch(`${SERVER_URL}/lastDraw`, {
            method: 'GET',
            credentials: 'include'
        });
        if(response.ok) {
            const result = await response.json();
            return result;
        } else
            throw new Error('Error obtaining last draw');
    } catch (error) {
        console.log(error);
        throw error;
    }
}

/* *** Get earned points *** */
const getEarnedPoints = async (userId, drawId) => {
    try {
        const response = await fetch(`${SERVER_URL}/earnedPoints/${userId}/${drawId}`, {
            method: 'GET',
            credentials: 'include'
        });
        if(!response.ok) {  // not 2xx family
            const errMessage = await response.json();
            throw errMessage;
        } else {
            const points = await response.json(); 
            return points;
        }
    } catch (error) {
        console.log(error);
        throw error;
    }
}

const API = { addBet, logIn, getCurrentBet, getEarnedPoints, getUpdateUserPoints, getUserInfo, logOut, 
    getLastDraw, getRankingList, nextDrawTime, updatePoints };
export default API;