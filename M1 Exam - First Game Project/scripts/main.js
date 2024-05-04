//initialize the whole thing
var config = {
    type: Phaser.AUTO,
    width: 1470,
    height: 720,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var game = new Phaser.Game(config);

var score = 0;
var scoreText;

//for ROYGBIV color cycling
var playerColors = [0xff0000, 0xFF6E00, 0xFFFF00, 0x00ff00, 0x0000ff, 0x7800FF, 0x9B26B6];
var currentColorIndex = 0;

//for ease of modification to ramp up
var playerVelocity = 160;

function preload ()
{
    //old screen filter
    this.load.image('binaryBG','./assets/images/binarybg.png');
    //platforms
    this.load.image('codePrime', './assets/images/codePrime.png');
    this.load.image('code1', './assets/images/code1.png');
    this.load.image('code2', './assets/images/code2.png');
    this.load.image('code3', './assets/images/code3.png');
    this.load.image('code4', './assets/images/code4.png');
    this.load.image('code5', './assets/images/code5.png');
    this.load.image('code6', './assets/images/code6.png');
    this.load.image('code7', './assets/images/code7.png');
    //file (STAR)
    this.load.image('file', './assets/images/file.png');
    //virus (BOMB)
    this.load.image('virus', './assets/images/virus.png');
    // player
    this.load.spritesheet('extie',              //(8) the player entity is using a SPRITESHEET
        './assets/images/extie.png',
        { frameWidth: 32, frameHeight: 48 }
    );
}

function create ()
{
    //platforms
    platforms = this.physics.add.staticGroup();
    platforms.create(700, 740, 'codePrime').setScale(4).refreshBody();
    platforms.create(700, 680, 'codePrime').setScale(4).refreshBody();      //second base platform to allow jumping back up
    platforms.create(620, 330, 'code3').setScale(0.8).refreshBody();
    platforms.create(85, 250, 'code5').setScale(0.5,1.5).refreshBody();
    platforms.create(150, 500, 'code2').setScale(0.5,3).refreshBody();
    platforms.create(740, 490, 'code4').setScale(0.5,1.1).refreshBody();
    platforms.create(680, 172, 'code1');
    platforms.create(1200, 460, 'code7');
    platforms.create(1460, 275, 'code6').setScale(1.5,0.3).refreshBody();

    //player
    player = this.physics.add.sprite(Phaser.Math.Between(80, config.width-80), Phaser.Math.Between(80, 550), 'extie');
    this.physics.add.collider(player, platforms);
    cursors = this.input.keyboard.createCursorKeys();

    player.setBounce(0.2);
    player.setCollideWorldBounds(true);

    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('extie', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'turn',
        frames: [ { key: 'extie', frame: 4 } ],
        frameRate: 20
    });

    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('extie', { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1
    });

    
    //files (STARS)
    files = this.physics.add.group({
        key: 'file',
        repeat: 4,
        setXY: { x: Phaser.Math.Between(20, 100), y:  Phaser.Math.Between(120, 300), stepX: Phaser.Math.Between(220, 340) }
    });
    
    files.children.iterate(function (child) {
        child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
    });

    this.physics.add.collider(files, platforms);
    this.physics.add.overlap(player, files, collectFile, null, this);

    //score         -->         (5) "Stars (DATA) Collected" UI on the Top-Right of the screen, updating as stars are collected
    scoreText = this.add.text(1020, 32, 'Data Collected: 0 mb', { fontSize: '32px', fill: '#00ce00' });

    //viruses (BOMBS)
    viruses = this.physics.add.group();
    this.physics.add.collider(viruses, platforms);
    this.physics.add.collider(player, viruses, hitVirus, null, this);

    //application of the old screen filter
    this.add.image(0,0,'binaryBG').setOrigin(0);
}

function update ()
//player movement
{
    if (cursors.left.isDown)
{
    player.setVelocityX(-(playerVelocity));

    player.anims.play('left', true);
}
else if (cursors.right.isDown)
{
    player.setVelocityX(playerVelocity);

    player.anims.play('right', true);
}
else
{
    player.setVelocityX(0);

    player.anims.play('turn');
}

if (cursors.up.isDown && player.body.touching.down)
{
    player.setVelocityY(-330);
}
}

