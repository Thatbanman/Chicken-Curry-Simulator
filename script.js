// Game Canvas and Context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game State
let gameState = 'start'; // 'start', 'playing', 'gameOver', 'victory'
let currentLevel = 1;
let gameStarted = false;

// Players
class Player {
    constructor(x, y, color, controls) {
        this.x = x;
        this.y = y;
        this.width = 24;
        this.height = 32;
        this.color = color;
        this.health = 100;
        this.maxHealth = 100;
        this.speed = 3;
        this.score = 0;
        this.controls = controls;
        this.attacking = false;
        this.attackCooldown = 0;
        this.facingDirection = 1; // 1 for right, -1 for left
        this.invulnerable = 0;
    }

    update() {
        if (this.attackCooldown > 0) this.attackCooldown--;
        if (this.invulnerable > 0) this.invulnerable--;
        
        // Handle movement
        if (keys[this.controls.up] && this.y > 0) {
            this.y -= this.speed;
        }
        if (keys[this.controls.down] && this.y < canvas.height - this.height) {
            this.y += this.speed;
        }
        if (keys[this.controls.left] && this.x > 0) {
            this.x -= this.speed;
            this.facingDirection = -1;
        }
        if (keys[this.controls.right] && this.x < canvas.width - this.width) {
            this.x += this.speed;
            this.facingDirection = 1;
        }

        // Handle attack
        if (keys[this.controls.attack] && this.attackCooldown === 0) {
            this.attack();
            this.attacking = true;
            this.attackCooldown = 20;
            setTimeout(() => { this.attacking = false; }, 200);
        }
    }

    attack() {
        const attackRange = 40;
        const attackDamage = 25;

        // Check collision with monsters
        monsters.forEach((monster, index) => {
            const dx = monster.x - this.x;
            const dy = monster.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < attackRange) {
                monster.takeDamage(attackDamage);
                if (monster.health <= 0) {
                    this.score += monster.scoreValue;
                    monsters.splice(index, 1);
                }
            }
        });

        // Check collision with boss
        if (currentBoss && !currentBoss.dead) {
            const dx = currentBoss.x - this.x;
            const dy = currentBoss.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < attackRange + currentBoss.width / 2) {
                currentBoss.takeDamage(attackDamage);
            }
        }
    }

    takeDamage(damage) {
        if (this.invulnerable === 0) {
            this.health -= damage;
            this.invulnerable = 60; // 1 second of invulnerability
            if (this.health <= 0) {
                this.health = 0;
                checkGameOver();
            }
        }
    }

    draw() {
        ctx.save();
        
        // Flash when invulnerable
        if (this.invulnerable > 0 && Math.floor(this.invulnerable / 5) % 2) {
            ctx.globalAlpha = 0.5;
        }

        // Draw player (simple pixel character)
        ctx.fillStyle = this.color;
        
        // Body
        ctx.fillRect(this.x + 6, this.y + 8, 12, 20);
        
        // Head
        ctx.fillStyle = '#ffdbac';
        ctx.fillRect(this.x + 8, this.y, 8, 8);
        
        // Arms
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x + 2, this.y + 10, 4, 12);
        ctx.fillRect(this.x + 18, this.y + 10, 4, 12);
        
        // Legs
        ctx.fillRect(this.x + 6, this.y + 28, 5, 8);
        ctx.fillRect(this.x + 13, this.y + 28, 5, 8);
        
        // Weapon when attacking
        if (this.attacking) {
            ctx.fillStyle = '#silver';
            if (this.facingDirection === 1) {
                ctx.fillRect(this.x + 22, this.y + 8, 8, 3);
            } else {
                ctx.fillRect(this.x - 6, this.y + 8, 8, 3);
            }
        }

        ctx.restore();
    }
}

