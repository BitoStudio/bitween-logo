let permissionGranted = false;
let angle1 = 0;
let angleVelocity1 = 0;
let angleAcceleration1 = 0;
let angle2 = 0;
let angleVelocity2 = 0;
let angleAcceleration2 = 0;
let gravity = 0.00002;
let damping = 0.995;

// Initial angles
let initialAngle1;
let initialAngle2;

// Return to initial state variables
let returnForce = 0.0002; // Strength of the return force
let returnThreshold = 1; // Threshold to determine if phone is horizontal

// Stick properties
let stickLength = 300;
let stickMass = 10;

// Balls properties
let ball1, ball2, cube1, cube2;

function setup() {
  ball1 = {
    mass: random(5, 20),
    radius: 40,
    position: { x: 0, y: 0 }
  };
  
  ball2 = {
    mass: random(5, 20),
    radius: 40,
    position: { x: 0, y: 0 }
  };
  
  cube1 = {
    mass: random(5, 20),
    length: 40,
    position: { x: 0, y: 0 }
  };
  
  cube2 = {
    mass: random(5, 20),
    length: 40,
    position: { x: 0, y: 0 }
  };

  initialAngle1 = PI/4;
  initialAngle2 = PI/4 + PI/2;

  createCanvas(windowWidth, windowHeight);
  
  // Check for device orientation permission
  if (typeof(DeviceOrientationEvent) !== 'undefined' && typeof(DeviceOrientationEvent.requestPermission) === 'function') {
    // iOS 13+ device
    DeviceOrientationEvent.requestPermission()
      .catch(() => {
        let button = createButton("Click to allow access to sensors");
        button.style("font-size", "24px");
        button.center();
        button.mousePressed(requestAccess);
        throw error;
      })
      .then(() => {
        permissionGranted = true;
      });
  } else {
    // Non iOS 13 device
    permissionGranted = true;
  }
  
  // Initialize the system with initial angles
  angle1 = initialAngle1;
  angle2 = initialAngle2;
  updatePositions();
}

function requestAccess() {
  DeviceOrientationEvent.requestPermission()
    .then(response => {
      if (response == 'granted') {
        permissionGranted = true;
      } else {
        permissionGranted = false;
      }
    })
    .catch(console.error);
  
  this.remove();
}

function updatePositions() {
  // Calculate positions of the balls based on the stick angle
  ball1.position.x = width/2 + cos(angle1) * stickLength/2;
  ball1.position.y = height/2 + sin(angle1) * stickLength/2;
  
  ball2.position.x = width/2 - cos(angle1) * stickLength/2;
  ball2.position.y = height/2 - sin(angle1) * stickLength/2;

  cube1.position.x = width/2 + cos(angle2) * stickLength/2;
  cube1.position.y = height/2 + sin(angle2) * stickLength/2;
  
  cube2.position.x = width/2 - cos(angle2) * stickLength/2;
  cube2.position.y = height/2 - sin(angle2) * stickLength/2;
}

function calculateCenterOfMassofBalls() {
  // Calculate the center of mass of the system
  const totalMass = ball1.mass + ball2.mass + stickMass;
  
  // For the stick, assume mass is distributed evenly along its length
  // Center of stick is always at (width/2, height/2)
  
  const centerX = (ball1.position.x * ball1.mass + ball2.position.x * ball2.mass + width/2 * stickMass) / totalMass;
  const centerY = (ball1.position.y * ball1.mass + ball2.position.y * ball2.mass + height/2 * stickMass) / totalMass;
  
  return { x: centerX, y: centerY };
}

function calculateCenterOfMassofCubes() {
  // Calculate the center of mass of the system
  const totalMass = cube1.mass + cube2.mass + stickMass;
  
  // For the stick, assume mass is distributed evenly along its length
  // Center of stick is always at (width/2, height/2)
  
  const centerX = (cube1.position.x * cube1.mass + cube2.position.x * cube2.mass + width/2 * stickMass) / totalMass;
  const centerY = (cube1.position.y * cube1.mass + cube2.position.y * cube2.mass + height/2 * stickMass) / totalMass;
  
  return { x: centerX, y: centerY };
}

function isPhoneHorizontal(dx, dy) {
  // Check if the phone is relatively horizontal
  // This is true when both rotationX and rotationY are close to zero
  return abs(dx) < returnThreshold && abs(dy) < returnThreshold;
}

