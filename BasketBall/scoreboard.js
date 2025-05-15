class ScoreBoard {
  constructor(elementId) {
    this.element = document.getElementById(elementId);
    this.team1Score = 0;
    this.team2Score = 0;
    this.messages = [];
    this.gameTime = {
      minutes: 12,
      seconds: 0
    };
    this.shotClock = 24;
    this.quarter = 1;
    
    // Create the basketball scoreboard UI
    this.createScoreboardUI();
    
    // Initialize the display
    this.updateDisplay();
  }
  
  createScoreboardUI() {
    // Clear any existing content
    this.element.innerHTML = '';
    
    // Set scoreboard style
    this.element.className = 'basketball-scoreboard';
    
    // Create HTML structure for scoreboard with updated team section styling
    this.element.innerHTML = `
      <div class="scoreboard-container">
        <div class="team-section team-section-left">
          <div class="team-name">BLUE</div>
          <div class="team-score" id="team1-score">00</div>
          <div class="team-fouls">FOULS: 0</div>
        </div>
        
        <div class="center-section">
          <div class="game-clock" id="game-clock">12:00</div>
          <div class="period-display">QTR: <span id="period">1</span></div>
          <div class="shot-clock" id="shot-clock">24</div>
        </div>
        
        <div class="team-section team-section-right">
          <div class="team-name">RED</div>
          <div class="team-score" id="team2-score">00</div>
          <div class="team-fouls">FOULS: 0</div>
        </div>
      </div>
      
      <div id="message-container" class="message-container"></div>
    `;
    
    // Store references to elements we'll update frequently
    this.team1ScoreElement = document.getElementById('team1-score');
    this.team2ScoreElement = document.getElementById('team2-score');
    this.gameClockElement = document.getElementById('game-clock');
    this.periodElement = document.getElementById('period');
    this.shotClockElement = document.getElementById('shot-clock');
    this.messageContainer = document.getElementById('message-container');
  }
  
  addPointsToTeam1(points) {
    this.team1Score += points;
    
    // Add animation class
    this.team1ScoreElement.classList.add('score-change');
    
    // Remove animation class after animation completes
    setTimeout(() => {
      this.team1ScoreElement.classList.remove('score-change');
    }, 1000);
    
    this.updateDisplay();
    return this.team1Score;
  }
  
  addPointsToTeam2(points) {
    this.team2Score += points;
    
    // Add animation class
    this.team2ScoreElement.classList.add('score-change');
    
    // Remove animation class after animation completes
    setTimeout(() => {
      this.team2ScoreElement.classList.remove('score-change');
    }, 1000);
    
    this.updateDisplay();
    return this.team2Score;
  }
  
  resetScores() {
    this.team1Score = 0;
    this.team2Score = 0;
    this.updateDisplay();
  }
  
  updateGameClock(minutes, seconds) {
    this.gameTime.minutes = minutes;
    this.gameTime.seconds = seconds;
    this.updateDisplay();
  }
  
  updateShotClock(seconds) {
    this.shotClock = seconds;
    this.updateDisplay();
  }
  
  updateQuarter(quarter) {
    this.quarter = quarter;
    this.updateDisplay();
  }
  
  showMessage(message, duration = 3000) {
    // Create message element with basketball style
    const messageElement = document.createElement('div');
    messageElement.className = 'basketball-message';
    
    // For special messages like scoring, add special class
    if (message.includes('scored')) {
      messageElement.classList.add('scoring-message');
      
      // Extract team and points
      const team = message.includes('BLUE') ? 'BLUE' : 'RED';
      const points = message.includes('3 points') ? 3 : 2;
      
      // Create enhanced message with visual effects and team-colored text
      messageElement.innerHTML = `
        <div class="message-team ${team.toLowerCase()}-team">${team}</div>
        <div class="message-scores">SCORES!</div>
        <div class="message-points">${points} PTS</div>
      `;
    } else if (message.includes('controlling')) {
      // For player control messages
      messageElement.classList.add('control-message');
      messageElement.textContent = message;
    } else {
      // Regular messages
      messageElement.textContent = message;
    }
    
    // Add to DOM
    this.messageContainer.appendChild(messageElement);
    
    // Add to our messages list
    this.messages.push(messageElement);
    
    // Set timeout to remove
    setTimeout(() => {
      messageElement.classList.add('fade-out');
      
      // Remove after fade animation completes
      setTimeout(() => {
        if (this.messageContainer.contains(messageElement)) {
          this.messageContainer.removeChild(messageElement);
        }
        this.messages = this.messages.filter(m => m !== messageElement);
      }, 500);
    }, duration);
  }
  
  updateDisplay() {
    // Update scores with leading zeros for single-digit scores
    this.team1ScoreElement.textContent = this.team1Score.toString().padStart(2, '0');
    this.team2ScoreElement.textContent = this.team2Score.toString().padStart(2, '0');
    
    // Update game clock with proper formatting
    const minutesStr = this.gameTime.minutes.toString().padStart(2, '0');
    const secondsStr = this.gameTime.seconds.toString().padStart(2, '0');
    this.gameClockElement.textContent = `${minutesStr}:${secondsStr}`;
    
    // Update period (quarter)
    this.periodElement.textContent = this.quarter;
    
    // Update shot clock
    this.shotClockElement.textContent = this.shotClock;
  }
  
  getScores() {
    return {
      team1: this.team1Score,
      team2: this.team2Score
    };
  }
}