function collectFile (player, file)     //function to modify SCORE, player & bomb SIZE & SPEED, player COLOR
{
    file.disableBody(true, true);

    score += 1;                         //(5) score update mechanics
    scoreText.setText('Data Collected: ' + score + ' mb');

    var newFileX = Phaser.Math.Between(80, 1400);
    var newFileY = Phaser.Math.Between(100, 500);
    var newFile = files.create(newFileX, newFileY, 'file');     //(1)new (FILE) STAR everytime a player collects a STAR object
    newFile.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));

    if (files.countActive(true) === 0)
    {

        files.children.iterate(function (child) {

            child.enableBody(true, child.x, 0, true, true);

        });
    }
    player.setTint(playerColors[currentColorIndex]);            //(2)change player COLOR (cycle thru ROYGBIV) everytime a STAR is collected
    currentColorIndex = (currentColorIndex + 1) % playerColors.length;

    if (score % 5 === 0) {  
        player.setScale(player.scaleX * 1.1, player.scaleY * 1.1);  //(4)every 5 (FILE) STARS collected, player grows in size by 10%

        playerVelocity+=20;
        var virusSpeedIncrease = 50; 
    
        viruses.children.iterate(function (virus) {
            var currentVelocityX = virus.body.velocity.x;
            var currentVelocityY = virus.body.velocity.y;
    
            var newVelocityX = currentVelocityX + virusSpeedIncrease;
            var newVelocityY = currentVelocityY + virusSpeedIncrease;
    
            virus.setVelocity(newVelocityX, newVelocityY);
            virus.setScale(virus.scaleX * 1.12, virus.scaleY * 1.12);
        });
    
        var x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);
    
        var virus = viruses.create(Phaser.Math.Between(100, 1300), 16, 'virus');
        virus.setBounce(1);
        virus.setCollideWorldBounds(true);
        virus.setVelocity(Phaser.Math.Between(-200, 200), 20);
    }
}

function hitVirus (player, virus)      //(6) function to initiate GAME OVER sequence ("LOSE CONDITION upon 'BOMB' COLLISION")
{
    this.physics.pause();

    player.setVisible(false); // (6) Make the player DISAPPEAR after collision with a bomb

    var gameOverScreen = this.add.container(0, 0);
    var graphics = this.add.graphics();
    graphics.fillStyle(0x000000, 0.7);
    graphics.fillRect(0, 0, config.width, config.height);

    bgMusic.src = "./assets/audio/DefeatBG.mp3";
    bgMusic.load();

    // (6) and display a GAME OVER message
    var gameOverText = this.add.text(config.width / 2, config.height / 2 - 50, 'USB Corrupted.\n\n\n', {
        fontSize: '64px',
        fontWeight: 'bold',
        fill: '#00ce0f',
        align: 'center'
    }).setOrigin(0.5);

    var scoreText = this.add.text(config.width / 2, config.height / 2 + 50, 'Amount of Data Backed Up:\n\n' + score +' Megabytes\n\n', {
        fontSize: '32px',
        fill: '#00ce00',
        align: 'center'
    }).setOrigin(0.5);

    //some modifications to the Restart Button to make it more noticeable
    var restartButton = this.add.text(config.width / 2, config.height / 2 + 150, '> > > Restart? < < <', {
        fontSize: '52px',
        fontWeight: 'bold',
        fill: '#00ce00',
        align: 'center',
        textDecoration: 'underline'
    }).setOrigin(0.5);
    
    restartButton.setInteractive();
    
    restartButton.on('pointerover', function () {
        document.body.style.cursor = 'pointer';
    });
    
    restartButton.on('pointerout', function () {
        document.body.style.cursor = 'default';
    });
    
    //ways to restart
    function restartGame() {
        location.reload();
    }

    restartButton.on('pointerup', function () {
        restartGame();
    });

    function handleKeyPress(event) {
        if (event.code === "Space") {
            restartGame();
        }
    }
    
    document.addEventListener('keydown', handleKeyPress);

    var restartText = this.add.text(config.width / 2, config.height / 2 + 200, '\n\n\nClick the button, or press SPACE to reboot computer.', {
        fontSize: '18px',
        fontWeight: 'bold',
        fill: '#00ce0f',
        align: 'center'
    }).setOrigin(0.5);

    gameOverScreen.add([graphics, gameOverText, scoreText, restartButton, restartText]);
}
//(7) assets are from HackerTyper.com (the platforms), freepik (the filter), and made by yours truly (player spritesheet, files, virus assets)