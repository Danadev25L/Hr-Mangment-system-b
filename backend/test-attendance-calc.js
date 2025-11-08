// Test attendance time calculations

// Scenario 1: Check in at 9:00 AM when scheduled start is 8:00 AM
const scheduledStart = new Date();
scheduledStart.setHours(8, 0, 0, 0);

const checkInTime = new Date();
checkInTime.setHours(9, 0, 0, 0);

const isLate = checkInTime > scheduledStart;
const lateMinutes = Math.floor((checkInTime - scheduledStart) / (1000 * 60));

console.log('=== Check-In Test ===');
console.log('Scheduled Start:', scheduledStart.toLocaleTimeString());
console.log('Check In Time:', checkInTime.toLocaleTimeString());
console.log('Is Late:', isLate);
console.log('Late Minutes:', lateMinutes);
console.log('Late Display:', lateMinutes >= 60 ? `${Math.floor(lateMinutes/60)}h ${lateMinutes%60}m` : `${lateMinutes}m`);

// Scenario 2: Check out at 3:00 PM when scheduled end is 5:00 PM
const scheduledEnd = new Date();
scheduledEnd.setHours(17, 0, 0, 0);

const checkOutTime = new Date();
checkOutTime.setHours(15, 0, 0, 0);

const isEarlyDeparture = checkOutTime < scheduledEnd;
const earlyDepartureMinutes = Math.floor((scheduledEnd - checkOutTime) / (1000 * 60));

console.log('\n=== Check-Out Test ===');
console.log('Scheduled End:', scheduledEnd.toLocaleTimeString());
console.log('Check Out Time:', checkOutTime.toLocaleTimeString());
console.log('Is Early Departure:', isEarlyDeparture);
console.log('Early Departure Minutes:', earlyDepartureMinutes);
console.log('Early Display:', earlyDepartureMinutes >= 60 ? `${Math.floor(earlyDepartureMinutes/60)}h ${earlyDepartureMinutes%60}m` : `${earlyDepartureMinutes}m`);

// Scenario 3: Working hours calculation
const workingMinutes = Math.floor((checkOutTime - checkInTime) / (1000 * 60));
const workingHours = (workingMinutes / 60).toFixed(2);

console.log('\n=== Working Hours Test ===');
console.log('Check In:', checkInTime.toLocaleTimeString());
console.log('Check Out:', checkOutTime.toLocaleTimeString());
console.log('Working Minutes:', workingMinutes);
console.log('Working Hours:', workingHours + 'h');
