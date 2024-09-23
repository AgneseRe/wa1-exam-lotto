/* Data Access Object (DAO) module for accessing users data */
import db from "./db.mjs";
import crypto from "crypto";

export default function UserDao() {

    /**
    * Retrieves a user by ID from the database.
    * 
    * @param {number} id - The unique identifier of the user to retrieve.
    * @returns {Promise<Object>} A promise that resolves with the user data if found, or an error object if the user is not found or an error occurs.
    */
    this.getUserById = (id) => {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM User WHERE id = ?';
            db.get(sql, [id], (err, row) => {
                if (err) {
                    reject(err);
                }
                if (row === undefined) {
                    resolve({error: 'User not found.'});
                } else {
                    resolve(row);
                }
            });
        });
    };

    /**
    * Retrieves a user by email and verifies password.
    * 
    * This function first looks up a user by email. If found, it compares the provided password with the stored hashed password.
    * If the credentials match, it resolves with the user object. If not, or if an error occurs, it resolves with `false` or rejects with the error.
    * 
    * @param {string} email - The email address of the user to retrieve.
    * @param {string} password - The plain-text password to verify.
    * @returns {Promise<Object|boolean>} A promise that resolves with the user object if the credentials are correct, or `false` if the credentials 
    *   are incorrect or the user is not found. The promise will be rejected with an error if there is an issue during the database query or password hashing.
    */
    this.getUserByCredentials = (email, password) => {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM User WHERE email = ?';
            db.get(sql, [email], (err, row) => {
                if (err) {
                    reject(err);
                } else if (row === undefined) {
                    resolve(false);
                } else {
                    const user = { id: row.id, username: row.email, name: row.name, points: row.points };

                    // Check the hashes with an async call, this operation may be CPU-intensive (and we don't want to block the server)
                    crypto.scrypt(password, row.salt, 32, function (err, hashedPassword) {
                        if (err) reject(err);
                        if (!crypto.timingSafeEqual(Buffer.from(row.password, 'hex'), hashedPassword))
                            resolve(false); // password is not correct -> return false
                        else
                            resolve(user);  // username and password are both correct -> return the user object
                    });
                }
            });
        });
    }

    /**
    * Retrieves the current points of a user by ID from the database.
    * 
    * This function queries the database for the user's points using the unique ID. If the user is found, it resolves with the user's points.
    * If the user is not found or an error occurs, it resolves with an error object or rejects with the error.
    * 
    * @param {number} userId - The unique identifier of the user whose points are to be retrieved.
    * @returns {Promise<number|Object>} A promise that resolves with the user's points if the user is found,
    *   or an error object if the user is not found. The promise will be rejected with an error if there is an issue during the database query.
    */
    this.getUpdateUserPoints = (userId) => {
        return new Promise((resolve, reject) => {
            const sql = "SELECT points FROM User WHERE id = ?";
            db.get(sql, [userId], (err, row) => {
                if (err)
                    reject(err);
                else if (row === undefined) 
                    resolve({error: 'User not found.'});
                else
                    resolve(row.points);
            });
        })
    }
    
    /**
    * Updates user's points by subtracting the `pointsToDeductOrAdd` value from the total points.
    *
    * @param {number} userId - The ID of the user whose points will be updated.
    * @param {number} pointsToDeductOrAdd - The number of points to subtract.
    * @returns {Promise<number>} - Returns a Promise that resolves with the number of rows updated in the database.
    * @throws {Error} - The Promise is rejected if an error occurs during the database update.
    */
    this.updatePoints = (userId, pointsToDeductOrAdd) => {
        return new Promise((resolve, reject) => {
            const sql = "SELECT * FROM User WHERE id = ?";
            db.get(sql, [userId], (err, row) => {
                if (err)
                    reject(err);
                else if (row === undefined)
                    resolve({error: 'User not found.'});
                else {  // Available user
                    const sql = "UPDATE User SET points = points - ? WHERE id = ?";
                    db.run(sql, [pointsToDeductOrAdd, userId], function (err) {
                        if (err)
                            reject(err);
                        else
                            resolve(this.changes);
                    })
                }
            })
        })
    }
}