// Monster Classes
class Monster {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.health = this.getHealthByType();
        this.maxHealth = this.health;
        this.speed = this.getSpeedByType();
        this.scoreValue = this.getScoreByType();
        this.width = 20;
        this.height = 20;
        this.attackCooldown = 0;
        this.direction = Math.random() * Math.PI * 2;
        this.changeDirectionTimer = 0;
    }

    getHealthByType() {
        const healthMap = {
            skeleton: 30,
            zombie: 40,
            bug: 15,
            bat: 20
        };
        return healthMap[this.type] || 25;
    }

    getSpeedByType() {
        const speedMap = {
            skeleton: 1,
            zombie: 0.8,
            bug: 2,
            bat: 1.5
        };
        return speedMap[this.type] || 1;
    }

    getScoreByType() {
        const scoreMap = {
            skeleton: 15,
            zombie: 20,
            bug: 10,
            bat: 12
        };
        return scoreMap[this.type] || 10;
    }

    update() {
        if (this.attackCooldown > 0) this.attackCooldown--;
        this.changeDirectionTimer++;

        // Find closest player
        let closestPlayer = null;
        let closestDistance = Infinity;

        [player1, player2].forEach(player => {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestPlayer = player;
            }
        });

        if (closestPlayer) {
            // Move towards closest player
            const dx = closestPlayer.x - this.x;
            const dy = closestPlayer.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 0) {
                this.x += (dx / distance) * this.speed;
                this.y += (dy / distance) * this.speed;
            }

            // Attack if close enough
            if (distance < 30 && this.attackCooldown === 0) {
                closestPlayer.takeDamage(10);
                this.attackCooldown = 120; // 2 seconds
            }
        }

        // Keep monster on screen
        this.x = Math.max(0, Math.min(canvas.width - this.width, this.x));
        this.y = Math.max(0, Math.min(canvas.height - this.height, this.y));
    }

    takeDamage(damage) {
        this.health -= damage;
    }

    draw() {
        // Draw monster based on type
        ctx.save();
        
        // Health bar
        if (this.health < this.maxHealth) {
            ctx.fillStyle = 'red';
            ctx.fillRect(this.x, this.y - 8, this.width, 3);
            ctx.fillStyle = 'green';
            ctx.fillRect(this.x, this.y - 8, this.width * (this.health / this.maxHealth), 3);
        }

        switch (this.type) {
            case 'skeleton':
                this.drawSkeleton();
                break;
            case 'zombie':
                this.drawZombie();
                break;
            case 'bug':
                this.drawBug();
                break;
            case 'bat':
                this.drawBat();
                break;
        }

        ctx.restore();
    }

    drawSkeleton() {
        ctx.fillStyle = '#f0f0f0';
        // Head
        ctx.fillRect(this.x + 6, this.y, 8, 8);
        // Body
        ctx.fillRect(this.x + 8, this.y + 8, 4, 12);
        // Arms
        ctx.fillRect(this.x + 2, this.y + 10, 4, 8);
        ctx.fillRect(this.x + 14, this.y + 10, 4, 8);
        // Legs
        ctx.fillRect(this.x + 6, this.y + 16, 3, 8);
        ctx.fillRect(this.x + 11, this.y + 16, 3, 8);
    }

    drawZombie() {
        ctx.fillStyle = '#4a5d4a';
        // Head
        ctx.fillRect(this.x + 6, this.y, 8, 8);
        // Body
        ctx.fillRect(this.x + 6, this.y + 8, 8, 12);
        // Arms
        ctx.fillRect(this.x + 2, this.y + 10, 4, 10);
        ctx.fillRect(this.x + 14, this.y + 10, 4, 10);
        // Legs
        ctx.fillRect(this.x + 6, this.y + 16, 3, 8);
        ctx.fillRect(this.x + 11, this.y + 16, 3, 8);
    }

    drawBug() {
        ctx.fillStyle = '#4a2c2a';
        // Body
        ctx.fillRect(this.x + 4, this.y + 4, 12, 8);
        // Legs
        ctx.fillStyle = '#2a1a1a';
        for (let i = 0; i < 6; i++) {
            ctx.fillRect(this.x + 2 + i * 3, this.y + 6 + (i % 2) * 2, 2, 4);
        }
    }

    drawBat() {
        ctx.fillStyle = '#2a2a2a';
        // Body
        ctx.fillRect(this.x + 8, this.y + 6, 4, 8);
        // Wings
        ctx.fillRect(this.x + 2, this.y + 4, 6, 4);
        ctx.fillRect(this.x + 12, this.y + 4, 6, 4);
    }
}

