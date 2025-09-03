class ChickenCurryGame {
    constructor() {
        this.score = 0;
        this.timeLeft = 300; // 5 minutes
        this.gameRunning = false;
        this.currentStep = 1;
        this.selectedIngredients = new Set();
        this.cookingProgress = 0;
        this.isCooking = false;
        this.hasStirred = false;
        this.hasTasted = false;
        this.cookingTimer = null;
        this.gameTimer = null;
        
        // Required ingredients for a good curry
        this.requiredIngredients = ['chicken', 'onions', 'tomatoes', 'garlic', 'ginger', 'curry-powder', 'coconut-milk', 'salt'];
        this.optionalIngredients = ['oil', 'cilantro'];
        
        this.initializeGame();
    }

    initializeGame() {
        this.setupEventListeners();
        this.updateDisplay();
        this.startGameTimer();
        this.addMessage("Welcome to Chicken Curry Simulator! Add ingredients to start cooking.", "success");
    }

    setupEventListeners() {
        // Ingredient selection
        document.querySelectorAll('.ingredient').forEach(ingredient => {
            ingredient.addEventListener('click', () => this.selectIngredient(ingredient));
        });

        // Cooking controls
        document.getElementById('start-cooking').addEventListener('click', () => this.startCooking());
        document.getElementById('add-spices').addEventListener('click', () => this.addSpices());
        document.getElementById('stir').addEventListener('click', () => this.stir());
        document.getElementById('taste').addEventListener('click', () => this.taste());
        document.getElementById('play-again').addEventListener('click', () => this.resetGame());
    }

    selectIngredient(ingredientElement) {
        if (ingredientElement.classList.contains('used') || this.isCooking) {
            return;
        }

        const ingredientName = ingredientElement.dataset.ingredient;
        
        if (this.selectedIngredients.has(ingredientName)) {
            // Deselect ingredient
            this.selectedIngredients.delete(ingredientName);
            ingredientElement.classList.remove('selected');
            this.removeIngredientFromPan(ingredientName);
            this.addMessage(`Removed ${ingredientName} from the pan.`, "warning");
        } else {
            // Select ingredient
            this.selectedIngredients.add(ingredientName);
            ingredientElement.classList.add('selected');
            this.addIngredientToPan(ingredientName);
            this.addMessage(`Added ${ingredientName} to the pan!`, "success");
            this.updateScore(10);
        }

        this.updateCookingControls();
        this.checkStepCompletion();
    }

    addIngredientToPan(ingredientName) {
        const panContents = document.getElementById('pan-contents');
        const emptyPan = panContents.querySelector('.empty-pan');
        
        if (emptyPan) {
            emptyPan.style.display = 'none';
        }

        const ingredientEmoji = this.getIngredientEmoji(ingredientName);
        const ingredientDiv = document.createElement('div');
        ingredientDiv.className = 'pan-ingredient';
        ingredientDiv.dataset.ingredient = ingredientName;
        ingredientDiv.textContent = ingredientEmoji;
        
        panContents.appendChild(ingredientDiv);
    }

    removeIngredientFromPan(ingredientName) {
        const panContents = document.getElementById('pan-contents');
        const ingredientDiv = panContents.querySelector(`[data-ingredient="${ingredientName}"]`);
        
        if (ingredientDiv) {
            ingredientDiv.remove();
        }

        if (panContents.children.length === 1) {
            const emptyPan = panContents.querySelector('.empty-pan');
            if (emptyPan) {
                emptyPan.style.display = 'block';
            }
        }
    }

    getIngredientEmoji(ingredientName) {
        const emojis = {
            'chicken': '🐔',
            'onions': '🧅',
            'tomatoes': '🍅',
            'garlic': '🧄',
            'ginger': '🫚',
            'curry-powder': '🌶️',
            'coconut-milk': '🥥',
            'salt': '🧂',
            'oil': '🫒',
            'cilantro': '🌿'
        };
        return emojis[ingredientName] || '🥘';
    }

    updateCookingControls() {
        const hasBasicIngredients = ['chicken', 'onions'].every(ing => this.selectedIngredients.has(ing));
        const startCookingBtn = document.getElementById('start-cooking');
        
        startCookingBtn.disabled = !hasBasicIngredients || this.isCooking;
        
        document.getElementById('add-spices').disabled = !this.isCooking || this.cookingProgress < 30;
        document.getElementById('stir').disabled = !this.isCooking || this.cookingProgress < 50;
        document.getElementById('taste').disabled = !this.isCooking || this.cookingProgress < 80;
    }

    startCooking() {
        if (this.isCooking) return;

        this.isCooking = true;
        this.cookingProgress = 0;
        this.addMessage("Started cooking! The chicken is browning...", "success");
        this.updateScore(20);
        
        // Mark ingredients as used
        document.querySelectorAll('.ingredient.selected').forEach(ing => {
            ing.classList.add('used');
            ing.classList.remove('selected');
        });

        // Start cooking animation
        document.getElementById('cooking-pan').classList.add('pan-cooking');
        
        this.cookingTimer = setInterval(() => {
            this.cookingProgress += 2;
            this.updateCookingProgress();
            
            if (this.cookingProgress >= 100) {
                this.finishCooking();
            }
        }, 200);

        this.updateCookingControls();
        this.completeStep(2);
    }

    addSpices() {
        if (!this.selectedIngredients.has('curry-powder')) {
            this.addMessage("You need curry powder to add spices!", "error");
            return;
        }

        this.addMessage("Added spices! The aroma is amazing! 🌶️", "success");
        this.updateScore(15);
        this.cookingProgress += 10;
        this.updateCookingProgress();
        this.completeStep(3);
        this.updateCookingControls();
    }

    stir() {
        if (this.hasStirred) {
            this.addMessage("You already stirred the curry!", "warning");
            return;
        }

        this.hasStirred = true;
        this.addMessage("Stirred the curry! Everything is mixing well! 🥄", "success");
        this.updateScore(10);
        
        // Add stirring animation
        const pan = document.getElementById('cooking-pan');
        pan.classList.add('stirring');
        setTimeout(() => pan.classList.remove('stirring'), 1000);
        
        this.cookingProgress += 5;
        this.updateCookingProgress();
        this.updateCookingControls();
    }

    taste() {
        if (this.hasTasted) {
            this.addMessage("You already tasted the curry!", "warning");
            return;
        }

        this.hasTasted = true;
        const hasCoconutMilk = this.selectedIngredients.has('coconut-milk');
        const hasSalt = this.selectedIngredients.has('salt');
        
        let message = "Mmm, tasty! ";
        let scoreBonus = 10;
        
        if (hasCoconutMilk && hasSalt) {
            message += "Perfect balance of flavors! 👨‍🍳";
            scoreBonus = 25;
        } else if (hasCoconutMilk) {
            message += "Creamy but needs salt.";
            scoreBonus = 15;
        } else if (hasSalt) {
            message += "Well seasoned but could use coconut milk.";
            scoreBonus = 15;
        } else {
            message += "Needs more seasoning!";
            scoreBonus = 5;
        }

        this.addMessage(message, "success");
        this.updateScore(scoreBonus);
        this.completeStep(5);
        this.updateCookingControls();
    }

    updateCookingProgress() {
        const progressFill = document.getElementById('cooking-progress');
        const status = document.getElementById('cooking-status');
        
        progressFill.style.width = `${this.cookingProgress}%`;
        
        if (this.cookingProgress < 30) {
            status.textContent = "Browning the chicken...";
        } else if (this.cookingProgress < 60) {
            status.textContent = "Building flavors...";
        } else if (this.cookingProgress < 90) {
            status.textContent = "Simmering the curry...";
        } else {
            status.textContent = "Almost ready!";
        }
    }

    finishCooking() {
        clearInterval(this.cookingTimer);
        this.isCooking = false;
        document.getElementById('cooking-pan').classList.remove('pan-cooking');
        
        this.calculateFinalScore();
        this.endGame();
    }

    calculateFinalScore() {
        // Bonus for having all required ingredients
        const requiredCount = this.requiredIngredients.filter(ing => this.selectedIngredients.has(ing)).length;
        const requiredBonus = (requiredCount / this.requiredIngredients.length) * 100;
        
        // Bonus for optional ingredients
        const optionalCount = this.optionalIngredients.filter(ing => this.selectedIngredients.has(ing)).length;
        const optionalBonus = optionalCount * 20;
        
        // Time bonus
        const timeBonus = Math.max(0, this.timeLeft * 0.5);
        
        // Technique bonus
        let techniqueBonus = 0;
        if (this.hasStirred) techniqueBonus += 20;
        if (this.hasTasted) techniqueBonus += 20;
        
        const totalBonus = requiredBonus + optionalBonus + timeBonus + techniqueBonus;
        this.updateScore(Math.round(totalBonus));
        
        this.addMessage(`Cooking complete! Bonus points: ${Math.round(totalBonus)}`, "success");
    }

    checkStepCompletion() {
        // Step 1: Add basic ingredients
        if (this.currentStep === 1 && ['chicken', 'onions', 'tomatoes', 'garlic'].every(ing => this.selectedIngredients.has(ing))) {
            this.completeStep(1);
        }
        
        // Step 4: Add coconut milk
        if (this.isCooking && this.selectedIngredients.has('coconut-milk') && this.cookingProgress >= 60) {
            this.completeStep(4);
        }
    }

    completeStep(stepNumber) {
        if (stepNumber <= this.currentStep) {
            this.currentStep = Math.max(this.currentStep, stepNumber + 1);
            
            const stepElement = document.querySelector(`[data-step="${stepNumber}"]`);
            if (stepElement) {
                stepElement.classList.add('completed');
                stepElement.querySelector('.step-status').textContent = '✅';
            }
            
            // Activate next step
            const nextStep = document.querySelector(`[data-step="${stepNumber + 1}"]`);
            if (nextStep) {
                nextStep.classList.add('active');
            }
            
            this.updateScore(25);
        }
    }

    updateScore(points) {
        this.score += points;
        document.getElementById('score').textContent = this.score;
    }

    startGameTimer() {
        this.gameTimer = setInterval(() => {
            this.timeLeft--;
            document.getElementById('timer').textContent = this.timeLeft;
            
            if (this.timeLeft <= 0) {
                this.endGame();
            } else if (this.timeLeft <= 60) {
                document.getElementById('timer').style.color = '#e74c3c';
            }
        }, 1000);
    }

    addMessage(text, type = 'info') {
        const messagesContainer = document.getElementById('messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = text;
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // Remove old messages if too many
        const messages = messagesContainer.children;
        if (messages.length > 5) {
            messagesContainer.removeChild(messages[0]);
        }
    }

    endGame() {
        clearInterval(this.gameTimer);
        if (this.cookingTimer) {
            clearInterval(this.cookingTimer);
        }
        
        this.gameRunning = false;
        
        const gameOverScreen = document.getElementById('game-over-screen');
        const gameOverTitle = document.getElementById('game-over-title');
        const gameOverMessage = document.getElementById('game-over-message');
        const finalScore = document.getElementById('final-score');
        
        finalScore.textContent = this.score;
        
        if (this.timeLeft <= 0) {
            gameOverTitle.textContent = "Time's Up!";
            gameOverMessage.textContent = "Your curry cooking time has expired!";
        } else {
            gameOverTitle.textContent = "Curry Complete!";
            
            if (this.score >= 300) {
                gameOverMessage.textContent = "🌟 Master Chef! Your curry is absolutely perfect!";
            } else if (this.score >= 200) {
                gameOverMessage.textContent = "👨‍🍳 Great job! Your curry is delicious!";
            } else if (this.score >= 100) {
                gameOverMessage.textContent = "😊 Not bad! Your curry is edible!";
            } else {
                gameOverMessage.textContent = "🤔 Keep practicing! Your curry needs work.";
            }
        }
        
        gameOverScreen.style.display = 'flex';
    }

    resetGame() {
        // Reset all game state
        this.score = 0;
        this.timeLeft = 300;
        this.gameRunning = false;
        this.currentStep = 1;
        this.selectedIngredients.clear();
        this.cookingProgress = 0;
        this.isCooking = false;
        this.hasStirred = false;
        this.hasTasted = false;
        
        // Clear timers
        if (this.cookingTimer) {
            clearInterval(this.cookingTimer);
            this.cookingTimer = null;
        }
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }
        
        // Reset UI
        document.getElementById('score').textContent = '0';
        document.getElementById('timer').textContent = '300';
        document.getElementById('timer').style.color = '#2c3e50';
        document.getElementById('game-over-screen').style.display = 'none';
        document.getElementById('messages').innerHTML = '';
        
        // Reset ingredients
        document.querySelectorAll('.ingredient').forEach(ing => {
            ing.classList.remove('selected', 'used');
        });
        
        // Reset pan
        const panContents = document.getElementById('pan-contents');
        panContents.innerHTML = '<div class="empty-pan">Click ingredients to add them!</div>';
        
        // Reset cooking area
        document.getElementById('cooking-progress').style.width = '0%';
        document.getElementById('cooking-status').textContent = 'Add ingredients to start cooking!';
        document.getElementById('cooking-pan').classList.remove('pan-cooking', 'stirring');
        
        // Reset recipe steps
        document.querySelectorAll('.step').forEach(step => {
            step.classList.remove('active', 'completed');
            step.querySelector('.step-status').textContent = '⏳';
        });
        document.querySelector('[data-step="1"]').classList.add('active');
        
        // Reset buttons
        this.updateCookingControls();
        
        // Restart game
        this.startGameTimer();
        this.addMessage("New game started! Let's cook another delicious curry!", "success");
    }

    updateDisplay() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('timer').textContent = this.timeLeft;
    }
}

// Start the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ChickenCurryGame();
});