function draw() {
  if (!permissionGranted) {
    background(200);
    textSize(24);
    textAlign(CENTER, CENTER);
    text("Please grant permission to access device orientation", width/2, height/2);
    return;
  }
  
  background(240);
  
  // Initialize forces
  let returnToInitialState = false;
  let dx = 0, dy = 0;
  
  // Apply physics based on device orientation
  if (rotationY !== undefined && rotationX !== undefined) {
    // Get the tilt of the device and use it as force
    dx = constrain(rotationY, -3, 3);
    dy = constrain(rotationX, -3, 3);
    
    // Check if the phone is horizontal
    returnToInitialState = isPhoneHorizontal(dx, dy);
    
    if (!returnToInitialState) {
      // Normal physics behavior - respond to tilt
      const com1 = calculateCenterOfMassofBalls();
      const com2 = calculateCenterOfMassofCubes();
      
      // Calculate the offset of the center of mass from the pivot point
      const offsetX1 = com1.x - width/2;
      const offsetY1 = com1.y - height/2;
      const offsetX2 = com2.x - width/2;
      const offsetY2 = com2.y - height/2;
      
      // Calculate the torque (cross product simplified for 2D)
      const torque1 = offsetX1 * dy - offsetY1 * dx;
      const torque2 = offsetX2 * dy - offsetY2 * dx;
      
      // Apply the torque as angular acceleration
      angleAcceleration1 = -torque1 * gravity;
      angleAcceleration2 = -torque2 * gravity;
    }
  } else {
    // If no sensor data, use a simple oscillation for testing
    angleAcceleration1 = -gravity * sin(angle1);
    angleAcceleration2 = -gravity * sin(angle2);
  }
  
  // When phone is horizontal, apply return force toward initial state
  if (returnToInitialState) {
    // Calculate angle differences and apply return force proportional to the difference
    const angleDiff1 = (initialAngle1 - (angle1 % (2 * PI))) % (2 * PI);
    const angleDiff2 = (initialAngle2 - (angle2 % (2 * PI))) % (2 * PI);
    
    // Apply force to gradually return to initial state
    angleAcceleration1 = angleDiff1 * returnForce;
    angleAcceleration2 = angleDiff2 * returnForce;
  }
  
  // Update physics
  angleVelocity1 += angleAcceleration1;
  angleVelocity1 *= damping; // Apply damping to simulate friction
  angle1 += angleVelocity1;

  angleVelocity2 += angleAcceleration2;
  angleVelocity2 *= damping; // Apply damping to simulate friction
  angle2 += angleVelocity2;
  
  // Update positions based on the new angle
  updatePositions();
  
  // Draw the system
  strokeWeight(10);
  stroke(0);
  line(ball1.position.x, ball1.position.y, ball2.position.x, ball2.position.y);
  line(cube1.position.x, cube1.position.y, cube2.position.x, cube2.position.y);
  
  // Draw the bezier

  // Draw the balls
  noStroke();
  
  // Ball 1
  fill(0);
  ellipse(ball1.position.x, ball1.position.y, ball1.radius * 2, ball1.radius * 2);
  
  // Ball 2
  fill(0);
  ellipse(ball2.position.x, ball2.position.y, ball2.radius * 2, ball2.radius * 2);
  
  // Draw the cubes
  fill(0);
  rectMode(CENTER);
  rect(cube1.position.x, cube1.position.y, cube1.length * 2);
  
  fill(0);
  rectMode(CENTER);
  rect(cube2.position.x, cube2.position.y, cube2.length * 2);

  // Debug information - uncomment if needed
  if (returnToInitialState) {
    fill(0, 200, 0);
    noStroke();
    ellipse(width/2, height/2, 20, 20); // Green indicator when returning to initial state
  }
  
  // Debug text
  fill(0);
  textSize(16);
  textAlign(LEFT, TOP);
  if (returnToInitialState) {
    text("Returning to initial state", 20, 20);
  }
  
  // Optional: display more debugging info
  
  text(`Angle1: ${angle1.toFixed(2)}, Target: ${initialAngle1.toFixed(2)}`, 20, 40);
  text(`Angle2: ${angle2.toFixed(2)}, Target: ${initialAngle2.toFixed(2)}`, 20, 60);
  if (rotationX !== undefined && rotationY !== undefined) {
    text(`Device rotation: X=${rotationX.toFixed(2)}, Y=${rotationY.toFixed(2)}`, 20, 80);
  }
  
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  updatePositions();
}

// For desktop testing - mouse click to give the system a random push
function mousePressed() {
  angleVelocity1 += random(-0.05, 0.05);
  angleVelocity2 += random(-0.05, 0.05);
}