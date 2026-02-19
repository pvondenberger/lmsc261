const drawing = p5 => {

    p5.setup = () => {
        p5.createCanvas(600, 600);
    }

    p5.draw = () => {
        p5.background(10);

        let numCircles = 300;

        let minRad = 20;
        let maxRad = 180;
        let radDiffernece = (maxRad - minRad)/numCircles;

        let minColor = 0;
        let maxColor = 255;
        let colorDifference = (maxColor - minColor)/numCircles;
        
        for(let i = 0; i < numCircles; i++){
        let radius = minRad + i * radDiffernece;
        let colorR = (50 + i * colorDifference);
        let colorG = (p5.mouseY);
        let colorB = (p5.mouseX);
        p5.fill(colorR, colorG, colorB);
        p5.noStroke();
        p5.circle((p5.mouseX/numCircles) * i, (p5.mouseY/numCircles) * i, radius);

        }
    }
}

new p5(drawing);