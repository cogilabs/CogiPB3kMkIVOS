
export function radioWave() {
    const waveLength = 600; // Total length of the wave
    const numPoints = 100; // Number of points in the wave
    const centerY = 200; // Center Y position
    const minAmplitude = 50;
    const maxAmplitude = 150;

    function generateSmoothSineLikeWave() {
        let path = `M 0,${centerY}`;
        let previousY = centerY;

        for (let i = 1; i <= numPoints; i++) {
            const x = (waveLength / numPoints) * i;
            const amplitude = minAmplitude + Math.random() * (maxAmplitude - minAmplitude);
            const y = centerY + amplitude * Math.sin(i * 0.2 * Math.PI); // Fixed frequency

            const controlX1 = x - (waveLength / numPoints) / 2;
            const controlY1 = previousY;
            const controlX2 = x - (waveLength / numPoints) / 2;
            const controlY2 = y;

            path += ` C ${controlX1},${controlY1} ${controlX2},${controlY2} ${x},${y}`;

            previousY = y;
        }
        return path;
    }

    // Generate a single pre-generated sine-like pattern
    const wavePathData = generateSmoothSineLikeWave();

    // Set the generated path data to the wave
    document.getElementById('wave').setAttribute('d', wavePathData);

    // Clone the wave to create a seamless loop effect
    const waveClone = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    waveClone.setAttribute('d', wavePathData);
    waveClone.setAttribute('fill', 'none');
    waveClone.setAttribute('stroke', 'var(--light)');
    waveClone.setAttribute('stroke-width', '2');
    waveClone.setAttribute('transform', 'translate(600, 0)');
    document.getElementById('wave-path').appendChild(waveClone);

    function createGraduations() {
        const verticalGraduations = document.getElementById('vertical-graduations');
        const horizontalGraduations = document.getElementById('horizontal-graduations');

        // Vertical graduations
        for (let y = 0; y <= 400; y += 10) {
            if (y >= 390) continue;
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', (y+10) % 50 === 0 ? 2 : 6); // Longer graduation for multiples of 50
            line.setAttribute('x2', 10);
            line.setAttribute('y1', y);
            line.setAttribute('y2', y);
            line.setAttribute('stroke', 'var(--light)');
            line.setAttribute('stroke-width', '2');
            verticalGraduations.appendChild(line);
        }

        // Horizontal graduations
        for (let x = 0; x <= 600; x += 10) {
            if (x <= 10) continue;
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x);
            line.setAttribute('x2', x);
            line.setAttribute('y1', 391);
            line.setAttribute('y2', (x-10) % 50 === 0 ? 396 : 393); // Longer graduation for multiples of 50
            line.setAttribute('stroke', 'var(--light)');
            line.setAttribute('stroke-width', '2');
            horizontalGraduations.appendChild(line);
        }
    }

    createGraduations();
}