// Boss Classes
class Boss {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.health = this.getHealthByType();
        this.maxHealth = this.health;
        this.width = this.getWidthByType();
        this.height = this.getHeightByType();
        this.attackCooldown = 0;
        this.dead = false;
        this.attackPattern = 0;
        this.attackTimer = 0;
        this.projectiles = [];
    }

    getHealthByType() {
        const healthMap = {
            pig: 200,
            skeleton: 300,
            octopus: 400
        };
        return healthMap[this.type] || 200;
    }

    getWidthByType() {
        const widthMap = {
            pig: 60,
            skeleton: 50,
            octopus: 80
        };
        return widthMap[this.type] || 60;
    }

    getHeightByType() {
        const heightMap = {
            pig: 50,
            skeleton: 60,
            octopus: 70
        };
        return heightMap[this.type] || 50;
    }

    update() {
        if (this.dead) return;

        this.attackTimer++;
        
        switch (this.type) {
            case 'pig':
                this.updatePigBoss();
                break;
            case 'skeleton':
                this.updateSkeletonBoss();
                break;
            case 'octopus':
                this.updateOctopusBoss();
                break;
        }

        // Update projectiles
        this.projectiles.forEach((projectile, index) => {
            projectile.x += projectile.vx;
            projectile.y += projectile.vy;

            // Check collision with players
            [player1, player2].forEach(player => {
                const dx = projectile.x - (player.x + player.width / 2);
                const dy = projectile.y - (player.y + player.height / 2);
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 15) {
                    player.takeDamage(projectile.damage);
                    this.projectiles.splice(index, 1);
                }
            });

            // Remove projectiles that are off screen
            if (projectile.x < 0 || projectile.x > canvas.width || 
                projectile.y < 0 || projectile.y > canvas.height) {
                this.projectiles.splice(index, 1);
            }
        });
    }

    updatePigBoss() {
        // Pig boss attacks every 3 seconds
        if (this.attackTimer % 180 === 0) {
            this.pigAttack();
        }
    }

    updateSkeletonBoss() {
        // Skeleton boss throws bombs every 2.5 seconds
        if (this.attackTimer % 150 === 0) {
            this.skeletonAttack();
        }
    }

    updateOctopusBoss() {
        // Octopus boss attacks with multiple arms
        if (this.attackTimer % 60 === 0) {
            this.octopusAttack();
        }
    }

    pigAttack() {
        // Spit attack - projectile towards closest player
        let closestPlayer = this.getClosestPlayer();
        if (closestPlayer) {
            const dx = closestPlayer.x - this.x;
            const dy = closestPlayer.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            this.projectiles.push({
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
                vx: (dx / distance) * 4,
                vy: (dy / distance) * 4,
                damage: 20,
                type: 'spit'
            });
        }
    }

    skeletonAttack() {
        // Bomb attack - throws bombs in arc
        let closestPlayer = this.getClosestPlayer();
        if (closestPlayer) {
            for (let i = 0; i < 3; i++) {
                const angle = -Math.PI / 4 + (i * Math.PI / 8);
                this.projectiles.push({
                    x: this.x + this.width / 2,
                    y: this.y + this.height / 2,
                    vx: Math.cos(angle) * 3,
                    vy: Math.sin(angle) * 3,
                    damage: 25,
                    type: 'bomb'
                });
            }
        }
    }

    octopusAttack() {
        // Multi-arm sword attack
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI * 2) / 8;
            this.projectiles.push({
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
                vx: Math.cos(angle) * 2,
                vy: Math.sin(angle) * 2,
                damage: 15,
                type: 'sword'
            });
        }
    }

    getClosestPlayer() {
        let closestPlayer = null;
        let closestDistance = Infinity;

        [player1, player2].forEach(player => {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestPlayer = player;
            }
        });

        return closestPlayer;
    }

    takeDamage(damage) {
        this.health -= damage;
        if (this.health <= 0) {
            this.dead = true;
            // Award points to both players
            player1.score += 100;
            player2.score += 100;
        }
    }

    draw() {
        if (this.dead) return;

        ctx.save();

        // Health bar
        const barWidth = this.width;
        const barHeight = 8;
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x, this.y - 15, barWidth, barHeight);
        ctx.fillStyle = 'green';
        ctx.fillRect(this.x, this.y - 15, barWidth * (this.health / this.maxHealth), barHeight);

        // Draw boss based on type
        switch (this.type) {
            case 'pig':
                this.drawPigBoss();
                break;
            case 'skeleton':
                this.drawSkeletonBoss();
                break;
            case 'octopus':
                this.drawOctopusBoss();
                break;
        }

        // Draw projectiles
        this.projectiles.forEach(projectile => {
            this.drawProjectile(projectile);
        });

        ctx.restore();
    }

    drawPigBoss() {
        // Giant pig with cleaver
        ctx.fillStyle = '#ffb3d9';
        // Body
        ctx.fillRect(this.x, this.y + 10, this.width, this.height - 10);
        // Head
        ctx.fillRect(this.x + 10, this.y, this.width - 20, 20);
        // Snout
        ctx.fillStyle = '#ff99cc';
        ctx.fillRect(this.x + 20, this.y + 5, 10, 8);
        // Cleaver
        ctx.fillStyle = '#c0c0c0';
        ctx.fillRect(this.x + this.width, this.y + 15, 15, 3);
        ctx.fillRect(this.x + this.width + 10, this.y + 10, 5, 15);
    }

    drawSkeletonBoss() {
        // Giant skeleton
        ctx.fillStyle = '#f0f0f0';
        // Head
        ctx.fillRect(this.x + 15, this.y, 20, 20);
        // Body
        ctx.fillRect(this.x + 20, this.y + 20, 10, 30);
        // Arms
        ctx.fillRect(this.x + 5, this.y + 25, 10, 20);
        ctx.fillRect(this.x + 35, this.y + 25, 10, 20);
        // Legs
        ctx.fillRect(this.x + 15, this.y + 50, 8, 15);
        ctx.fillRect(this.x + 27, this.y + 50, 8, 15);
    }

    drawOctopusBoss() {
        // Giant octopus with pirate hat
        ctx.fillStyle = '#8a2be2';
        // Body
        ctx.fillRect(this.x + 10, this.y + 15, this.width - 20, this.height - 15);
        // Tentacles
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI * 2) / 8;
            const tentacleX = this.x + this.width / 2 + Math.cos(angle) * 30;
            const tentacleY = this.y + this.height / 2 + Math.sin(angle) * 30;
            ctx.fillRect(tentacleX, tentacleY, 8, 20);
        }
        // Pirate hat
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x + 15, this.y, this.width - 30, 15);
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(this.x + 20, this.y + 2, 5, 5);
    }

    drawProjectile(projectile) {
        ctx.fillStyle = this.getProjectileColor(projectile.type);
        ctx.fillRect(projectile.x - 3, projectile.y - 3, 6, 6);
    }

    getProjectileColor(type) {
        const colorMap = {
            spit: '#90EE90',
            bomb: '#FF4500',
            sword: '#C0C0C0'
        };
        return colorMap[type] || '#ffffff';
    }
}

