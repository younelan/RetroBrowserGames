class ScoreBoard {
  constructor(elementId) {
    this.element = document.getElementById(elementId);
    this.team1Score = 0;
    this.team2Score = 0;
    this.messages = [];
    this.updateDisplay();
  }
  
  addPointsToTeam1(points) {
    this.team1Score += points;
    this.updateDisplay();
    return this.team1Score;
  }
  
  addPointsToTeam2(points) {
    this.team2Score += points;
    this.updateDisplay();
    return this.team2Score;
  }
  
  resetScores() {
    this.team1Score = 0;
    this.team2Score = 0;
    this.updateDisplay();
  }
  
  showMessage(message, duration = 3000) {
    // Create message element
    const messageElement = document.createElement('div');
    messageElement.className = 'game-message';
    messageElement.textContent = message;
    
    // Add to DOM
    document.body.appendChild(messageElement);
    
    // Add to our messages list
    this.messages.push(messageElement);
    
    // Set timeout to remove
    setTimeout(() => {
      document.body.removeChild(messageElement);
      this.messages = this.messages.filter(m => m !== messageElement);
    }, duration);
  }
  
  updateDisplay() {
    if (this.element) {
      this.element.textContent = `BLUE: ${this.team1Score} - RED: ${this.team2Score}`;
    }
  }
  
  getScores() {
    return {
      team1: this.team1Score,
      team2: this.team2Score
    };
  }
}
