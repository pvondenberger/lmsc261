const drawing = p5 => {

    //ts dont work but looks cool either way
    p5.rectMode(p5.center);
    p5.angleMode(p5.degrees);

    //vars
    let rects = [];
    let ripples = [];
    let columns;
    let rows;
    let size = 20;
    let radius = 200;
    let explosionRadius = 800;
    let mode = 0;
    let followMode = 0;
    let hideUI = 0;
    //glow vars
    let glowX = 0;
    let glowY = 0;
    let glowSize = 0;
    let glowAlpha = 0;
    //BOAT vars (goat)
    let boatX = -50;
    let boatTargetX = 0;
    let boatBaseY = 300;
    let boatY = 300;
    let boatAngle = 0;
    let boatVY = 0;

    //defining key press actions
    p5.keyPressed = () => {
        if(p5.key === 's' || p5.key === 'S'){
            mode = (mode + 1) % 3;

            if(mode === 1){
                boatX = -50;
                boatY = boatBaseY;
                boatAngle = 0;
            }
        }
        if(p5.key === 'f' || p5.key === 'F'){
            followMode = (followMode + 1) % 2;
        }
        if(p5.key === 'h' || p5.key === 'H'){
            hideUI = (hideUI + 1) % 2;
        }
    }


    //ripples class for mode 2
    class Ripple {
    constructor(x, y){
        this.x = x;
        this.y = y;
        this.radius = 0;
        this.speed = 4;
        this.strength = 50;
        this.life = 300 + (p5.windowWidth * 0.1);
    }

    update(){
        this.radius += this.speed;
        this.life -= 4;
    }

    isDead(){
        return this.life <= 0;
    }

    display(){
        p5.push();
        p5.noFill();
        p5.stroke(255, this.life * 0.4)
        p5.strokeWeight(0.5 * this.life * 0.2);
        p5.circle(this.x, this.y, this.radius * 2);
        p5.pop();
    }
    }

    //function for ripple calc
    function getRippleOffset(x, y){
        let totalOffset = 0;
        for(let ripple of ripples) {
            let d = p5.dist(x, y, ripple.x, ripple.y);
            let waveWidth = 40;
            let distFromRing = Math.abs(d - ripple.radius);
            if(distFromRing < waveWidth){
                let fallOff = 1 - distFromRing / waveWidth;
                totalOffset += Math.sin((distFromRing / waveWidth) * Math.PI) * ripple.strength * fallOff * (ripple.life / 255);
            }
        }
        return totalOffset;
    }

    //rectangles & functions
    class rectangle {
    constructor(x, y, size){
        this.x = x;
        this.y = y;
        this.homeX = x;
        this.homeY = y;
        this.size = size;

        this.vx = 0;
        this.vy = 0;

        this.angle = 0;
        this.targetAngle = 0;
    }
    
    //oceannn
    wave(){
        let time = p5.frameCount * 0.02;
        let freq = p5.map(p5.noise(time * 0.2), 0, 1, 0.02, 0.07);
        let noise = p5.noise(this.homeX * 0.5, this.homeY * 0.5, time);
        let phase = this.homeX * (freq/1000) + time;
        let baseWave = Math.sin(phase) * 25;
        let rippleWave = getRippleOffset(this.homeX, this.homeY);
        let xOffset = p5.map(noise, 0, 1, -15, 15);
        this.x = p5.lerp(this.x, this.homeX + xOffset, 0.08);
        this.y = p5.lerp(this.y, this.homeY + baseWave + rippleWave, 0.08);
        this.targetAngle = Math.cos(phase) * 0.04 + (Math.PI / 2);
    }

    //func for repelling around mouse pos
    repel(){
        let dx = this.x - p5.mouseX;
        let dy = this.y - p5.mouseY;
        let dist = p5.sqrt(dx * dx + dy * dy);

        if(dist < radius && dist > 0){
            let force = (radius - dist) / radius * 2; //changes how the force affects the rects !!

            dx /= dist;
            dy /= dist;

            this.vx += dx * force;
            this.vy += dy * force;
        }
    }

    //func for exploding upon click
    explode(clickX, clickY){
        let dx = this.x - clickX;
        let dy = this.y - clickY;
        let dist = p5.sqrt(dx * dx + dy * dy);

        if(dist < explosionRadius && dist > 0){
            let force = (explosionRadius - dist)/explosionRadius * 15; //change amount of explosion

            dx /= dist;
            dy /= dist;

            this.vx += dx * force;
            this.vy += dy * force;
        }
    }

    //updates per frame
    update(){
        this.x += this.vx;
        this.y += this.vy;

        this.vx *= 0.9;
        this.vy *= 0.9;

        this.x = p5.lerp(this.x, this.homeX, 0.05);
        this.y = p5.lerp(this.y, this.homeY, 0.05);
    }

    //rotation around mouse pos (also draws rects)
    rotation(){
        let additionalAngle;
        if(mode === 0 || mode === 1){
            additionalAngle = 0;
        } else if (mode === 2){
            additionalAngle = Math.PI / 2;
        }
        if(mode === 0 || mode === 2){
        this.targetAngle = p5.atan2(p5.mouseY - this.y, p5.mouseX - this.x);
        }
        let diff = Math.atan2(Math.sin(this.targetAngle - this.angle), Math.cos(this.targetAngle - this.angle));
        this.angle += diff * 0.08
        p5.push();
        p5.translate(this.x, this.y);
        p5.rotate(this.angle + additionalAngle);
        p5.rect(0, 0, this.size / 4, this.size);
        p5.pop();
    }

    //follow mouse pos
    follow(){
        let dx = p5.mouseX - this.x;
        let dy = p5.mouseY - this.y;
        let dist = p5.sqrt(dx * dx + dy * dy);
        // let followRadius = 150; (in case of different effect)
        if (dist > 0){
            let force = 1.5;
            dx /= dist;
            dy /= dist;
            this.vx += dx * force;
            this.vy += dy * force;
        }
    }

    //gather upon click (mode 3)
    gather(){
        let dx = p5.mouseX - this.x;
        let dy = p5.mouseY - this.y;
        let dist = p5.sqrt(dx * dx + dy * dy);
        if (dist > 0){
            let force = 5;
            dx /= dist;
            dy /= dist;
            this.vx += dx * force;
            this.vy += dy * force;
        }
    }

    //rects bust all over the screen (mode 3)
    bust(){
        let dx = this.x - p5.clickX;
        let dy = this.y - p5.clickY;
        let dist = p5.sqrt(dx * dx + dy * dy);
        let burstRadius = p5.width * 200;
        if(dist < burstRadius && dist > 0){
            let force = ((burstRadius - dist) / burstRadius) * 200;
            dx /= dist;
            dy /= dist;
            this.vx += dx * force;
            this.vy += dy * force;
        }
    }
}

//little key for help
function drawUI() {
    let padding = 16;
    let panelX = 20;

    p5.push();

    p5.textAlign(p5.LEFT, p5.TOP);
    p5.textFont("monospace");
    let fontSize = p5.width * 0.02;
    fontSize = p5.constrain(fontSize, 14, 24);
    p5.textSize(fontSize);

    let lineHeight = p5.textSize() * 1.4;

    let modeTitle = "";
    if(mode === 0){
        modeTitle = "Mode 1: Explosion";
    } else if (mode === 1){
        modeTitle = "Mode 2: Ocean";
    } else if (mode === 2){
        modeTitle = "Mode 3: Follow"
    }
    let lines = [
        modeTitle,
        "S: Cycle Modes",
        "H: Hide",
    ];

    if (mode === 0) {
        lines.push("Click: Explosion");
    } else if (mode === 1) {
        lines.push("Click: Create Ripples");
    } else if (mode === 2) {
        lines.push("F: Change Follow Mode");
        lines.push("Click: Gather");
    }

    let longestLine = 0;

    for (let i = 0; i < lines.length; i++) {
        let w = p5.textWidth(lines[i]);
        if (w > longestLine) {
            longestLine = w;
        }
    }

    let panelW = longestLine + padding * 2;
    let panelH = lines.length * lineHeight + padding * 2;

    let panelY = p5.height - panelH - 20;

    p5.rectMode(p5.CORNER);
    p5.noStroke();
    p5.fill(0, 150);
    p5.rect(panelX, panelY, panelW, panelH, 10);

    p5.fill(255);
    for (let i = 0; i < lines.length; i++) {
        p5.text(lines[i], panelX + padding, panelY + padding + i * lineHeight);
    }

    p5.pop();
}

//place for functions outside of classes
//function that changes grid based on window size !!!!!
function buildGrid(){
        columns = Math.floor(p5.width / size);
        rows = Math.floor(p5.height / size);
        rects = []
        for (let i = 0; i < columns; i++){
            rects[i] = [];
            for(let j = 0; j < rows; j++){
                rects[i][j] = new rectangle(
                size / 2 + i * size,
                size / 2 + j * size,
            size);
        }
    }
}

    // same as rects but for boat model
    function updateBoat(){
        let time = p5.frameCount * 0.02;
        boatX = p5.lerp(boatX, boatTargetX, 0.01);
        let freq = p5.map(p5.noise(time * 0.2), 0, 1, 0.02, 0.07);
        let phase = boatX * (freq/1000) + time;
        let yOffset = Math.sin(phase) * 15;
        let rippleOffset = getRippleOffset(boatX, boatBaseY);
        boatY = p5.lerp(boatY, boatBaseY + yOffset + rippleOffset, 0.08);
        boatAngle = Math.cos(phase) * 0.001;
        boatAngle += rippleOffset * 0.001; //post ripple shivers
    }
    //identifies Y velocity for boat after switching out of mode 2
    function fallBoat(){
        boatVY += 0.3;
        boatY += boatVY;
        boatAngle += 0.0002;
        return;
    }
    //shape of boat
    function drawBoat(){
        p5.push();
        p5.translate(boatX, boatY);
        p5.rotate(p5.degrees(boatAngle));
        p5.fill(160, 100, 60);
        p5.noStroke();
        p5.quad(-25, 0, 25, 0, 15, 12, -15, 12);
        p5.stroke(255);
        p5.line(0, 0, 0, -30);
        p5.noStroke();
        p5.fill(240);
        p5.triangle(0, -30, 0, -5, 18, -15);
        p5.pop();
    }

    //setup
    p5.setup = () => {
        p5.createCanvas(p5.windowWidth, p5.windowHeight);
        buildGrid();
        for (let i = 0; i < columns; i++){
            rects[i] = [];
            for(let j = 0; j < rows; j++){
                rects[i][j] = new rectangle(
                    size / 2 + i * size,
                    size / 2 + j * size,
                    size
                );
            }
        }
    }

    p5.windowResized = () => {
        p5.resizeCanvas(p5.windowWidth, p5.windowHeight);
        buildGrid();
        explosionRadius = explosionRadius * (p5.windowWidth);
    }

    //describes what happens upon mousePressed
    p5.mousePressed = () => {
        if(mode === 0){
        glowX = p5.mouseX;
        glowY = p5.mouseY;
        glowSize = 5; //size of circs
        glowAlpha = 100; //brightness
            for (let i = 0; i < columns; i++){
                for (let j = 0; j < rows; j++){
                rects[i][j].explode(p5.mouseX, p5.mouseY);
                }
            }
        } else {
            ripples.push(new Ripple(p5.mouseX, p5.mouseY));
        }
    }

    //actually displaying the shit
    p5.draw = () => {
        p5.background(10);
        // "background explosion"
        if(glowAlpha > 0){
            p5.noStroke();
            for(let i = 0; i < 300; i++){ //amount of circs
                p5.fill(255, glowAlpha / (i + 1)); //fade outwards of circs
                p5.circle(glowX, glowY, glowSize + i * 2); //increments of circls
            }
            glowAlpha *= 0.9; //fade time
        }
        // create the rects & execute functions for rotation and repel & return to original pos
        for(let i = 0; i < columns; i++){
            for(let j = 0; j < rows; j++){
                p5.noStroke();
                p5.fill (255);
                rects[i][j].update();
                rects[i][j].rotation();
                if(mode === 0){
                    rects[i][j].repel();
                    rects[i][j].rotation();
                } else if (mode === 1){
                    rects[i][j].wave();
                } else if (mode === 2){
                    if(p5.mouseIsPressed){
                        rects[i][j].gather();
                    } else if (p5.mouseReleased || followMode === 0){
                        rects[i][j].bust(p5.mouseX, p5.mouseY);
                    } else if (p5.mouseReleased || followMode === 1){
                        rects[i][j].follow();
                    }
                    rects[i][j].rotation();
                }
            }
        }
        //create the ripples
        if(mode === 1){
        for(let i = ripples.length - 1; i >= 0; i--){
            ripples[i].update();
            ripples[i].display();
                if(ripples[i].isDead()){
                    ripples.splice(i, 1);
                }
            }
        } else {
            ripples = [];
        }

        if (mode === 1){
        boatVY = 0;
        boatTargetX = p5.windowWidth / 2;
        updateBoat();
        drawBoat();
        } else {
        boatTargetX = p5.windowWidth / 2;
        fallBoat();
        drawBoat();
        }
        if(hideUI === 0){
        drawUI();
        }
    };
}

new p5(drawing);