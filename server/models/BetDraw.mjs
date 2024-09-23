function Bet(userId, drawId, timestamp, number1, number2 = null, number3 = null, earnedPoints = null) {
    this.userId = userId;
    this.drawId = drawId;
    this.timestamp = timestamp;
    this.number1 = number1;
    this.number2 = number2;
    this.number3 = number3;
    this.earnedPoints = earnedPoints;
}

function Draw(id, timestamp, number1, number2, number3, number4, number5) {
    this.id = id;
    this.timestamp = timestamp;
    this.number1 = number1;
    this.number2 = number2;
    this.number3 = number3;
    this.number4 = number4;
    this.number5 = number5;
}

export { Bet, Draw };