// Game Variables
let player1, player2;
let monsters = [];
let currentBoss = null;
let keys = {};
let monsterSpawnTimer = 0;
let levelTransitionTimer = 0;

// Initialize Players
function initializePlayers() {
    player1 = new Player(100, 300, '#00ff00', {
        up: 'KeyW',
        down: 'KeyS',
        left: 'KeyA',
        right: 'KeyD',
        attack: 'Space'
    });

    player2 = new Player(700, 300, '#ff6b6b', {
        up: 'ArrowUp',
        down: 'ArrowDown',
        left: 'ArrowLeft',
        right: 'ArrowRight',
        attack: 'Enter'
    });
}

// Spawn Monsters
function spawnMonster() {
    const types = ['skeleton', 'zombie', 'bug', 'bat'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    // Spawn at random edge
    let x, y;
    const edge = Math.floor(Math.random() * 4);
    
    switch (edge) {
        case 0: // Top
            x = Math.random() * canvas.width;
            y = 0;
            break;
        case 1: // Right
            x = canvas.width;
            y = Math.random() * canvas.height;
            break;
        case 2: // Bottom
            x = Math.random() * canvas.width;
            y = canvas.height;
            break;
        case 3: // Left
            x = 0;
            y = Math.random() * canvas.height;
            break;
    }
    
    monsters.push(new Monster(x, y, type));
}

// Spawn Boss
function spawnBoss() {
    const bossTypes = ['pig', 'skeleton', 'octopus'];
    const bossType = bossTypes[currentLevel - 2]; // Bosses start at level 2
    
    currentBoss = new Boss(canvas.width / 2 - 40, 100, bossType);
    
    // Update UI
    document.getElementById('gameMessage').textContent = `Boss Battle: ${bossType.charAt(0).toUpperCase() + bossType.slice(1)}!`;
    document.getElementById('gameMessage').classList.add('boss-warning');
}

// Update Game State
function updateGame() {
    if (gameState !== 'playing') return;

    // Update players
    player1.update();
    player2.update();

    // Update monsters
    monsters.forEach((monster, index) => {
        monster.update();
        if (monster.health <= 0) {
            monsters.splice(index, 1);
        }
    });

    // Update boss
    if (currentBoss) {
        currentBoss.update();
        if (currentBoss.dead) {
            currentBoss = null;
            currentLevel++;
            levelTransitionTimer = 180; // 3 seconds
            
            if (currentLevel > 4) {
                // Game completed!
                gameState = 'victory';
                showGameOver(true);
                return;
            }
        }
    }

    // Spawn monsters (not during boss fights)
    if (!currentBoss && levelTransitionTimer === 0) {
        monsterSpawnTimer++;
        const spawnRate = Math.max(60 - currentLevel * 10, 30); // Faster spawning each level
        
        if (monsterSpawnTimer >= spawnRate) {
            spawnMonster();
            monsterSpawnTimer = 0;
        }
    }

    // Handle level transitions
    if (levelTransitionTimer > 0) {
        levelTransitionTimer--;
        if (levelTransitionTimer === 0) {
            // Clear monsters
            monsters = [];
            
            // Spawn boss if it's a boss level
            if (currentLevel === 2 || currentLevel === 3 || currentLevel === 4) {
                spawnBoss();
            } else {
                document.getElementById('gameMessage').textContent = `Level ${currentLevel} - Fight the monsters!`;
                document.getElementById('gameMessage').classList.remove('boss-warning');
            }
        }
    }

    // Update UI
    updateUI();
}

// Update UI
function updateUI() {
    document.getElementById('player1HP').textContent = player1.health;
    document.getElementById('player1Health').style.width = (player1.health / player1.maxHealth * 100) + '%';
    document.getElementById('player1Score').textContent = player1.score;

    document.getElementById('player2HP').textContent = player2.health;
    document.getElementById('player2Health').style.width = (player2.health / player2.maxHealth * 100) + '%';
    document.getElementById('player2Score').textContent = player2.score;

    document.getElementById('gameLevel').textContent = `Level ${currentLevel}`;
}

// Check Game Over
function checkGameOver() {
    if (player1.health <= 0 && player2.health <= 0) {
        gameState = 'gameOver';
        showGameOver(false);
    }
}

// Show Game Over Screen
function showGameOver(victory) {
    const gameOverScreen = document.getElementById('gameOverScreen');
    const gameOverTitle = document.getElementById('gameOverTitle');
    const gameOverMessage = document.getElementById('gameOverMessage');
    
    if (victory) {
        gameOverTitle.textContent = 'Victory!';
        gameOverTitle.style.color = '#00ff00';
        gameOverMessage.textContent = `Congratulations! You defeated all the bosses! Final Scores - Player 1: ${player1.score}, Player 2: ${player2.score}`;
    } else {
        gameOverTitle.textContent = 'Game Over';
        gameOverTitle.style.color = '#ff6b6b';
        gameOverMessage.textContent = `You have been defeated! Final Scores - Player 1: ${player1.score}, Player 2: ${player2.score}`;
    }
    
    gameOverScreen.style.display = 'flex';
}

// Render Game
function render() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.7, '#228B22');
    gradient.addColorStop(1, '#8B4513');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'playing') {
        // Draw players
        player1.draw();
        player2.draw();

        // Draw monsters
        monsters.forEach(monster => {
            monster.draw();
        });

        // Draw boss
        if (currentBoss) {
            currentBoss.draw();
        }

        // Draw level transition overlay
        if (levelTransitionTimer > 0) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = '#ffd700';
            ctx.font = '36px Courier New';
            ctx.textAlign = 'center';
            
            if (currentLevel === 2 || currentLevel === 3 || currentLevel === 4) {
                ctx.fillText('BOSS APPROACHING!', canvas.width / 2, canvas.height / 2);
            } else {
                ctx.fillText(`LEVEL ${currentLevel}`, canvas.width / 2, canvas.height / 2);
            }
        }
    }
}

// Game Loop
function gameLoop() {
    updateGame();
    render();
    requestAnimationFrame(gameLoop);
}

// Event Listeners
document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
});

document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

document.getElementById('startButton').addEventListener('click', () => {
    document.getElementById('startScreen').style.display = 'none';
    gameState = 'playing';
    initializePlayers();
    gameStarted = true;
});

document.getElementById('restartButton').addEventListener('click', () => {
    // Reset game
    gameState = 'playing';
    currentLevel = 1;
    monsters = [];
    currentBoss = null;
    monsterSpawnTimer = 0;
    levelTransitionTimer = 0;
    
    initializePlayers();
    
    document.getElementById('gameOverScreen').style.display = 'none';
    document.getElementById('gameMessage').textContent = 'Fight the monsters!';
    document.getElementById('gameMessage').classList.remove('boss-warning');
});

// Start the game loop
gameLoop();
