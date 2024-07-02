// const { Phaser } = require("./phaser.min");

var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 330 },
            debug: false
        }
    },
    scene: {
        key: 'mainScene', // Nombre de la escena
        preload: preload,
        create: create,
        update: update
    }
};

var score = 0;
var scoreText;
var gameOver = false;
var restartKey; // Reiniciar juego
var pauseKey;

var game = new Phaser.Game(config);

// Carga las imagenes
function preload() {
    this.load.image('sky', 'assets/sky.png');
    this.load.image('ground', 'assets/platform.png');
    this.load.image('star', 'assets/star.png');
    this.load.image('bomb', 'assets/bomb.png');
    this.load.spritesheet('dude', 'assets/dude.png', { frameWidth: 184, frameHeight: 268 });
}

// Variables para llamar a las funciones
var platforms;
var player;
var cursors;
var stars;
var bombs;
var isPaused = false; 

// Funcion para desplegar objetos
function create() {
    var background = this.add.image(0, 0, 'sky').setOrigin(0, 0);
    background.setDisplaySize(config.width, config.height);

    // Ubicacion de plataformas en el canvas
    platforms = this.physics.add.staticGroup();
    platforms.create(400, 568, 'ground').setScale(2).refreshBody();
    platforms.create(600, 400, 'ground');
    platforms.create(50, 250, 'ground');
    platforms.create(750, 220, 'ground');

    // Personaje
    player = this.physics.add.sprite(100, 350, 'dude');
    player.setScale(0.4); // Reducir tamaño original
    player.setCollideWorldBounds(true);
    player.setBounce(0.3);

    // Cargar sprites del personaje
    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
        frameRate: 7,
        repeat: -1
    });

    this.anims.create({
        key: 'turn',
        frames: [{ key: 'dude', frame: 4 }],
        frameRate: 20,
    });

    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
        frameRate: 7,
        repeat: -1
    });

    // Colision entre el personaje y las plataformas
    this.physics.add.collider(player, platforms);

    // Reiniciar y pausar juego aplastando tecla enter y space
    cursors = this.input.keyboard.createCursorKeys();
    restartKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // desplegar estrellas
    stars = this.physics.add.group({
        key: 'star',
        repeat: 11,
        setXY: { x: 12, y: 0, stepX: 70 }
    });

    stars.children.iterate(function (child) {
        child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
        child.setScale(0.5); // Reducir tamaño de las estrellas
    });

    this.physics.add.collider(stars, platforms);
    this.physics.add.overlap(player, stars, collectStar, null, this);

    scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#000' });

    bombs = this.physics.add.group();
    this.physics.add.collider(bombs, platforms);
    this.physics.add.collider(player, bombs, hitBomb, null, this);
}

function update() {
    if (gameOver) {
        if (Phaser.Input.Keyboard.JustDown(restartKey)) {
            this.scene.restart();
            gameOver = false;
            score = 0;
        }
        return;
    }

    if (Phaser.Input.Keyboard.JustDown(pauseKey)) {
        console.log("Space key pressed");
        if (isPaused) {
            isPaused = false;
            this.physics.resume(); // Reanudar física
            this.anims.resumeAll(); // Reanudar todas las animaciones
        } else {
            isPaused = true;
            this.physics.pause(); // Pausar física
            this.anims.pauseAll(); // Pausar todas las animaciones
        }
    }
    

    if (isPaused) {
        return; // Si el juego está pausado, no ejecutar más lógica de actualización
    }

    // Movimientos del personaje
    if (cursors.left.isDown) {
        player.setVelocityX(-160);
        player.anims.play('left', true);
    } else if (cursors.right.isDown) {
        player.setVelocityX(160);
        player.anims.play('right', true);
    } else {
        player.setVelocityX(0);
        player.anims.play('turn');
    }

    if (cursors.up.isDown && player.body.touching.down) {
        player.setVelocityY(-350);
    }
}

function collectStar(player, star) {
    star.disableBody(true, true);

    score += 10;
    scoreText.setText('Score: ' + score);

    if (stars.countActive(true) === 0) {
        stars.children.iterate(function (child) {
            child.enableBody(true, child.x, 0, true, true);
        });

        var x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);
        var bomb = bombs.create(x, 16, 'bomb');
        bomb.setBounce(1);
        bomb.setCollideWorldBounds(true);
        bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
    }
}

function hitBomb(player, bomb) {
    this.physics.pause();
    player.setTint(0xff0000);
    player.anims.play('turn');
    gameOver = true;
}
